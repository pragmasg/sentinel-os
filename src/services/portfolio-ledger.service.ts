import { prisma } from "@/src/core/db/prisma";

export async function applyTradeToPosition(params: {
  portfolioId: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  price: number;
  assetClass: string;
  sector: string;
}) {
  const existing = await prisma.position.findFirst({
    where: { portfolio_id: params.portfolioId, symbol: params.symbol },
  });

  if (!existing) {
    if (params.side === "SELL") {
      // Logging a sell without an existing position is allowed, but we won't create a negative position.
      return null;
    }

    return prisma.position.create({
      data: {
        portfolio_id: params.portfolioId,
        symbol: params.symbol,
        quantity: params.quantity,
        avg_cost: params.price,
        asset_class: params.assetClass,
        sector: params.sector,
      },
    });
  }

  const prevQty = Number(existing.quantity);
  const prevAvg = Number(existing.avg_cost);

  if (params.side === "BUY") {
    const newQty = prevQty + params.quantity;
    const newAvg = newQty === 0 ? 0 : (prevQty * prevAvg + params.quantity * params.price) / newQty;

    return prisma.position.update({
      where: { id: existing.id },
      data: {
        quantity: newQty,
        avg_cost: newAvg,
        asset_class: params.assetClass,
        sector: params.sector,
      },
    });
  }

  // SELL
  const newQty = Math.max(0, prevQty - params.quantity);
  return prisma.position.update({
    where: { id: existing.id },
    data: {
      quantity: newQty,
      asset_class: params.assetClass,
      sector: params.sector,
    },
  });
}
