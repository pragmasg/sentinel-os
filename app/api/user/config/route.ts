import { z } from "zod";
import { prisma } from "@/src/core/db/prisma";
import { requireUser } from "@/src/auth/require-user";
import { jsonError, jsonOk } from "@/src/utils/responses";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: { canvasLayout: true },
  });

  return jsonOk({ canvasLayout: user?.canvasLayout ?? null });
}

const patchSchema = z.object({
  canvasLayout: z.unknown(),
});

export async function PATCH(request: Request) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400);

  await prisma.user.update({
    where: { id: auth.user.id },
    data: { canvasLayout: parsed.data.canvasLayout as any },
    select: { id: true },
  });

  return jsonOk({ ok: true });
}
