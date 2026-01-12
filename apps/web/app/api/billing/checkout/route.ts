import { NextRequest } from "next/server";
import { z } from "zod";

import { createProPlanCheckoutSession } from "@/lib/stripe/checkout";
import { getStripeClient } from "@/lib/stripe/server";

export const runtime = "nodejs";

const bodySchema = z.object({
  locale: z.string().min(2).max(5),
  restaurantId: z.string().uuid().optional(),
  customerEmail: z.string().email().optional(),
  returnPath: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const result = bodySchema.safeParse(json);

  if (!result.success) {
    return Response.json({ error: result.error.flatten() }, { status: 400 });
  }

  try {
    const stripe = getStripeClient();
    const session = await createProPlanCheckoutSession({
      stripe,
      ...result.data,
    });

    if (!session.url) {
      return Response.json({ error: "Missing checkout URL" }, { status: 502 });
    }

    return Response.json({ url: session.url }, { status: 200 });
  } catch (error) {
    console.error("Stripe checkout session creation failed", error);
    return Response.json(
      { error: "Unable to start checkout session" },
      { status: 500 }
    );
  }
}


