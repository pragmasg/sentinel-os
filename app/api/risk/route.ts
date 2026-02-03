import { z } from "zod";
import { requireUser } from "@/src/auth/require-user";
import { RiskSkill } from "@/src/skills/RiskSkill";
import { riskStressTestTool } from "@/src/tools/risk/stress-test.tool";
import { riskZScoreAnomalyTool } from "@/src/tools/risk/zscore-anomaly.tool";
import { jsonError, jsonOk } from "@/src/utils/responses";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  return jsonOk({ ok: true, message: "Risk module skeleton" });
}

const postSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("stressTest"),
    input: riskStressTestTool.inputSchema,
  }),
  z.object({
    action: z.literal("zScoreAnomaly"),
    input: riskZScoreAnomalyTool.inputSchema,
  }),
]);

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const body = await request.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400);

  const skill = new RiskSkill();
  const ctx = { user: { id: auth.user.id, email: auth.user.email, role: auth.user.role } };

  if (parsed.data.action === "stressTest") {
    const result = await skill.stressTest(parsed.data.input, ctx);
    return jsonOk({ result });
  }

  const result = await skill.zScoreAnomaly(parsed.data.input, ctx);
  return jsonOk({ result });
}
