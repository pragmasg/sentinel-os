import { describe, expect, it } from "vitest";
import { portfolioAllocationTool } from "@/src/tools/portfolio/allocation.tool";

describe("portfolio.allocation tool", () => {
  it("computes totals and buckets", async () => {
    const output = await portfolioAllocationTool.execute(
      {
        positions: [
          { symbol: "AAPL", marketValue: 100, assetClass: "Equity", sector: "Tech" },
          { symbol: "MSFT", marketValue: 50, assetClass: "Equity", sector: "Tech" },
          { symbol: "TLT", marketValue: 25, assetClass: "Bond", sector: "Rates" },
        ],
      },
      { user: { id: "u1", email: "a@b.com", role: "USER" } },
    );

    expect(output.totalMarketValue).toBe(175);
    expect(output.byAssetClass).toEqual({ Equity: 150, Bond: 25 });
    expect(output.bySector).toEqual({ Tech: 150, Rates: 25 });
  });
});
