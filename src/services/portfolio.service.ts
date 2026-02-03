import { prisma } from "@/src/core/db/prisma";

export async function listPortfolios(userId: string) {
  return prisma.portfolio.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    include: { positions: true },
  });
}

export async function createPortfolio(params: {
  userId: string;
  baseCurrency: string;
  riskProfile: string;
}) {
  return prisma.portfolio.create({
    data: {
      user_id: params.userId,
      base_currency: params.baseCurrency,
      risk_profile: params.riskProfile,
    },
  });
}
