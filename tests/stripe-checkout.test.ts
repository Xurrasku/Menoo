import assert from "node:assert/strict";
import test from "node:test";

import { buildProPlanCheckoutSessionParams } from "../lib/stripe/checkout";

const ORIGINAL_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID;
const ORIGINAL_APP_URL = process.env.NEXT_PUBLIC_APP_URL;

test("buildProPlanCheckoutSessionParams throws when STRIPE_PRO_PRICE_ID is missing", () => {
  delete process.env.STRIPE_PRO_PRICE_ID;

  assert.throws(() =>
    buildProPlanCheckoutSessionParams({
      locale: "en",
      restaurantId: "9b65c2b0-16ab-4a69-8c25-2f0f5bd9cfa9",
    })
  );
});

test("buildProPlanCheckoutSessionParams configures a Stripe subscription session", () => {
  process.env.STRIPE_PRO_PRICE_ID = "price_test123";
  process.env.NEXT_PUBLIC_APP_URL = "https://example.com/";

  const params = buildProPlanCheckoutSessionParams({
    locale: "es",
    restaurantId: "0f0a3f4a-f37f-4cdb-8c9f-a98b3d7cf111",
  });

  assert.equal(params.mode, "subscription");
  assert.equal(params.metadata.plan, "pro");
  assert.equal(params.metadata.restaurantId, "0f0a3f4a-f37f-4cdb-8c9f-a98b3d7cf111");
  assert.equal(params.success_url, "https://example.com/es/dashboard/settings?checkout=success");
  assert.equal(params.cancel_url, "https://example.com/es/dashboard/settings?checkout=cancelled");
  assert.equal(params.line_items?.[0]?.price, "price_test123");
  assert.equal(params.line_items?.[0]?.quantity, 1);
  assert.equal(params.allow_promotion_codes, true);
  assert.equal(params.automatic_tax?.enabled, true);
});

test.after(() => {
  process.env.STRIPE_PRO_PRICE_ID = ORIGINAL_PRICE_ID;
  process.env.NEXT_PUBLIC_APP_URL = ORIGINAL_APP_URL;
});

