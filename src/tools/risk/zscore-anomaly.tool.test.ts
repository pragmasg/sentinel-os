import { describe, expect, it } from "vitest";
import { riskZScoreAnomalyTool } from "@/src/tools/risk/zscore-anomaly.tool";

describe("risk.zScoreAnomaly tool", () => {
  it("flags anomalies above threshold", async () => {
    const returns = Array.from({ length: 39 }, () => 0.01);
    returns.push(0.25);

    const out = await riskZScoreAnomalyTool.execute(
      { symbol: "NVDA", returns, threshold: 3 },
      { user: { id: "u1", email: "a@b.com", role: "USER" } },
    );

    expect(out.symbol).toBe("NVDA");
    expect(out.isAnomaly).toBe(true);
  });
});
