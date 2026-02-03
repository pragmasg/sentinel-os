import { z } from "zod";
import type { ToolDefinition } from "@/src/tools/types";

const inputSchema = z.object({
  positions: z
    .array(
      z.object({
        symbol: z.string().min(1),
        sector: z.string().min(1),
        marketValue: z.number().finite().nonnegative(),
      }),
    )
    .default([]),
  scenario: z.object({
    sector: z.string().min(1),
    shockPct: z.number().finite(), // e.g. -0.2 for -20%
  }),
});

export type StressTestOutput = {
  scenario: { sector: string; shockPct: number };
  totalBefore: number;
  totalAfter: number;
  pnl: number;
  perPosition: Array<{
    symbol: string;
    sector: string;
    before: number;
    after: number;
    pnl: number;
  }>;
};

export const riskStressTestTool: ToolDefinition<typeof inputSchema, StressTestOutput> = {
  name: "risk.stressTest",
  description: "Deterministic stress testing: apply a sector shock to positions.",
  securityLevel: "USER",
  inputSchema,
  execute: async (input) => {
    const totalBefore = input.positions.reduce((s, p) => s + p.marketValue, 0);

    const perPosition = input.positions.map((p) => {
      const shocked = p.sector.toLowerCase() === input.scenario.sector.toLowerCase();
      const shock = shocked ? input.scenario.shockPct : 0;
      const after = p.marketValue * (1 + shock);
      return {
        symbol: p.symbol,
        sector: p.sector,
        before: p.marketValue,
        after,
        pnl: after - p.marketValue,
      };
    });

    const totalAfter = perPosition.reduce((s, p) => s + p.after, 0);
    return {
      scenario: input.scenario,
      totalBefore,
      totalAfter,
      pnl: totalAfter - totalBefore,
      perPosition,
    };
  },
};
