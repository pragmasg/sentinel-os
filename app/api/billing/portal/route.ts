import { requireUser } from "@/src/auth/require-user";
import { getEnv } from "@/src/config/env.server";
import { getStripeClient } from "@/src/core/stripe/client";
import { prisma } from "@/src/core/db/prisma";
import { jsonError, jsonOk } from "@/src/utils/responses";

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const env = getEnv();

  if (!env.STRIPE_SECRET_KEY) return jsonError("Billing not configured", 503);

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: { stripe_customer_id: true },
  });

  if (!user?.stripe_customer_id) {
    return jsonError("No billing profile yet", 400);
  }

  const stripe = getStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripe_customer_id,
    return_url: `${env.APP_URL}/settings`,
  });

  return jsonOk({ url: session.url });
}
