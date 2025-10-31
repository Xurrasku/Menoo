import { headers } from "next/headers";
import { NextRequest } from "next/server";
import type Stripe from "stripe";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { subscriptionStatusEnum, subscriptions } from "@/db/schema";
import { getStripeClient } from "@/lib/stripe/server";

export const runtime = "nodejs";

const relevantEvents = new Set<Stripe.Event.Type>([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = headers().get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return new Response("Missing Stripe signature or webhook secret", {
      status: 400,
    });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return new Response("Invalid signature", { status: 400 });
  }

  if (!relevantEvents.has(event.type)) {
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = session.subscription as string | null;
        const customerId = session.customer as string | null;
        const metadataRestaurantId = session.metadata?.restaurantId;

        if (db && subscriptionId && customerId && metadataRestaurantId) {
          await db
            .insert(subscriptions)
            .values({
              restaurantId: metadataRestaurantId,
              stripeCustomerId: customerId,
              plan: session.metadata?.plan ?? "pro",
              status: "active",
            })
            .onConflictDoUpdate({
              target: subscriptions.restaurantId,
              set: {
                stripeCustomerId: customerId,
                plan: session.metadata?.plan ?? "pro",
                status: "active",
              },
            });
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;

        if (db) {
          await db
            .update(subscriptions)
            .set({
              status: (subscriptionStatusEnum.enumValues.includes(
                subscription.status as (typeof subscriptionStatusEnum.enumValues)[number]
              )
                ? (subscription.status as (typeof subscriptionStatusEnum.enumValues)[number])
                : "active"),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              plan: subscription.items.data[0]?.price.nickname ?? subscription.items.data[0]?.price.id ?? "unknown",
            })
            .where(eq(subscriptions.stripeCustomerId, subscription.customer as string));
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        if (db) {
          await db
            .update(subscriptions)
            .set({ status: "canceled" })
            .where(eq(subscriptions.stripeCustomerId, subscription.customer as string));
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("Error handling Stripe webhook", error);
    return new Response("Webhook handler failed", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}

