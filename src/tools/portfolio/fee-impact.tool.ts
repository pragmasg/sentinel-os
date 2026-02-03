import { z } from "zod";
import type { ToolDefinition } from "@/src/tools/types";

const inputSchema = z.object({
  tradeEvents: z
    .array(
      z.object({
        symbol: z.string().min(1),
        side: z.enum(["BUY", "SELL"]),
        size: z.number().finite().positive(),
        price: z.number().finite().nonnegative(),
        fee: z.number().finite().nonnegative().default(0),
      }),
    )
    .default([]),
});

export type FeeImpactOutput = {
  totalNotional: number;
  totalFees: number;
  feeDragPct: number; // totalFees / totalNotional
  bySymbol: Record<string, { fees: number; notional: number; feeDragPct: number }>;
};

export const portfolioFeeImpactTool: ToolDefinition<typeof inputSchema, FeeImpactOutput> = {
  name: "portfolio.feeImpact",
  description: "Compute fee drag and fee impact across trade events.",
  securityLevel: "USER",
  inputSchema,
  execute: async (input) => {
    const bySymbol: Record<string, { fees: number; notional: number }> = {};

    for (const t of input.tradeEvents) {
      const notional = t.size * t.price;
      const row = bySymbol[t.symbol] ?? { fees: 0, notional: 0 };
      row.fees += t.fee;
      row.notional += notional;
      bySymbol[t.symbol] = row;
    }

    const totalFees = Object.values(bySymbol).reduce((s, v) => s + v.fees, 0);
    const totalNotional = Object.values(bySymbol).reduce((s, v) => s + v.notional, 0);
    const feeDragPct = totalNotional === 0 ? 0 : totalFees / totalNotional;

    const outBySymbol: FeeImpactOutput["bySymbol"] = {};
    for (const [symbol, v] of Object.entries(bySymbol)) {
      outBySymbol[symbol] = {
        fees: v.fees,
        notional: v.notional,
        feeDragPct: v.notional === 0 ? 0 : v.fees / v.notional,
      };
    }

    return { totalNotional, totalFees, feeDragPct, bySymbol: outBySymbol };
  },
};
