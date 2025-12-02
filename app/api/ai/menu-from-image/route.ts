import { NextRequest } from "next/server";
import { z } from "zod";

import { generateMenuDraftFromImage } from "@/lib/menus/ai-import";

const requestSchema = z.object({
  image: z.string().min(1, "Image data is required"),
  mimeType: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const result = requestSchema.safeParse(payload);

  if (!result.success) {
    return Response.json({ error: result.error.flatten() }, { status: 400 });
  }

  try {
    const draft = await generateMenuDraftFromImage(result.data.image, {
      mimeType: result.data.mimeType,
    });

    if (draft.categories.length === 0) {
      return Response.json(
        { error: "No menu content detected in the provided image." },
        { status: 422 },
      );
    }

    return Response.json({ data: draft }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && /GEMINI_API_KEY/i.test(error.message)) {
      return Response.json(
        { error: "AI menu extraction is not configured." },
        { status: 503 },
      );
    }

    console.error("Failed to generate menu from image", error);
    return Response.json({ error: "Unable to extract menu from image." }, { status: 500 });
  }
}



