import { describe, expect, it } from "vitest";
import { portfolioFeeImpactTool } from "@/src/tools/portfolio/fee-impact.tool";

describe("portfolio.feeImpact tool", () => {
  it("computes fee drag", async () => {
    const out = await portfolioFeeImpactTool.execute(
      {
        tradeEvents: [
          { symbol: "AAPL", side: "BUY", size: 10, price: 100, fee: 1 },
          { symbol: "AAPL", side: "SELL", size: 5, price: 110, fee: 1 },
          { symbol: "TLT", side: "BUY", size: 2, price: 90, fee: 0.5 },
        ],
      },
      { user: { id: "u1", email: "a@b.com", role: "USER" } },
    );

    expect(out.totalFees).toBe(2.5);
    expect(out.totalNotional).toBe(10 * 100 + 5 * 110 + 2 * 90);
    expect(out.feeDragPct).toBeGreaterThan(0);
  });
});
