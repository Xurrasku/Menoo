import { asc, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { mockMenuDetails } from "@/lib/mock/menu-details";
import { mockMenus } from "@/lib/mock/menus";
import { categories, items, menus } from "@/db/schema";

export type MenuListRow = {
  id: string;
  name: string;
  items: number;
  categories?: number;
  createdAt: Date;
};

export type MenuDetailCategory = {
  id: string;
  name: string;
  description: string;
  dishes: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    thumbnail: string;
    isVisible: boolean;
    labels: string[];
    allergens: string[];
  }>;
};

export type MenuDetailData = {
  id: string;
  name: string;
  categories: MenuDetailCategory[];
};

export async function listMenus(restaurantId?: string): Promise<MenuListRow[]> {
  if (!db) {
    return mockMenus.map((menu) => ({
      id: menu.id,
      name: menu.name,
      items: menu.items,
      categories: menu.categories,
      createdAt: new Date(),
    }));
  }

  const itemsCount = sql<number>`COUNT(${items.id})`;
  const categoriesCount = sql<number>`COUNT(DISTINCT ${categories.id})`;

  let builder = db
    .select({
      id: menus.id,
      name: menus.name,
      createdAt: menus.createdAt,
      items: itemsCount,
      categories: categoriesCount,
    })
    .from(menus)
    .leftJoin(categories, eq(categories.menuId, menus.id))
    .leftJoin(items, eq(items.categoryId, categories.id))
    .groupBy(menus.id)
    .orderBy(desc(menus.createdAt));

  if (restaurantId) {
    builder = builder.where(eq(menus.restaurantId, restaurantId));
  }

  const rows = await builder;

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    items: Number(row.items ?? 0),
    categories: Number(row.categories ?? 0),
    createdAt: row.createdAt,
  }));
}

export async function getMenuDetail(menuId: string): Promise<MenuDetailData | null> {
  if (!db) {
    return mockMenuDetails[menuId] ?? null;
  }

  const [menu] = await db
    .select({
      id: menus.id,
      name: menus.name,
    })
    .from(menus)
    .where(eq(menus.id, menuId))
    .limit(1);

  if (!menu) {
    return null;
  }

  const menuCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      description: categories.description,
    })
    .from(categories)
    .where(eq(categories.menuId, menuId))
    .orderBy(asc(categories.position), asc(categories.createdAt));

  if (menuCategories.length === 0) {
    return {
      id: menu.id,
      name: menu.name,
      categories: [],
    };
  }

  const categoryIds = menuCategories.map((category) => category.id);

  const menuItems = await db
    .select({
      id: items.id,
      categoryId: items.categoryId,
      name: items.name,
      description: items.description,
      priceCents: items.priceCents,
      currency: items.currency,
      imageUrl: items.imageUrl,
      isVisible: items.isVisible,
      labels: items.tags,
      allergens: items.allergens,
    })
    .from(items)
    .where(inArray(items.categoryId, categoryIds))
    .orderBy(asc(items.createdAt));

  const categoriesWithDishes: MenuDetailCategory[] = menuCategories.map((category) => {
    const dishes = menuItems
      .filter((item) => item.categoryId === category.id)
      .map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description ?? "",
        price: item.priceCents / 100,
        currency: item.currency,
        thumbnail: item.imageUrl ?? "",
        isVisible: item.isVisible,
        labels: item.labels ?? [],
        allergens: item.allergens ?? [],
      }));

    return {
      id: category.id,
      name: category.name,
      description: category.description ?? "",
      dishes,
    };
  });

  return {
    id: menu.id,
    name: menu.name,
    categories: categoriesWithDishes,
  };
}


