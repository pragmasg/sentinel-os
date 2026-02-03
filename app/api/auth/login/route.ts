import { z } from "zod";
import { prisma } from "@/src/core/db/prisma";
import { verifyPassword } from "@/src/auth/password";
import { signSessionToken } from "@/src/auth/jwt";
import { buildSessionCookie } from "@/src/auth/cookies";
import { jsonOk, jsonError } from "@/src/utils/responses";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400);

  const email = parsed.data.email.toLowerCase();
  const userWithHash = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true, password_hash: true, created_at: true },
  });

  if (!userWithHash) return jsonError("Invalid credentials", 401);

  const ok = await verifyPassword(parsed.data.password, userWithHash.password_hash);
  if (!ok) return jsonError("Invalid credentials", 401);

  const token = await signSessionToken({
    sub: userWithHash.id,
    email: userWithHash.email,
    role: userWithHash.role,
  });

  const { password_hash: _ignored, ...user } = userWithHash;

  return jsonOk(
    { user },
    {
      headers: {
        "Set-Cookie": buildSessionCookie(token),
      },
    },
  );
}
