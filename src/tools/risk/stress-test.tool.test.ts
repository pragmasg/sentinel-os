import { describe, expect, it } from "vitest";
import { riskStressTestTool } from "@/src/tools/risk/stress-test.tool";

describe("risk.stressTest tool", () => {
  it("applies sector shock deterministically", async () => {
    const out = await riskStressTestTool.execute(
      {
        positions: [
          { symbol: "NVDA", sector: "Semis", marketValue: 1000 },
          { symbol: "AAPL", sector: "Tech", marketValue: 500 },
        ],
        scenario: { sector: "Semis", shockPct: -0.1 },
      },
      { user: { id: "u1", email: "a@b.com", role: "USER" } },
    );

    expect(out.totalBefore).toBe(1500);
    expect(out.totalAfter).toBe(1400);
    expect(out.pnl).toBe(-100);
  });
});
