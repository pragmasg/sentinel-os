import { z } from "zod";
import { prisma } from "@/src/core/db/prisma";
import { hashPassword } from "@/src/auth/password";
import { signSessionToken } from "@/src/auth/jwt";
import { buildSessionCookie } from "@/src/auth/cookies";
import { jsonCreated, jsonError } from "@/src/utils/responses";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400);

  const email = parsed.data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return jsonError("Email already in use", 409);

  const password_hash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: { email, password_hash },
    select: { id: true, email: true, role: true, created_at: true },
  });

  const token = await signSessionToken({ sub: user.id, email: user.email, role: user.role });
  return jsonCreated(
    { user },
    {
      headers: {
        "Set-Cookie": buildSessionCookie(token),
      },
    },
  );
}
