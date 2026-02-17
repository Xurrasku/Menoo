import { NextRequest } from "next/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { items } from "@/db/schema";

const itemQuerySchema = z.object({
  categoryId: z.string().uuid().optional(),
});

const itemCreateSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  priceCents: z.number().int().nonnegative(),
  imageUrl: z.string().min(1).optional(),
  tags: z.array(z.string()).optional().default([]),
});

export async function GET(request: NextRequest) {
  const query = itemQuerySchema.safeParse(
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
      { data: [], warning: "Database client not initialised" },
      { status: 200 }
    );
  }

  const data = query.data.categoryId
    ? await db
        .select()
        .from(items)
        .where(eq(items.categoryId, query.data.categoryId))
        .orderBy(asc(items.createdAt))
    : await db
        .select()
        .from(items)
        .orderBy(asc(items.createdAt));

  return Response.json({ data }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const result = itemCreateSchema.safeParse(json);

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

  const [created] = await db
    .insert(items)
    .values(result.data)
    .returning();

  return Response.json({ data: created }, { status: 201 });
}

