import { prisma } from "@/src/core/db/prisma";

export async function createAlert(params: {
  userId: string;
  portfolioId?: string | null;
  type: string;
  title: string;
  message: string;
  data?: unknown;
}) {
  return prisma.alert.create({
    data: {
      user_id: params.userId,
      portfolio_id: params.portfolioId ?? null,
      type: params.type,
      title: params.title,
      message: params.message,
      data_json: params.data ?? undefined,
    },
  });
}

export async function listAlerts(userId: string) {
  return prisma.alert.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    take: 50,
  });
}

export async function markAlertRead(params: { userId: string; alertId: string }) {
  return prisma.alert.update({
    where: { id: params.alertId },
    data: { read_at: new Date() },
  });
}
