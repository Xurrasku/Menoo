import { NextRequest } from "next/server";
import { count, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { categories, items, menus } from "@/db/schema";
import { mockMenus } from "@/lib/mock/menus";

const menuQuerySchema = z.object({
  restaurantId: z.string().uuid().optional(),
});

const menuCreateSchema = z.object({
  restaurantId: z.string().uuid(),
  name: z.string().min(1),
  isDefault: z.boolean().optional().default(false),
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

  const [createdMenu] = await db
    .insert(menus)
    .values(result.data)
    .returning();

  return Response.json({ data: createdMenu }, { status: 201 });
}

