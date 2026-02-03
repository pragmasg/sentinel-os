import { describe, expect, it } from "vitest";
import { portfolioCurrencyNormalizationTool } from "@/src/tools/portfolio/currency-normalization.tool";

describe("portfolio.currencyNormalization tool", () => {
  it("normalizes amounts with provided FX rates", async () => {
    const out = await portfolioCurrencyNormalizationTool.execute(
      {
        baseCurrency: "USD",
        values: [
          { currency: "EUR", amount: 100, fxRateToBase: 1.1 },
          { currency: "USD", amount: 50, fxRateToBase: 1 },
        ],
      },
      { user: { id: "u1", email: "a@b.com", role: "USER" } },
    );

    expect(out.totalBase).toBe(100 * 1.1 + 50);
  });
});
