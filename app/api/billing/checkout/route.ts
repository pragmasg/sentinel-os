import { z } from "zod";
import { requireUser } from "@/src/auth/require-user";
import { getEnv } from "@/src/config/env.server";
import { getStripeClient } from "@/src/core/stripe/client";
import { prisma } from "@/src/core/db/prisma";
import { jsonError, jsonOk } from "@/src/utils/responses";

const schema = z.object({
  tier: z.enum(["PRO", "ELITE"]),
});

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const env = getEnv();

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400);

  const priceId =
    parsed.data.tier === "PRO" ? env.STRIPE_PRICE_PRO : env.STRIPE_PRICE_ELITE;
  if (!env.STRIPE_SECRET_KEY || !priceId) {
    return jsonError("Billing not configured", 503);
  }

  const stripe = getStripeClient();

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: { id: true, email: true, stripe_customer_id: true },
  });
  if (!user) return jsonError("Unauthorized", 401);

  const customerId = user.stripe_customer_id
    ? user.stripe_customer_id
    : (
        await stripe.customers.create({
          email: user.email,
          metadata: { user_id: user.id },
        })
      ).id;

  if (!user.stripe_customer_id) {
    await prisma.user.update({
      where: { id: user.id },
      data: { stripe_customer_id: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${env.APP_URL}/settings?billing=success`,
    cancel_url: `${env.APP_URL}/settings?billing=cancel`,
    subscription_data: {
      metadata: {
        user_id: user.id,
        plan_tier: parsed.data.tier,
      },
    },
  });

  return jsonOk({ url: session.url });
}
