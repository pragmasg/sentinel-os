"use server";

import { prisma } from "@/src/core/db/prisma";
import { requireUserFromCookies } from "@/src/auth/server";

export type CanvasLayoutPayload = {
  version: 1;
  activeWidgetIds: string[];
  layout: unknown;
  focusedWidgetId?: string | null;
};

export async function saveCanvasLayout(payload: CanvasLayoutPayload) {
  const auth = await requireUserFromCookies();
  if (!auth.ok) return { ok: false as const, status: auth.status, error: auth.error };

  await prisma.user.update({
    where: { id: auth.user.id },
    data: {
      canvasLayout: payload as any,
    },
    select: { id: true },
  });

  return { ok: true as const };
}
