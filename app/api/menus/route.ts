import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { count, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { buildMenuPersistencePayload, type MenuDraft } from "@/lib/menus/persistence";
import { categories, items, menus, restaurants } from "@/db/schema";
import { mockMenus } from "@/lib/mock/menus";

const menuQuerySchema = z.object({
  restaurantId: z.string().uuid().optional(),
});

const dishSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional().default(""),
  price: z.number().nonnegative(),
  currency: z.string().optional(),
  thumbnail: z.string().optional(),
  isVisible: z.boolean().optional(),
  labels: z.array(z.string()).optional().default([]),
  allergens: z.array(z.string()).optional().default([]),
});

const categorySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional().default(""),
  dishes: z.array(dishSchema),
});

const menuCreateSchema = z.object({
  restaurantId: z.string().uuid().optional(),
  name: z.string().min(1),
  isDefault: z.boolean().optional().default(false),
  categories: z.array(categorySchema).default([]),
});

export type MenuCreateInput = z.infer<typeof menuCreateSchema>;

export async function GET(request: NextRequest) {
  const query = menuQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries())
  );

  if (!query.success) {
    return Response.json(
      { error: query.error.flatten() },
      { status: 400 }
    );
  }

  if (!db) {
    return Response.json(
      {
        data: mockMenus.map((menu) => ({
          id: menu.id,
          name: menu.name,
          items: menu.items,
          availability: menu.availabilityKey,
          isVisible: menu.isVisible,
        })),
        warning: "DATABASE_URL is not configured. Returning mock data.",
      },
      { status: 200 }
    );
  }

  let builder = db
    .select({
      id: menus.id,
      name: menus.name,
      isDefault: menus.isDefault,
      createdAt: menus.createdAt,
      itemsCount: count(items.id).as("itemsCount"),
    })
    .from(menus)
    .leftJoin(categories, eq(categories.menuId, menus.id))
    .leftJoin(items, eq(items.categoryId, categories.id))
    .groupBy(menus.id)
    .orderBy(desc(menus.createdAt));

  if (query.data.restaurantId) {
    builder = builder.where(eq(menus.restaurantId, query.data.restaurantId));
  }

  const data = await builder;

  return Response.json({ data }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const result = menuCreateSchema.safeParse(json);

  if (!result.success) {
    return Response.json(
      { error: result.error.flatten() },
      { status: 400 }
    );
  }

  if (!db) {
    return Response.json(
      { error: "Database client not initialised" },
      { status: 503 }
    );
  }
  const draft: MenuDraft = {
    name: result.data.name,
    restaurantId: result.data.restaurantId,
    isDefault: result.data.isDefault,
    categories: result.data.categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description ?? "",
      dishes: category.dishes.map((dish) => ({
        id: dish.id,
        name: dish.name,
        description: dish.description ?? "",
        price: dish.price,
        currency: dish.currency,
        thumbnail: dish.thumbnail,
        isVisible: dish.isVisible,
        labels: dish.labels,
        allergens: dish.allergens,
      })),
    })),
  };

  try {
    const persistence = buildMenuPersistencePayload(draft);

    const data = await db.transaction(async (tx) => {
      const targetRestaurantId = persistence.menu.restaurantId ?? (await ensureDemoRestaurant(tx));

      const [createdMenu] = await tx
        .insert(menus)
        .values({
          name: persistence.menu.name,
          restaurantId: targetRestaurantId,
          isDefault: persistence.menu.isDefault,
        })
        .returning();

      const categoryIdByIndex: string[] = [];
      const createdCategories = [];

      for (const category of persistence.categories) {
        const [createdCategory] = await tx
          .insert(categories)
          .values({
            menuId: createdMenu.id,
            name: category.name,
            position: category.position,
            description: category.description,
          })
          .returning();

        categoryIdByIndex.push(createdCategory.id);
        createdCategories.push(createdCategory);
      }

      const createdItems = [];

      for (const item of persistence.items) {
        const categoryId = categoryIdByIndex[item.categoryIndex];
        if (!categoryId) continue;

        const [createdItem] = await tx
          .insert(items)
          .values({
            categoryId,
            name: item.name,
            description: item.description,
            priceCents: item.priceCents,
            currency: item.currency,
            imageUrl: item.thumbnail,
            isVisible: item.isVisible,
            tags: item.labels,
            allergens: item.allergens,
          })
          .returning();

        createdItems.push(createdItem);
      }

      return {
        menu: createdMenu,
        categories: createdCategories,
        items: createdItems,
      };
    });

    return Response.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Failed to create menu", error);
    return Response.json({ error: "Unable to create menu" }, { status: 500 });
  }
}

type TransactionClient = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function ensureDemoRestaurant(tx: TransactionClient) {
  const DEMO_SLUG = "demo-restaurant";
  const DEFAULT_OWNER_USER_ID = process.env.DEMO_OWNER_USER_ID ?? "00000000-0000-4000-8000-000000000000";

  const existing = await tx
    .select({ id: restaurants.id })
    .from(restaurants)
    .where(eq(restaurants.slug, DEMO_SLUG))
    .limit(1);

  if (existing[0]) {
    return existing[0].id;
  }

  const [created] = await tx
    .insert(restaurants)
    .values({
      ownerUserId: DEFAULT_OWNER_USER_ID,
      name: "Demo restaurant",
      slug: DEMO_SLUG,
    })
    .returning({ id: restaurants.id });

  return created.id ?? randomUUID();
}

