import { z } from "zod";
import { requireUser } from "@/src/auth/require-user";
import { getMarketQuote } from "@/src/services/market.service";
import { jsonError, jsonOk } from "@/src/utils/responses";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const url = new URL(request.url);
  const symbol = url.searchParams.get("symbol") ?? "";

  const parsed = z.string().min(1).safeParse(symbol);
  if (!parsed.success) return jsonError("Missing symbol", 400);

  try {
    const quote = await getMarketQuote({ symbol: parsed.data });
    return jsonOk({ quote });
  } catch (err) {
    return jsonError("Quote unavailable", 502, {
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
