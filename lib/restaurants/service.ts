import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { restaurants } from "@/db/schema";
import { buildMenuUrlFromSlug } from "@/lib/restaurants/domain";

type DatabaseClient = NonNullable<typeof db>;

export type RestaurantSummary = {
  id: string;
  name: string;
  slug: string;
  cuisine: string | null;
  address: string | null;
  domain: string;
};

type RestaurantRow = {
  id: string;
  name: string;
  slug: string;
  cuisine: string | null;
  address: string | null;
};

function mapRestaurantRow(row: RestaurantRow): RestaurantSummary {
  return {
    ...row,
    domain: buildMenuUrlFromSlug(row.slug),
  };
}

function selectRestaurantFields(database: DatabaseClient) {
  return database
    .select({
      id: restaurants.id,
      name: restaurants.name,
      slug: restaurants.slug,
      cuisine: restaurants.cuisine,
      address: restaurants.address,
    })
    .from(restaurants);
}

export async function getRestaurantByOwnerId(ownerUserId: string): Promise<RestaurantSummary | null> {
  if (!db) {
    return null;
  }

  const database = db as DatabaseClient;
  const [restaurant] = await selectRestaurantFields(database)
    .where(eq(restaurants.ownerUserId, ownerUserId))
    .limit(1);

  return restaurant ? mapRestaurantRow(restaurant) : null;
}

export async function getRestaurantBySlug(slug: string): Promise<RestaurantSummary | null> {
  if (!db) {
    return null;
  }

  const normalizedSlug = slug.trim();
  if (!normalizedSlug) {
    return null;
  }

  const database = db as DatabaseClient;
  const [restaurant] = await selectRestaurantFields(database)
    .where(eq(restaurants.slug, normalizedSlug))
    .limit(1);

  return restaurant ? mapRestaurantRow(restaurant) : null;
}


