import { z } from "zod";
import type { ToolDefinition } from "@/src/tools/types";

const inputSchema = z.object({
  symbol: z.string().min(1),
  returns: z.array(z.number().finite()).min(20),
  threshold: z.number().finite().positive().default(3),
});

export type ZScoreOutput = {
  symbol: string;
  mean: number;
  stdev: number;
  latest: number;
  z: number;
  threshold: number;
  isAnomaly: boolean;
};

function mean(values: number[]) {
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function stdev(values: number[], mu: number) {
  const variance =
    values.reduce((s, v) => s + Math.pow(v - mu, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export const riskZScoreAnomalyTool: ToolDefinition<typeof inputSchema, ZScoreOutput> = {
  name: "risk.zScoreAnomaly",
  description: "Deterministic z-score anomaly detection on return series.",
  securityLevel: "USER",
  inputSchema,
  execute: async (input) => {
    const mu = mean(input.returns);
    const sd = stdev(input.returns, mu);
    const latest = input.returns[input.returns.length - 1]!;
    const z = sd === 0 ? 0 : (latest - mu) / sd;

    return {
      symbol: input.symbol,
      mean: mu,
      stdev: sd,
      latest,
      z,
      threshold: input.threshold,
      isAnomaly: Math.abs(z) >= input.threshold,
    };
  },
};
