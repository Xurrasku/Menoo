import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { items } from "@/db/schema";

const paramsSchema = z.object({ id: z.string().uuid() });

const itemUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  priceCents: z.number().int().nonnegative().optional(),
  imageUrl: z.string().url().optional().nullable(),
  tags: z.array(z.string()).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = paramsSchema.parse(await params);
  const json = await request.json().catch(() => null);
  const result = itemUpdateSchema.safeParse(json);

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
    .update(items)
    .set({ ...result.data, updatedAt: new Date() })
    .where(eq(items.id, id))
    .returning();

  if (!updated) {
    return Response.json({ error: "Item not found" }, { status: 404 });
  }

  return Response.json({ data: updated }, { status: 200 });
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

  const [deleted] = await db
    .delete(items)
    .where(eq(items.id, id))
    .returning();

  if (!deleted) {
    return Response.json({ error: "Item not found" }, { status: 404 });
  }

  return Response.json({ data: deleted }, { status: 200 });
}

