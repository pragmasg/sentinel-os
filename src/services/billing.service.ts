import { prisma } from "@/src/core/db/prisma";

export async function setUserPlanFromStripe(params: {
  userId: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripePriceId?: string | null;
  subscriptionStatus?: string | null;
  planTier: "FREE" | "PRO" | "ELITE";
}) {
  return prisma.user.update({
    where: { id: params.userId },
    data: {
      plan_tier: params.planTier,
      stripe_customer_id: params.stripeCustomerId ?? undefined,
      stripe_subscription_id: params.stripeSubscriptionId ?? undefined,
      stripe_price_id: params.stripePriceId ?? undefined,
      subscription_status: params.subscriptionStatus ?? undefined,
    },
  });
}

export async function findUserByStripeCustomerId(stripeCustomerId: string) {
  return prisma.user.findFirst({
    where: { stripe_customer_id: stripeCustomerId },
    select: { id: true, email: true, role: true, plan_tier: true },
  });
}
