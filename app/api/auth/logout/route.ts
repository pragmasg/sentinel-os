import { buildLogoutCookie } from "@/src/auth/cookies";
import { jsonOk } from "@/src/utils/responses";

export async function POST() {
  return jsonOk(
    { ok: true },
    {
      headers: {
        "Set-Cookie": buildLogoutCookie(),
      },
    },
  );
}
