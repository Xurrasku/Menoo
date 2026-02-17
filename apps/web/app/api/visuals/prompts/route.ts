import { NextRequest } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { restaurants, visualPromptGallery } from "@/db/schema";
import { getServerUser } from "@/lib/auth/server";
import { db } from "@/lib/db";

const styleConfigSchema = z
  .record(z.string(), z.unknown())
  .optional();

const createPromptSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120, "Title is too long"),
  prompt: z.string().trim().min(1, "Prompt is required"),
  styleConfig: styleConfigSchema,
  previewImageDataUrl: z.string().min(1).optional(),
  sourceAssetId: z.string().uuid().optional(),
});

async function getUserRestaurantId(userId: string): Promise<string | null> {
  if (!db) return null;
  const [restaurant] = await db
    .select({ id: restaurants.id })
    .from(restaurants)
    .where(eq(restaurants.ownerUserId, userId))
    .limit(1);
  return restaurant?.id ?? null;
}

export async function GET() {
  const user = await getServerUser({ persistSession: true });

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!db) {
    return Response.json({ data: [], warning: "Database client not initialised" }, { status: 200 });
  }

  const restaurantId = await getUserRestaurantId(user.id);
  if (!restaurantId) {
    return Response.json({ data: [] }, { status: 200 });
  }

  const prompts = await db
    .select({
      id: visualPromptGallery.id,
      title: visualPromptGallery.title,
      prompt: visualPromptGallery.prompt,
      styleConfig: visualPromptGallery.styleConfig,
      previewImageDataUrl: visualPromptGallery.previewImageDataUrl,
      sourceAssetId: visualPromptGallery.sourceAssetId,
      createdAt: visualPromptGallery.createdAt,
    })
    .from(visualPromptGallery)
    .where(eq(visualPromptGallery.restaurantId, restaurantId))
    .orderBy(desc(visualPromptGallery.createdAt))
    .limit(30);

  return Response.json(
    {
      data: prompts.map((entry) => ({
        id: entry.id,
        title: entry.title,
        prompt: entry.prompt,
        styleConfig: entry.styleConfig,
        previewImageDataUrl: entry.previewImageDataUrl,
        sourceAssetId: entry.sourceAssetId,
        createdAt: entry.createdAt.toISOString(),
      })),
    },
    { status: 200 },
  );
}

export async function POST(request: NextRequest) {
  const user = await getServerUser({ persistSession: true });

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = createPromptSchema.safeParse(payload);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!db) {
    return Response.json({ error: "Database client not initialised" }, { status: 503 });
  }

  const restaurantId = await getUserRestaurantId(user.id);
  if (!restaurantId) {
    return Response.json({ error: "Restaurant not configured" }, { status: 409 });
  }

  const [created] = await db
    .insert(visualPromptGallery)
    .values({
      restaurantId,
      title: parsed.data.title,
      prompt: parsed.data.prompt,
      styleConfig: parsed.data.styleConfig ?? null,
      previewImageDataUrl: parsed.data.previewImageDataUrl ?? null,
      sourceAssetId: parsed.data.sourceAssetId ?? null,
    })
    .returning({
      id: visualPromptGallery.id,
      title: visualPromptGallery.title,
      prompt: visualPromptGallery.prompt,
      styleConfig: visualPromptGallery.styleConfig,
      previewImageDataUrl: visualPromptGallery.previewImageDataUrl,
      sourceAssetId: visualPromptGallery.sourceAssetId,
      createdAt: visualPromptGallery.createdAt,
    });

  return Response.json(
    {
      data: {
        id: created.id,
        title: created.title,
        prompt: created.prompt,
        styleConfig: created.styleConfig,
        previewImageDataUrl: created.previewImageDataUrl,
        sourceAssetId: created.sourceAssetId,
        createdAt: created.createdAt.toISOString(),
      },
    },
    { status: 201 },
  );
}
