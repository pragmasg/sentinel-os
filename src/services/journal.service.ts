import { prisma } from "@/src/core/db/prisma";

export async function listJournalEntries(userId: string) {
  return prisma.journalEntry.findMany({
    where: {
      tradeEvent: {
        portfolio: { user_id: userId },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      tradeEvent: {
        include: {
          portfolio: { select: { id: true, base_currency: true, risk_profile: true } },
        },
      },
      riskSnapshot: true,
      relatedAlert: true,
    },
  });
}

export async function updateJournalEntry(params: {
  userId: string;
  journalEntryId: string;
  thesis: string | null;
  tags: string[];
}) {
  const existing = await prisma.journalEntry.findUnique({
    where: { id: params.journalEntryId },
    include: { tradeEvent: { include: { portfolio: true } } },
  });

  if (!existing || existing.tradeEvent.portfolio.user_id !== params.userId) {
    return null;
  }

  return prisma.journalEntry.update({
    where: { id: params.journalEntryId },
    data: {
      thesis: params.thesis,
      tags: params.tags,
    },
  });
}
