import { asc, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { mockMenuDetails } from "@/lib/mock/menu-details";
import { mockMenus } from "@/lib/mock/menus";
import { categories, items, menus } from "@/db/schema";

type DatabaseClient = NonNullable<typeof db>;

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

export type RestaurantMenuDetail = MenuDetailData & {
  isDefault: boolean;
  createdAt: Date;
  htmlContent: string | null;
};

function adaptMockMenuDetail(menuId: string): MenuDetailData | null {
  const mock = mockMenuDetails[menuId];
  if (!mock) {
    return null;
  }

  return {
    id: mock.id,
    name: mock.name,
    categories: mock.categories.map((category) => ({
      ...category,
      dishes: [],
    })),
  };
}

function buildMockMenuDetails(): MenuDetailData[] {
  return Object.values(mockMenuDetails).map((menu) => ({
    id: menu.id,
    name: menu.name,
    categories: menu.categories.map((category) => ({
      ...category,
      dishes: [],
    })),
  }));
}

export async function listMenus(restaurantId: string): Promise<MenuListRow[]> {
  if (!restaurantId || restaurantId.trim().length === 0) {
    throw new Error("restaurantId is required to list menus");
  }

  if (!db) {
    return mockMenus.map((menu) => ({
      id: menu.id,
      name: menu.name,
      items: menu.items,
      categories: menu.categories,
      createdAt: new Date(),
    }));
  }

  const database = db as DatabaseClient;
  const itemsCount = sql<number>`COUNT(${items.id})`;
  const categoriesCount = sql<number>`COUNT(DISTINCT ${categories.id})`;

  const rows = await database
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
    .where(eq(menus.restaurantId, restaurantId))
    .groupBy(menus.id)
    .orderBy(desc(menus.createdAt));

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
    return adaptMockMenuDetail(menuId);
  }

  const database = db as DatabaseClient;
  const [menu] = await database
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

  const categoriesByMenu = await buildMenuCategoryMap(database, [menu.id]);

  return {
    id: menu.id,
    name: menu.name,
    categories: categoriesByMenu.get(menu.id) ?? [],
  };
}

async function buildMenuCategoryMap(
  database: DatabaseClient,
  menuIds: string[],
): Promise<Map<string, MenuDetailCategory[]>> {
  if (menuIds.length === 0) {
    return new Map();
  }

  const menuCategories = await database
    .select({
      id: categories.id,
      menuId: categories.menuId,
      name: categories.name,
      description: categories.description,
      position: categories.position,
      createdAt: categories.createdAt,
    })
    .from(categories)
    .where(inArray(categories.menuId, menuIds))
    .orderBy(asc(categories.position), asc(categories.createdAt));

  if (menuCategories.length === 0) {
    return new Map();
  }

  const categoryIds = menuCategories.map((category) => category.id);

  const menuItems =
    categoryIds.length === 0
      ? []
      : await database
          .select({
            id: items.id,
            categoryId: items.categoryId,
            name: items.name,
            description: items.description,
            priceCents: items.priceCents,
            currency: items.currency,
            imageUrl: items.imageUrl,
            isVisible: items.isVisible,
            tags: items.tags,
            allergens: items.allergens,
            createdAt: items.createdAt,
          })
          .from(items)
          .where(inArray(items.categoryId, categoryIds))
          .orderBy(asc(items.createdAt));

  const itemsByCategory = new Map<string, typeof menuItems>();
  for (const item of menuItems) {
    const entries = itemsByCategory.get(item.categoryId);
    if (entries) {
      entries.push(item);
    } else {
      itemsByCategory.set(item.categoryId, [item]);
    }
  }

  const categoriesByMenu = new Map<string, MenuDetailCategory[]>();
  for (const category of menuCategories) {
    const dishes =
      itemsByCategory
        .get(category.id)
        ?.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description ?? "",
          price: item.priceCents / 100,
          currency: item.currency,
          thumbnail: item.imageUrl ?? "",
          isVisible: item.isVisible,
          labels: Array.isArray(item.tags) ? item.tags : [],
          allergens: Array.isArray(item.allergens) ? item.allergens : [],
        })) ?? [];

    const payload: MenuDetailCategory = {
      id: category.id,
      name: category.name,
      description: category.description ?? "",
      dishes,
    };

    const existing = categoriesByMenu.get(category.menuId);
    if (existing) {
      existing.push(payload);
    } else {
      categoriesByMenu.set(category.menuId, [payload]);
    }
  }

  return categoriesByMenu;
}

export async function getRestaurantMenus(restaurantId: string): Promise<RestaurantMenuDetail[]> {
  if (!restaurantId || restaurantId.trim().length === 0) {
    throw new Error("restaurantId is required to load restaurant menus");
  }

  if (!db) {
    return buildMockMenuDetails().map((menu, index) => ({
      ...menu,
      isDefault: index === 0,
      htmlContent: null,
      createdAt: new Date(),
    }));
  }

  const database = db as DatabaseClient;
  const menuRows = await database
    .select({
      id: menus.id,
      name: menus.name,
      isDefault: menus.isDefault,
      htmlContent: menus.htmlContent,
      createdAt: menus.createdAt,
    })
    .from(menus)
    .where(eq(menus.restaurantId, restaurantId))
    .orderBy(desc(menus.isDefault), desc(menus.createdAt));

  if (menuRows.length === 0) {
    return [];
  }

  const categoriesByMenu = await buildMenuCategoryMap(
    database,
    menuRows.map((menu) => menu.id),
  );

  return menuRows.map((menu) => ({
    id: menu.id,
    name: menu.name,
    categories: categoriesByMenu.get(menu.id) ?? [],
    isDefault: menu.isDefault,
    htmlContent: menu.htmlContent,
    createdAt: menu.createdAt,
  }));
}


