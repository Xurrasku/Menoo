import { readFile, writeFile } from "node:fs/promises";

import { getGeminiClient, type GeminiClient } from "./client";
import { encodeImageSource, type ImageSource } from "./image-inline-data";

/**
 * Default model for image generation/editing (Nano Banana).
 * 
 * Note: Image generation models may not be available on the free tier.
 * If you encounter quota errors, check:
 * 1. Your Google Cloud Console API quotas
 * 2. Whether image generation is enabled for your project
 * 3. Consider upgrading to a paid plan for image generation access
 * 
 * Alternative model names to try if this doesn't work:
 * - "gemini-2.5-flash-preview-image" (preview version)
 */
export const DEFAULT_IMAGE_EDIT_MODEL = "gemini-2.5-flash-image";

type GenerateContentParams = Parameters<GeminiClient["models"]["generateContent"]>[0];
type GenerateContentResult = Awaited<ReturnType<GeminiClient["models"]["generateContent"]>>;

type ImageEditClient = {
  models: {
    generateContent: (
      params: GenerateContentParams,
    ) => Promise<GenerateContentResult>;
  };
};

export type ImageEditOptions = {
  prompt: string;
  mimeType?: string;
  model?: string;
  client?: ImageEditClient;
};

export type ImageEditResult = {
  base64Data: string;
  mimeType: string;
  buffer: Buffer;
  toDataUrl(): string;
};

type InlineDataPart = {
  inlineData?: {
    data: string;
    mimeType?: string;
  };
};

export async function generateImageEdit(
  image: ImageSource,
  options: ImageEditOptions,
): Promise<ImageEditResult> {
  if (!options?.prompt || options.prompt.trim().length === 0) {
    throw new Error("prompt is required to generate an image edit");
  }

  const client: ImageEditClient = options.client ?? getGeminiClient();
  const inlineData = encodeImageSource(image, options.mimeType);
  const model = options.model ?? DEFAULT_IMAGE_EDIT_MODEL;

  try {
    const result = await client.models.generateContent({
      model,
      contents: [
        { text: options.prompt },
        { inlineData },
      ],
    });

    const imagePart = findInlineImagePart(result);
    if (!imagePart?.inlineData?.data) {
      throw new Error("Gemini response did not include an image payload");
    }

    const base64Data = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType ?? inlineData.mimeType;
    const buffer = Buffer.from(base64Data, "base64");

    return {
      base64Data,
      mimeType,
      buffer,
      toDataUrl() {
        return `data:${mimeType};base64,${base64Data}`;
      },
    };
  } catch (error) {
    // Improve error messages for quota/rate limit issues
    if (error && typeof error === "object" && "error" in error) {
      const apiError = error as { error?: { code?: number; message?: string; status?: string } };
      if (apiError.error?.status === "RESOURCE_EXHAUSTED" || apiError.error?.code === 429) {
        const message = apiError.error.message || "Quota exceeded";
        throw new Error(
          `Gemini API quota exceeded. Image generation may not be available on the free tier.\n` +
            `Error: ${message}\n` +
            `Please check your Google Cloud Console quotas or upgrade to a paid plan.`,
          { cause: error }
        );
      }
    }
    throw error;
  }
}

export type NanoBananaEditOptions = {
  inputPath: string;
  outputPath?: string;
  prompt: string;
  mimeType?: string;
  model?: string;
  client?: ImageEditClient;
};

export async function nanoBananaEdit(
  options: NanoBananaEditOptions,
): Promise<ImageEditResult> {
  const imageBuffer = await readFile(options.inputPath);

  const result = await generateImageEdit(imageBuffer, {
    prompt: options.prompt,
    mimeType: options.mimeType,
    model: options.model,
    client: options.client,
  });

  if (options.outputPath) {
    await writeFile(options.outputPath, result.buffer);
  }

  return result;
}

function findInlineImagePart(
  result: GenerateContentResult,
): InlineDataPart | undefined {
  const candidates = result?.candidates ?? [];
  for (const candidate of candidates) {
    const parts = candidate?.content?.parts ?? [];
    for (const part of parts) {
      if (typeof part === "object" && part !== null && "inlineData" in part) {
        return part as InlineDataPart;
      }
    }
  }
  return undefined;
}

export type { ImageSource } from "./image-inline-data";

