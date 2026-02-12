import { and, desc, eq, gte, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { menuViews } from "@/db/schema";

type DatabaseClient = NonNullable<typeof db>;

export type MenuViewStats = {
  totalViews: number;
  viewsToday: number;
  viewsThisWeek: number;
  viewsThisMonth: number;
};

export type MenuViewRecord = {
  id: string;
  restaurantId: string;
  viewedAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  referer: string | null;
};

async function getTodayStart(): Promise<Date> {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

async function getWeekStart(): Promise<Date> {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

async function getMonthStart(): Promise<Date> {
  const now = new Date();
  now.setDate(1);
  now.setHours(0, 0, 0, 0);
  return now;
}

export async function recordMenuView(
  restaurantId: string,
  options?: {
    ipAddress?: string | null;
    userAgent?: string | null;
    referer?: string | null;
  }
): Promise<void> {
  if (!db) {
    return;
  }

  const database = db as DatabaseClient;

  try {
    await database.insert(menuViews).values({
      restaurantId,
      ipAddress: options?.ipAddress ?? null,
      userAgent: options?.userAgent ?? null,
      referer: options?.referer ?? null,
    });
  } catch (error) {
    console.error("Failed to record menu view", error);
    // Don't throw - analytics failures shouldn't break the page
  }
}

export async function getMenuViewStats(restaurantId: string): Promise<MenuViewStats> {
  if (!db) {
    return {
      totalViews: 0,
      viewsToday: 0,
      viewsThisWeek: 0,
      viewsThisMonth: 0,
    };
  }

  try {
    const database = db as DatabaseClient;
    const todayStart = await getTodayStart();
    const weekStart = await getWeekStart();
    const monthStart = await getMonthStart();

    const [totalResult, todayResult, weekResult, monthResult] = await Promise.all([
      database
        .select({ count: sql<number>`COUNT(*)` })
        .from(menuViews)
        .where(eq(menuViews.restaurantId, restaurantId)),
      database
        .select({ count: sql<number>`COUNT(*)` })
        .from(menuViews)
        .where(
          and(
            eq(menuViews.restaurantId, restaurantId),
            gte(menuViews.viewedAt, todayStart)
          )
        ),
      database
        .select({ count: sql<number>`COUNT(*)` })
        .from(menuViews)
        .where(
          and(
            eq(menuViews.restaurantId, restaurantId),
            gte(menuViews.viewedAt, weekStart)
          )
        ),
      database
        .select({ count: sql<number>`COUNT(*)` })
        .from(menuViews)
        .where(
          and(
            eq(menuViews.restaurantId, restaurantId),
            gte(menuViews.viewedAt, monthStart)
          )
        ),
    ]);

    return {
      totalViews: Number(totalResult[0]?.count ?? 0),
      viewsToday: Number(todayResult[0]?.count ?? 0),
      viewsThisWeek: Number(weekResult[0]?.count ?? 0),
      viewsThisMonth: Number(monthResult[0]?.count ?? 0),
    };
  } catch (error) {
    console.error("Failed to get menu view stats", error);
    // Return zero stats if table doesn't exist or query fails
    return {
      totalViews: 0,
      viewsToday: 0,
      viewsThisWeek: 0,
      viewsThisMonth: 0,
    };
  }
}

export async function getRecentMenuViews(
  restaurantId: string,
  limit: number = 10
): Promise<MenuViewRecord[]> {
  if (!db) {
    return [];
  }

  try {
    const database = db as DatabaseClient;

    const views = await database
      .select({
        id: menuViews.id,
        restaurantId: menuViews.restaurantId,
        viewedAt: menuViews.viewedAt,
        ipAddress: menuViews.ipAddress,
        userAgent: menuViews.userAgent,
        referer: menuViews.referer,
      })
      .from(menuViews)
      .where(eq(menuViews.restaurantId, restaurantId))
      .orderBy(desc(menuViews.viewedAt))
      .limit(limit);

    return views.map((view) => ({
      id: view.id,
      restaurantId: view.restaurantId,
      viewedAt: view.viewedAt,
      ipAddress: view.ipAddress,
      userAgent: view.userAgent,
      referer: view.referer,
    }));
  } catch (error) {
    console.error("Failed to get recent menu views", error);
    return [];
  }
}

