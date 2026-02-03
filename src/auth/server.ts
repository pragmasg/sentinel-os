import { cookies } from "next/headers";
import { prisma } from "@/src/core/db/prisma";
import { SESSION_COOKIE_NAME } from "@/src/auth/cookies";
import { verifySessionToken } from "@/src/auth/jwt";

export async function requireUserFromCookies() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return { ok: false as const, status: 401, error: "Unauthorized" };

  try {
    const session = await verifySessionToken(token);
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { id: true, email: true, role: true, created_at: true, canvasLayout: true },
    });

    if (!user) return { ok: false as const, status: 401, error: "Unauthorized" };
    return { ok: true as const, user };
  } catch {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }
}
