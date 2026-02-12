import Stripe from "stripe";

declare global {
  var __stripe__: Stripe | undefined;
}

export function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
  }

  if (!global.__stripe__) {
    global.__stripe__ = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-10-29.clover",
    });
  }

  return global.__stripe__;
}

