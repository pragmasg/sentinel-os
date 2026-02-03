import { prisma } from "@/src/core/db/prisma";

export function currentPeriod(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export async function incrementUsage(params: {
  userId: string;
  key: string;
  period?: string;
  by?: number;
}) {
  const period = params.period ?? currentPeriod();
  const by = params.by ?? 1;

  return prisma.usageMeter.upsert({
    where: {
      user_id_key_period: { user_id: params.userId, key: params.key, period },
    },
    update: { count: { increment: by } },
    create: { user_id: params.userId, key: params.key, period, count: by },
    select: { key: true, period: true, count: true },
  });
}

export async function getUsageCount(params: { userId: string; key: string; period?: string }) {
  const period = params.period ?? currentPeriod();
  const row = await prisma.usageMeter.findUnique({
    where: {
      user_id_key_period: { user_id: params.userId, key: params.key, period },
    },
    select: { count: true },
  });
  return row?.count ?? 0;
}
