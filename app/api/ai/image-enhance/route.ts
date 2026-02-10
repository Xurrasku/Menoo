import { NextRequest } from "next/server";
import { z } from "zod";

import { generateImageEnhancement } from "@/ai/image-enhance";
import { getServerUser } from "@/lib/auth/server";
import { applyLogoWatermarkToDataUrl } from "@/lib/images/watermark";

const requestSchema = z.object({
  image: z.string().min(1, "Image data is required"),
  mimeType: z.string().optional(),
  prompt: z.string().trim().min(1).optional(),
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

    let outputDataUrl = output.toDataUrl();
    if (!user) {
      outputDataUrl = await applyLogoWatermarkToDataUrl(outputDataUrl);
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
