import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { restaurants } from "@/db/schema";
import { getServerUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { toSlug } from "@/lib/restaurants/domain";

const checkSlugSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
});

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = checkSlugSchema.safeParse(json);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await getServerUser({ persistSession: true });

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const normalizedSlug = toSlug(parsed.data.slug.trim());

  if (!normalizedSlug) {
    return Response.json(
      { error: "Slug must contain alphanumeric characters", available: false },
      { status: 400 }
    );
  }

  if (!db) {
    return Response.json(
      {
        available: true,
        slug: normalizedSlug,
        warning: "Database client not initialised. Returning mock response.",
      },
      { status: 200 }
    );
  }

  try {
    const [existingRestaurant] = await db
      .select({ id: restaurants.id })
      .from(restaurants)
      .where(eq(restaurants.slug, normalizedSlug))
      .limit(1);

    const available = !existingRestaurant;

    return Response.json(
      {
        available,
        slug: normalizedSlug,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to check slug availability", error);
    return Response.json(
      { error: "Unable to check slug availability. Please try again." },
      { status: 503 }
    );
  }
}
