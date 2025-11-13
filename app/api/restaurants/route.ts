import { NextRequest } from "next/server";
import { eq, like } from "drizzle-orm";
import { z } from "zod";

import { restaurants } from "@/db/schema";
import { getServerUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { buildMenuDomain, getMenuDomainBase } from "@/lib/restaurants/domain";

const restaurantSchema = z.object({
  name: z.string().min(1, "Restaurant name is required"),
  cuisine: z.string().optional(),
  address: z.string().optional(),
});

function normalizeOptionalField(value?: string) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = restaurantSchema.safeParse(json);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await getServerUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const trimmedName = parsed.data.name.trim();
  const baseDomain = buildMenuDomain(trimmedName);
  let finalSlug = baseDomain.slug;

  if (!db) {
    return Response.json(
      {
        data: {
          ownerUserId: user.id,
          name: trimmedName,
          slug: finalSlug,
          cuisine: normalizeOptionalField(parsed.data.cuisine),
          address: normalizeOptionalField(parsed.data.address),
          domain: baseDomain.url,
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

    if (existingRestaurant) {
      return Response.json(
        { error: "Restaurant already configured for this account" },
        { status: 409 }
      );
    }

    const similarSlugs = await db
      .select({ slug: restaurants.slug })
      .from(restaurants)
      .where(like(restaurants.slug, `${baseDomain.slug}%`));

    if (similarSlugs.length > 0) {
      const slugSet = new Set(similarSlugs.map((entry) => entry.slug));
      let counter = 2;
      while (slugSet.has(finalSlug)) {
        finalSlug = `${baseDomain.slug}-${counter}`;
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
      })
      .returning();

    return Response.json(
      {
        data: {
          ...createdRestaurant,
          domain: `${getMenuDomainBase()}/${finalSlug}`,
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
  const user = await getServerUser();

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
          domain: `${getMenuDomainBase()}/${restaurant.slug}`,
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

