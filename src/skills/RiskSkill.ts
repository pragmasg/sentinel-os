import { z } from "zod";
import { executeTool } from "@/src/tools/execute";
import { toolRegistry } from "@/src/tools/registry";
import {
  riskStressTestTool,
  type StressTestOutput,
} from "@/src/tools/risk/stress-test.tool";
import {
  riskZScoreAnomalyTool,
  type ZScoreOutput,
} from "@/src/tools/risk/zscore-anomaly.tool";

export class RiskSkill {
  async stressTest(
    input: z.infer<(typeof riskStressTestTool)["inputSchema"]>,
    ctx: { user: { id: string; email: string; role: "USER" | "ADMIN" } },
  ): Promise<StressTestOutput> {
    const tool = toolRegistry["risk.stressTest"] as typeof riskStressTestTool;
    if (!tool) throw new Error("Tool not found");
    return executeTool(tool, input, ctx);
  }

  async zScoreAnomaly(
    input: z.infer<(typeof riskZScoreAnomalyTool)["inputSchema"]>,
    ctx: { user: { id: string; email: string; role: "USER" | "ADMIN" } },
  ): Promise<ZScoreOutput> {
    const tool = toolRegistry["risk.zScoreAnomaly"] as typeof riskZScoreAnomalyTool;
    if (!tool) throw new Error("Tool not found");
    return executeTool(tool, input, ctx);
  }
}
