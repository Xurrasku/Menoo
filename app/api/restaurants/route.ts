import { NextRequest } from "next/server";
import { eq, like } from "drizzle-orm";
import { z } from "zod";

import { restaurants } from "@/db/schema";
import { getServerUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { buildMenuDomain, buildMenuUrlFromSlug, toSlug } from "@/lib/restaurants/domain";

const restaurantSizeSchema = z.enum(["small", "medium", "large", "maxi"]).optional();

const restaurantSchema = z.object({
  name: z.string().min(1, "Restaurant name is required"),
  slug: z.string().optional(),
  cuisine: z.string().optional(),
  address: z.string().optional(),
  size: restaurantSizeSchema,
  referralSource: z.string().optional(),
  designUrl: z.string().nullish(),
  designDescription: z.string().nullish(),
  testMode: z.boolean().optional(),
});

function normalizeOptionalField(value?: string) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  
  if (!json) {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  
  const parsed = restaurantSchema.safeParse(json);

  if (!parsed.success) {
    console.error("Validation error:", parsed.error.flatten());
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await getServerUser({ persistSession: true });

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const trimmedName = parsed.data.name.trim();
  
  // Use provided slug or generate from name
  let finalSlug: string;
  if (parsed.data.slug && parsed.data.slug.trim().length > 0) {
    finalSlug = toSlug(parsed.data.slug.trim());
    if (!finalSlug) {
      return Response.json(
        { error: "Invalid slug. Slug must contain alphanumeric characters." },
        { status: 400 }
      );
    }
  } else {
    const baseDomain = buildMenuDomain(trimmedName);
    finalSlug = baseDomain.slug;
  }

  if (!db) {
    return Response.json(
      {
        data: {
          ownerUserId: user.id,
          name: trimmedName,
          slug: finalSlug,
          cuisine: normalizeOptionalField(parsed.data.cuisine),
          address: normalizeOptionalField(parsed.data.address),
          size: parsed.data.size || null,
          designUrl: normalizeOptionalField(parsed.data.designUrl),
          designDescription: normalizeOptionalField(parsed.data.designDescription),
          domain: buildMenuUrlFromSlug(finalSlug),
        },
        warning: "Database client not initialised. Returning mock response.",
      },
      { status: 201 }
    );
  }

  try {
    const [existingRestaurant] = await db
      .select({ id: restaurants.id })
      .from(restaurants)
      .where(eq(restaurants.ownerUserId, user.id))
      .limit(1);

    // In test mode, allow updating existing restaurant
    if (existingRestaurant && parsed.data.testMode) {
      // Update existing restaurant in test mode
      const [updatedRestaurant] = await db
        .update(restaurants)
        .set({
          name: trimmedName,
          slug: finalSlug,
          cuisine: normalizeOptionalField(parsed.data.cuisine),
          address: normalizeOptionalField(parsed.data.address),
          size: parsed.data.size || null,
          designUrl: normalizeOptionalField(parsed.data.designUrl),
          designDescription: normalizeOptionalField(parsed.data.designDescription),
          updatedAt: new Date(),
        })
        .where(eq(restaurants.id, existingRestaurant.id))
        .returning();

      return Response.json(
        {
          data: {
            ...updatedRestaurant,
            domain: buildMenuUrlFromSlug(finalSlug),
          },
          warning: "Test mode: Restaurant updated",
        },
        { status: 200 }
      );
    }

    if (existingRestaurant) {
      return Response.json(
        { error: "Restaurant already configured for this account" },
        { status: 409 }
      );
    }

    // Check if slug is already taken
    const [existingSlug] = await db
      .select({ id: restaurants.id })
      .from(restaurants)
      .where(eq(restaurants.slug, finalSlug))
      .limit(1);

    if (existingSlug) {
      // If slug was provided, it's taken - return error
      if (parsed.data.slug) {
        return Response.json(
          { error: "This URL is already taken. Please choose a different one." },
          { status: 409 }
        );
      }
      
      // If slug was auto-generated, find an available variant
      const similarSlugs = await db
        .select({ slug: restaurants.slug })
        .from(restaurants)
        .where(like(restaurants.slug, `${finalSlug}%`));

      const slugSet = new Set(similarSlugs.map((entry) => entry.slug));
      let counter = 2;
      while (slugSet.has(finalSlug)) {
        finalSlug = `${finalSlug.split("-")[0]}-${counter}`;
        counter += 1;
      }
    }

    const [createdRestaurant] = await db
      .insert(restaurants)
      .values({
        ownerUserId: user.id,
        name: trimmedName,
        slug: finalSlug,
        cuisine: normalizeOptionalField(parsed.data.cuisine),
        address: normalizeOptionalField(parsed.data.address),
        size: parsed.data.size || null,
        designUrl: normalizeOptionalField(parsed.data.designUrl),
        designDescription: normalizeOptionalField(parsed.data.designDescription),
      })
      .returning();

    return Response.json(
      {
        data: {
          ...createdRestaurant,
          domain: buildMenuUrlFromSlug(finalSlug),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create restaurant", error);
    return Response.json(
      { error: "Unable to reach the database. Please verify Supabase connectivity and try again." },
      { status: 503 }
    );
  }
}

export async function GET() {
  const user = await getServerUser({ persistSession: true });

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!db) {
    return Response.json({ data: null, warning: "Database client not initialised" }, { status: 200 });
  }

  try {
    const [restaurant] = await db
      .select({
        id: restaurants.id,
        name: restaurants.name,
        slug: restaurants.slug,
        cuisine: restaurants.cuisine,
        address: restaurants.address,
      })
      .from(restaurants)
      .where(eq(restaurants.ownerUserId, user.id))
      .limit(1);

    if (!restaurant) {
      return Response.json({ data: null }, { status: 200 });
    }

    return Response.json(
      {
        data: {
          ...restaurant,
          domain: buildMenuUrlFromSlug(restaurant.slug),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to fetch restaurant", error);
    return Response.json(
      { error: "Unable to reach the database. Please verify Supabase connectivity and try again." },
      { status: 503 }
    );
  }
}

