import { requireUser } from "@/src/auth/require-user";
import { listAlerts } from "@/src/services/alerts.service";
import { jsonError, jsonOk } from "@/src/utils/responses";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const alerts = await listAlerts(auth.user.id);
  return jsonOk({ alerts });
}
