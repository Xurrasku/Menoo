import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { restaurants } from "@/db/schema";
import { getServerUser } from "@/lib/auth/server";
import { db } from "@/lib/db";

const designSchema = z.object({
  restaurantId: z.string().min(1, "Restaurant ID is required"),
  designUrl: z.string().nullish(),
  designDescription: z.string().nullish(),
});

function normalizeOptionalField(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function PATCH(request: NextRequest) {
  const json = await request.json().catch(() => null);
  
  if (!json) {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  
  const parsed = designSchema.safeParse(json);

  if (!parsed.success) {
    console.error("Validation error:", parsed.error.flatten());
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await getServerUser({ persistSession: true });

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!db) {
    return Response.json(
      {
        data: {
          designUrl: normalizeOptionalField(parsed.data.designUrl),
          designDescription: normalizeOptionalField(parsed.data.designDescription),
        },
        warning: "Database client not initialised. Returning mock response.",
      },
      { status: 200 }
    );
  }

  try {
    // Verify the restaurant belongs to the user
    const [restaurant] = await db
      .select({ id: restaurants.id })
      .from(restaurants)
      .where(eq(restaurants.id, parsed.data.restaurantId))
      .limit(1);

    if (!restaurant) {
      return Response.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    const [userRestaurant] = await db
      .select({ id: restaurants.id })
      .from(restaurants)
      .where(eq(restaurants.ownerUserId, user.id))
      .where(eq(restaurants.id, parsed.data.restaurantId))
      .limit(1);

    if (!userRestaurant) {
      return Response.json(
        { error: "Unauthorized: Restaurant does not belong to this user" },
        { status: 403 }
      );
    }

    // Update design preferences
    const [updatedRestaurant] = await db
      .update(restaurants)
      .set({
        designUrl: normalizeOptionalField(parsed.data.designUrl),
        designDescription: normalizeOptionalField(parsed.data.designDescription),
        updatedAt: new Date(),
      })
      .where(eq(restaurants.id, parsed.data.restaurantId))
      .returning();

    return Response.json(
      {
        data: {
          designUrl: updatedRestaurant.designUrl,
          designDescription: updatedRestaurant.designDescription,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to update design preferences", error);
    return Response.json(
      { error: "Unable to update design preferences. Please try again." },
      { status: 500 }
    );
  }
}

