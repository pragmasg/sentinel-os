import { z } from "zod";
import { requireUser } from "@/src/auth/require-user";
import { prisma } from "@/src/core/db/prisma";
import { canUseResearchQuery } from "@/src/auth/plan";
import { getUsageCount, incrementUsage } from "@/src/services/usage.service";
import { searchResearchChunks, upsertResearchDocument } from "@/src/services/research.service";
import { jsonError, jsonOk, jsonCreated } from "@/src/utils/responses";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: { id: true, plan_tier: true },
  });
  if (!user) return jsonError("Unauthorized", 401);

  const used = await getUsageCount({ userId: user.id, key: "research.query" });
  const allowed = canUseResearchQuery(user.plan_tier, used);
  if (!allowed.ok) return jsonError(allowed.reason, 402, { used, plan: user.plan_tier });

  const results = await searchResearchChunks({ userId: user.id, query: q, limit: 8 });
  await incrementUsage({ userId: user.id, key: "research.query" });

  return jsonOk({ results });
}

const postSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  source: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const body = await request.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400);

  const doc = await upsertResearchDocument({
    userId: auth.user.id,
    title: parsed.data.title,
    content: parsed.data.content,
    source: parsed.data.source,
  });

  return jsonCreated({ document: doc });
}
