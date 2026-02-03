import { z } from "zod";
import { requireUser } from "@/src/auth/require-user";
import { markAlertRead } from "@/src/services/alerts.service";
import { jsonError, jsonOk } from "@/src/utils/responses";

const schema = z.object({
  alert_id: z.string().min(1),
});

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400);

  await markAlertRead({ userId: auth.user.id, alertId: parsed.data.alert_id });
  return jsonOk({ ok: true });
}
