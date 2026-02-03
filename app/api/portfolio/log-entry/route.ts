import { z } from "zod";
import { requireUser } from "@/src/auth/require-user";
import { prisma } from "@/src/core/db/prisma";
import { jsonCreated, jsonError } from "@/src/utils/responses";
import { executeTool } from "@/src/tools/execute";
import { toolRegistry } from "@/src/tools/registry";
import { RiskSkill } from "@/src/skills/RiskSkill";
import { applyTradeToPosition } from "@/src/services/portfolio-ledger.service";
import {
  createRiskSnapshot,
  sectorExposureFromPositions,
} from "@/src/services/risk-snapshot.service";

const schema = z.object({
  portfolio_id: z.string().min(1),
  symbol: z.string().min(1),
  // Safe language: this endpoint logs a past trade; it does not execute anything.
  direction: z.enum(["BUY", "SELL"]),
  quantity: z.number().finite().positive(),
  price: z.number().finite().nonnegative(),
  fee_amount: z.number().finite().nonnegative().optional(),
  timestamp: z.string().datetime().optional(),
  asset_class: z.string().min(1).default("Unknown"),
  sector: z.string().min(1).default("Unknown"),
  tags: z.array(z.string().min(1)).optional().default([]),
});

function round8(n: number) {
  return Math.round(n * 1e8) / 1e8;
}

function estimateFeeAmount(notional: number) {
  // Deterministic estimate for manual logs when fee is omitted.
  // 10 bps default (0.10%). This is not execution; it's a post-trade bookkeeping estimate.
  const defaultBps = 10;
  return round8((notional * defaultBps) / 10_000);
}

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400);

  const timestamp = parsed.data.timestamp ? new Date(parsed.data.timestamp) : new Date();

  const portfolio = await prisma.portfolio.findFirst({
    where: { id: parsed.data.portfolio_id, user_id: auth.user.id },
    select: { id: true },
  });
  if (!portfolio) return jsonError("Portfolio not found", 404);

  // Synchronous pipeline (single Node runtime): persist -> deterministic tools -> link context -> journal draft.
  const result = await prisma.$transaction(async (tx) => {
    // 1) Persist TradeEvent
    const notional = parsed.data.quantity * parsed.data.price;
    const feeAmount =
      typeof parsed.data.fee_amount === "number"
        ? parsed.data.fee_amount
        : estimateFeeAmount(notional);
    const feePct = notional === 0 ? 0 : feeAmount / notional;
    const netAmount = notional - feeAmount;

    const trade = await tx.tradeEvent.create({
      data: {
        portfolio_id: portfolio.id,
        symbol: parsed.data.symbol,
        side: parsed.data.direction,
        size: parsed.data.quantity,
        price: parsed.data.price,
        fee_amount: round8(feeAmount),
        fee_pct: round8(feePct),
        net_amount: round8(netAmount),
        timestamp,
      },
    });

    // 2) Update ledger (positions)
    await applyTradeToPosition({
      portfolioId: portfolio.id,
      symbol: parsed.data.symbol,
      side: parsed.data.direction,
      quantity: parsed.data.quantity,
      price: parsed.data.price,
      assetClass: parsed.data.asset_class,
      sector: parsed.data.sector,
    });

    // 3) Tool chaining (deterministic)
    const feeTool = toolRegistry["portfolio.feeImpact"];
    if (!feeTool) throw new Error("FeeImpact tool missing");

    const feeOut = await executeTool(
      feeTool,
      {
        tradeEvents: [
          {
            symbol: parsed.data.symbol,
            side: parsed.data.direction,
            size: parsed.data.quantity,
            price: parsed.data.price,
            fee: feeAmount,
          },
        ],
      },
      { user: { id: auth.user.id, email: auth.user.email, role: auth.user.role } },
    );

    // New composition approximation: market value derived from cost basis (avg_cost*qty), except last traded symbol uses trade price.
    const positions = await tx.position.findMany({ where: { portfolio_id: portfolio.id } });
    const stressPositions = positions
      .filter((p) => Number(p.quantity) > 0)
      .map((p) => {
        const qty = Number(p.quantity);
        const avg = Number(p.avg_cost);
        const usePrice = p.symbol === parsed.data.symbol ? parsed.data.price : avg;
        return {
          symbol: p.symbol,
          sector: p.sector,
          marketValue: qty * usePrice,
        };
      });

    const riskSkill = new RiskSkill();
    const stress = await riskSkill.stressTest(
      {
        positions: stressPositions,
        scenario: { sector: parsed.data.sector, shockPct: -0.1 },
      },
      { user: { id: auth.user.id, email: auth.user.email, role: auth.user.role } },
    );

    // Use stress PnL magnitude as a conservative VaR proxy for MVP (deterministic, explainable).
    const varProxy = Math.abs(stress.pnl);
    const exposure = sectorExposureFromPositions(stressPositions);

    const riskSnapshot = await createRiskSnapshot({
      portfolioId: portfolio.id,
      varValue: varProxy,
      beta: 1,
      exposure,
      timestamp,
    });

    // 4) Context linking: find recent alert (24h) by symbol/sector/portfolio
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const relatedAlert = await tx.alert.findFirst({
      where: {
        user_id: auth.user.id,
        created_at: { gte: since },
        OR: [
          { portfolio_id: portfolio.id },
          { symbol: parsed.data.symbol },
          { sector: parsed.data.sector },
          { title: { contains: parsed.data.symbol, mode: "insensitive" } },
          { message: { contains: parsed.data.symbol, mode: "insensitive" } },
          { title: { contains: parsed.data.sector, mode: "insensitive" } },
          { message: { contains: parsed.data.sector, mode: "insensitive" } },
        ],
      },
      orderBy: { created_at: "desc" },
      select: { id: true },
    });

    // 5) Journal draft (connector node)
    const journal = await tx.journalEntry.create({
      data: {
        tradeEventId: trade.id,
        riskSnapshotId: riskSnapshot.id,
        relatedAlertId: relatedAlert?.id ?? null,
        thesis: null,
        tags: parsed.data.tags,
      },
      select: { id: true },
    });

    return {
      trade,
      journalId: journal.id,
      computed: {
        feeImpact: feeOut,
        riskSnapshotId: riskSnapshot.id,
      },
    };
  });

  return jsonCreated({
    trade: result.trade,
    journal_id: result.journalId,
    computed: result.computed,
    disclaimer:
      "Pragmas OS is an analytics tool. We do not execute trades or provide financial advice.",
  });
}
