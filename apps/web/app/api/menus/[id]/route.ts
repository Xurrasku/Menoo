import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { buildMenuPersistencePayload, type MenuDraft } from "@/lib/menus/persistence";
import { categories, items, menus, restaurants } from "@/db/schema";
import { getServerUser } from "@/lib/auth/server";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const menuUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  isDefault: z.boolean().optional(),
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

const menuFullUpdateSchema = z.object({
  name: z.string().min(1),
  isDefault: z.boolean().optional().default(false),
  categories: z.array(categorySchema).default([]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = paramsSchema.parse(await params);
  const json = await request.json().catch(() => null);
  const result = menuUpdateSchema.safeParse(json);

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

  const [updated] = await db
    .update(menus)
    .set({ ...result.data, updatedAt: new Date() })
    .where(eq(menus.id, id))
    .returning();

  if (!updated) {
    return Response.json({ error: "Menu not found" }, { status: 404 });
  }

  return Response.json({ data: updated }, { status: 200 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = paramsSchema.parse(await params);
  const json = await request.json().catch(() => null);
  const result = menuFullUpdateSchema.safeParse(json);

  if (!result.success) {
    return Response.json(
      { error: result.error.flatten() },
      { status: 400 }
    );
  }

  const user = await getServerUser({ persistSession: true });
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!db) {
    return Response.json(
      { error: "Database client not initialised" },
      { status: 503 }
    );
  }

  try {
    // Verify menu exists and belongs to user's restaurant
    const [existingMenu] = await db
      .select({
        restaurantId: menus.restaurantId,
        restaurantOwnerId: restaurants.ownerUserId,
      })
      .from(menus)
      .innerJoin(restaurants, eq(restaurants.id, menus.restaurantId))
      .where(eq(menus.id, id))
      .limit(1);

    if (!existingMenu) {
      return Response.json({ error: "Menu not found" }, { status: 404 });
    }

    // Verify restaurant ownership
    if (existingMenu.restaurantOwnerId !== user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const draft: MenuDraft = {
      name: result.data.name,
      restaurantId: existingMenu.restaurantId,
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

    const persistence = buildMenuPersistencePayload(draft);

    const data = await db.transaction(async (tx) => {
      // Update menu
      const [updatedMenu] = await tx
        .update(menus)
        .set({
          name: persistence.menu.name,
          isDefault: persistence.menu.isDefault,
          updatedAt: new Date(),
        })
        .where(eq(menus.id, id))
        .returning();

      if (!updatedMenu) {
        throw new Error("Failed to update menu");
      }

      // Delete all existing categories (cascade will delete items)
      await tx.delete(categories).where(eq(categories.menuId, id));

      // Create new categories and items
      const categoryIdByIndex: string[] = [];
      const createdCategories = [];

      for (const category of persistence.categories) {
        const [createdCategory] = await tx
          .insert(categories)
          .values({
            menuId: id,
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
        menu: updatedMenu,
        categories: createdCategories,
        items: createdItems,
      };
    });

    return Response.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Failed to update menu", error);
    return Response.json({ error: "Unable to update menu" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = paramsSchema.parse(await params);

  if (!db) {
    return Response.json(
      { error: "Database client not initialised" },
      { status: 503 }
    );
  }

  try {
    const [deleted] = await db
      .delete(menus)
      .where(eq(menus.id, id))
      .returning({
        id: menus.id,
        name: menus.name,
        restaurantId: menus.restaurantId,
        isDefault: menus.isDefault,
        createdAt: menus.createdAt,
        updatedAt: menus.updatedAt,
      });

    if (!deleted) {
      return Response.json({ error: "Menu not found" }, { status: 404 });
    }

    return Response.json({ data: deleted }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete menu", error);
    return Response.json({ error: "Unable to delete menu" }, { status: 500 });
  }
}

