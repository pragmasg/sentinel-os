import Stripe from "stripe";
import { headers } from "next/headers";
import { getEnv } from "@/src/config/env.server";
import { getStripeClient } from "@/src/core/stripe/client";
import { prisma } from "@/src/core/db/prisma";
import { logger } from "@/src/utils/logger";

export const runtime = "nodejs";

function tierFromPriceId(
  env: ReturnType<typeof getEnv>,
  priceId: string | null | undefined,
): "FREE" | "PRO" | "ELITE" {
  if (!priceId) return "FREE";
  if (priceId === env.STRIPE_PRICE_ELITE) return "ELITE";
  if (priceId === env.STRIPE_PRICE_PRO) return "PRO";
  return "FREE";
}

export async function POST(request: Request) {
  const env = getEnv();
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    return new Response("Billing not configured", { status: 503 });
  }

  const stripe = getStripeClient();

  const sig = (await headers()).get("stripe-signature");
  if (!sig) return new Response("Missing signature", { status: 400 });

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.warn({ err }, "stripe webhook signature verification failed");
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = typeof session.customer === "string" ? session.customer : null;
        const subscriptionId = typeof session.subscription === "string" ? session.subscription : null;

        if (customerId && subscriptionId) {
          const user = await prisma.user.findFirst({ where: { stripe_customer_id: customerId } });
          if (user) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                stripe_subscription_id: subscriptionId,
                subscription_status: "active",
              },
            });
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : null;
        const priceId = sub.items.data[0]?.price?.id ?? null;
        const tier = tierFromPriceId(env, priceId);

        if (customerId) {
          const user = await prisma.user.findFirst({ where: { stripe_customer_id: customerId } });
          if (user) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                plan_tier: event.type === "customer.subscription.deleted" ? "FREE" : tier,
                stripe_subscription_id: sub.id,
                stripe_price_id: priceId,
                subscription_status: sub.status,
              },
            });
          }
        }
        break;
      }

      default:
        break;
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    logger.error({ err, type: event.type }, "stripe webhook handler failed");
    return new Response("webhook handler error", { status: 500 });
  }
}
