import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { menus } from "@/db/schema";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const menuUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  isDefault: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = paramsSchema.parse(params);
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = paramsSchema.parse(params);

  if (!db) {
    return Response.json(
      { error: "Database client not initialised" },
      { status: 503 }
    );
  }

  const [deleted] = await db
    .delete(menus)
    .where(eq(menus.id, id))
    .returning();

  if (!deleted) {
    return Response.json({ error: "Menu not found" }, { status: 404 });
  }

  return Response.json({ data: deleted }, { status: 200 });
}

