import { z } from "zod";
import { requireUser } from "@/src/auth/require-user";
import { listLatestNews } from "@/src/services/news.service";
import { jsonError, jsonOk } from "@/src/utils/responses";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const url = new URL(request.url);
  const ticker = url.searchParams.get("ticker") ?? undefined;
  const limitRaw = url.searchParams.get("limit");
  const limit = limitRaw ? z.coerce.number().int().min(1).max(10).safeParse(limitRaw) : null;

  const items = await listLatestNews({
    userId: auth.user.id,
    ticker,
    limit: limit?.success ? limit.data : 3,
  });

  return jsonOk({ items });
}
