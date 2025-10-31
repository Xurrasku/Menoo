import { NextRequest } from "next/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { categories } from "@/db/schema";

const categoryQuerySchema = z.object({
  menuId: z.string().uuid().optional(),
});

const categoryCreateSchema = z.object({
  menuId: z.string().uuid(),
  name: z.string().min(1),
  position: z.number().int().min(0).optional().default(0),
});

export async function GET(request: NextRequest) {
  const query = categoryQuerySchema.safeParse(
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

  let builder = db
    .select()
    .from(categories)
    .orderBy(asc(categories.position));

  if (query.data.menuId) {
    builder = builder.where(eq(categories.menuId, query.data.menuId));
  }

  const data = await builder;

  return Response.json({ data }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const result = categoryCreateSchema.safeParse(json);

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
    .insert(categories)
    .values(result.data)
    .returning();

  return Response.json({ data: created }, { status: 201 });
}

