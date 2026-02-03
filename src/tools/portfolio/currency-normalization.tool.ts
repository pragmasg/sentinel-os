import { z } from "zod";
import type { ToolDefinition } from "@/src/tools/types";

const inputSchema = z.object({
  baseCurrency: z.string().min(3).max(8),
  values: z
    .array(
      z.object({
        currency: z.string().min(3).max(8),
        amount: z.number().finite(),
        fxRateToBase: z.number().finite().positive(),
      }),
    )
    .default([]),
});

export type CurrencyNormalizationOutput = {
  baseCurrency: string;
  totalBase: number;
  normalized: Array<{ currency: string; amount: number; baseAmount: number; fxRateToBase: number }>;
};

export const portfolioCurrencyNormalizationTool: ToolDefinition<
  typeof inputSchema,
  CurrencyNormalizationOutput
> = {
  name: "portfolio.currencyNormalization",
  description: "Normalize amounts into a base currency using provided FX rates.",
  securityLevel: "USER",
  inputSchema,
  execute: async (input) => {
    const normalized = input.values.map((v) => ({
      currency: v.currency,
      amount: v.amount,
      fxRateToBase: v.fxRateToBase,
      baseAmount: v.amount * v.fxRateToBase,
    }));

    const totalBase = normalized.reduce((s, v) => s + v.baseAmount, 0);
    return { baseCurrency: input.baseCurrency, totalBase, normalized };
  },
};
