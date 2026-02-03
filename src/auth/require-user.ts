import { prisma } from "@/src/core/db/prisma";
import { getSessionTokenFromRequest } from "@/src/auth/request";
import { verifySessionToken } from "@/src/auth/jwt";

export async function requireUser(request: Request) {
  const token = getSessionTokenFromRequest(request);
  if (!token) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }

  try {
    const session = await verifySessionToken(token);
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { id: true, email: true, role: true, created_at: true },
    });
    if (!user) return { ok: false as const, status: 401, error: "Unauthorized" };
    return { ok: true as const, user };
  } catch {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }
}
