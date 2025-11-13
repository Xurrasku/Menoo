import type Stripe from "stripe";

import { getStripeClient } from "./server";

type BuildProPlanCheckoutSessionParamsOptions = {
  locale: string;
  restaurantId?: string;
  customerEmail?: string;
  returnPath?: string;
};

const DEFAULT_RETURN_PATH = "/dashboard/settings";
const DEFAULT_RESTAURANT_ID = "demo-restaurant";

function getBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

function getProPlanPriceId() {
  const priceId = process.env.STRIPE_PRO_PRICE_ID;

  if (!priceId) {
    throw new Error("Missing STRIPE_PRO_PRICE_ID environment variable.");
  }

  return priceId;
}

function buildRedirectUrl(baseUrl: string, locale: string, search: string, returnPath?: string) {
  const sanitizedLocale = locale.replace(/[^a-zA-Z-]/g, "").trim() || "en";
  const normalizedReturnPath = returnPath && returnPath.trim().length > 0
    ? returnPath.startsWith("/")
      ? returnPath
      : `/${returnPath}`
    : DEFAULT_RETURN_PATH;

  return `${baseUrl}/${sanitizedLocale}${normalizedReturnPath}?checkout=${search}`;
}

export function buildProPlanCheckoutSessionParams({
  locale,
  restaurantId,
  customerEmail,
  returnPath,
}: BuildProPlanCheckoutSessionParamsOptions): Stripe.Checkout.SessionCreateParams {
  const baseUrl = getBaseUrl();
  const priceId = getProPlanPriceId();
  const metadataRestaurantId = restaurantId ?? DEFAULT_RESTAURANT_ID;

  const successUrl = buildRedirectUrl(baseUrl, locale, "success", returnPath);
  const cancelUrl = buildRedirectUrl(baseUrl, locale, "cancelled", returnPath);

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    billing_address_collection: "auto",
    allow_promotion_codes: true,
    automatic_tax: { enabled: true },
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      plan: "pro",
      restaurantId: metadataRestaurantId,
    },
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
  };

  if (customerEmail) {
    params.customer_email = customerEmail;
  }

  return params;
}

type CreateProPlanCheckoutSessionOptions = BuildProPlanCheckoutSessionParamsOptions & {
  stripe?: Stripe;
};

export async function createProPlanCheckoutSession({
  stripe,
  ...options
}: CreateProPlanCheckoutSessionOptions) {
  const stripeClient = stripe ?? getStripeClient();
  const params = buildProPlanCheckoutSessionParams(options);

  return stripeClient.checkout.sessions.create(params);
}


