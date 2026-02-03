import { z } from "zod";
import type { ToolDefinition } from "@/src/tools/types";

const inputSchema = z.object({
  positions: z
    .array(
      z.object({
        symbol: z.string().min(1),
        marketValue: z.number().finite().nonnegative(),
        assetClass: z.string().min(1),
        sector: z.string().min(1),
      }),
    )
    .default([]),
});

export type AllocationOutput = {
  totalMarketValue: number;
  byAssetClass: Record<string, number>;
  bySector: Record<string, number>;
};

export const portfolioAllocationTool: ToolDefinition<typeof inputSchema, AllocationOutput> = {
  name: "portfolio.allocation",
  description: "Compute allocation breakdown by asset class and sector.",
  securityLevel: "USER",
  inputSchema,
  execute: async (input) => {
    const total = input.positions.reduce((sum, p) => sum + p.marketValue, 0);
    const byAssetClass: Record<string, number> = {};
    const bySector: Record<string, number> = {};

    for (const p of input.positions) {
      byAssetClass[p.assetClass] = (byAssetClass[p.assetClass] ?? 0) + p.marketValue;
      bySector[p.sector] = (bySector[p.sector] ?? 0) + p.marketValue;
    }

    return { totalMarketValue: total, byAssetClass, bySector };
  },
};
