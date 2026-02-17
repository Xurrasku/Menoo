import { NextRequest } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { generateImageEnhancement } from "@/ai/image-enhance";
import { restaurants, visualAssets, visualPromptGallery } from "@/db/schema";
import { getServerUser } from "@/lib/auth/server";
import { db } from "@/lib/db";

const requestSchema = z.object({
  image: z.string().min(1, "Image data is required"),
  mimeType: z.string().optional(),
  prompt: z.string().trim().min(1).optional(),
  fileName: z.string().trim().min(1).max(255).optional(),
  promptGalleryId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const result = requestSchema.safeParse(payload);

  if (!result.success) {
    return Response.json({ error: result.error.flatten() }, { status: 400 });
  }

  try {
    const user = await getServerUser({ persistSession: true });
    const output = await generateImageEnhancement(result.data.image, {
      mimeType: result.data.mimeType,
      prompt: result.data.prompt,
    });

    const outputDataUrl = output.toDataUrl();
    // NOTE: Watermarking was disabled here to avoid sharp/libvips resolution
    // issues in local dev bundling. Authenticated dashboard users are the
    // primary path for this endpoint.
    let savedAsset: {
      id: string;
      imageDataUrl: string;
      originalFileName: string | null;
      createdAt: string;
    } | null = null;

    if (user && db) {
      const [restaurant] = await db
        .select({ id: restaurants.id })
        .from(restaurants)
        .where(eq(restaurants.ownerUserId, user.id))
        .limit(1);

      if (restaurant) {
        const [asset] = await db
          .insert(visualAssets)
          .values({
            restaurantId: restaurant.id,
            imageDataUrl: outputDataUrl,
            originalFileName: result.data.fileName ?? null,
            prompt: result.data.prompt ?? null,
          })
          .returning({
            id: visualAssets.id,
            imageDataUrl: visualAssets.imageDataUrl,
            originalFileName: visualAssets.originalFileName,
            createdAt: visualAssets.createdAt,
          });

        if (asset) {
          savedAsset = {
            id: asset.id,
            imageDataUrl: asset.imageDataUrl,
            originalFileName: asset.originalFileName,
            createdAt: asset.createdAt.toISOString(),
          };

          if (result.data.promptGalleryId) {
            await db
              .update(visualPromptGallery)
              .set({
                previewImageDataUrl: asset.imageDataUrl,
                sourceAssetId: asset.id,
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(visualPromptGallery.id, result.data.promptGalleryId),
                  eq(visualPromptGallery.restaurantId, restaurant.id),
                  isNull(visualPromptGallery.previewImageDataUrl),
                ),
              );
          }
        }
      }
    }

    const jobId = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `job_${Date.now()}`;

    return Response.json(
      {
        data: {
          jobId,
          status: "completed",
          output: outputDataUrl,
          savedAsset,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && /OPENAI_API_KEY/i.test(error.message)) {
      return Response.json(
        { error: "AI image enhancement is not configured." },
        { status: 503 },
      );
    }

    console.error("Failed to enhance image", error);
    const message =
      error instanceof Error
        ? error.message
        : "Unable to enhance image.";
    const safeMessage = process.env.NODE_ENV === "production"
      ? "Unable to enhance image."
      : message;
    return Response.json({ error: safeMessage }, { status: 500 });
  }
}
