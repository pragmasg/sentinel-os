import { prisma } from "@/src/core/db/prisma";

export function sectorExposureFromPositions(
  positions: Array<{ sector: string; marketValue: number }>,
): Record<string, number> {
  const bySector: Record<string, number> = {};
  for (const p of positions) {
    bySector[p.sector] = (bySector[p.sector] ?? 0) + p.marketValue;
  }
  return bySector;
}

export async function createRiskSnapshot(params: {
  portfolioId: string;
  varValue: number;
  beta: number;
  exposure: Record<string, number>;
  timestamp: Date;
}) {
  return prisma.riskSnapshot.create({
    data: {
      portfolio_id: params.portfolioId,
      var: params.varValue,
      beta: params.beta,
      exposure_json: params.exposure,
      timestamp: params.timestamp,
    },
  });
}
