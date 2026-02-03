import { requireUser } from "@/src/auth/require-user";
import { jsonError, jsonOk } from "@/src/utils/responses";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  return jsonOk({ ok: true, message: "Automation module skeleton" });
}
