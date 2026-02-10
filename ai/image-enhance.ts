import OpenAI, { toFile } from "openai";

import { encodeImageSource, type ImageSource } from "./image-inline-data";

export const DEFAULT_IMAGE_ENHANCE_MODEL = "gpt-image-1.5";

export const DEFAULT_IMAGE_ENHANCE_PROMPT =
  "Enhance this dish photo into professional food photography. Preserve the exact dish, ingredients, portion size, plating, and arrangement. Do not add, remove, or replace any ingredients or garnishes. Improve lighting, color balance, texture, and sharpness to look appetizing yet photorealistic. Remove distracting background objects and clutter, keeping a clean, neutral setting that matches the original plate or bowl. No stylization, no text, no logos, no watermark.";

export type ImageEnhanceOptions = {
  prompt?: string;
  mimeType?: string;
  model?: string;
  apiKey?: string;
};

export type ImageEnhanceResult = {
  base64Data: string;
  mimeType: string;
  toDataUrl(): string;
};

export async function generateImageEnhancement(
  image: ImageSource,
  options: ImageEnhanceOptions = {},
): Promise<ImageEnhanceResult> {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error("OPENAI_API_KEY is not defined");
  }

  const inlineData = encodeImageSource(image, options.mimeType);
  const prompt = options.prompt ?? DEFAULT_IMAGE_ENHANCE_PROMPT;
  const model = options.model ?? process.env.OPENAI_RESPONSES_MODEL ?? DEFAULT_IMAGE_ENHANCE_MODEL;
  const client = new OpenAI({ apiKey });
  const fileName = `input.${extensionFromMimeType(inlineData.mimeType)}`;
  const imageFile = await toFile(Buffer.from(inlineData.data, "base64"), fileName, {
    type: inlineData.mimeType,
  });

  const response = await client.images.edit({
    model,
    image: [imageFile],
    prompt,
  });

  const base64Data = response.data?.[0]?.b64_json;
  if (!base64Data) {
    throw new Error("OpenAI response did not include an image payload");
  }

  const mimeType = inlineData.mimeType || "image/png";
  return {
    base64Data,
    mimeType,
    toDataUrl() {
      return `data:${mimeType};base64,${base64Data}`;
    },
  };
}

function extensionFromMimeType(mimeType?: string) {
  if (!mimeType) {
    return "png";
  }

  const [, subtype] = mimeType.split("/");
  if (!subtype) {
    return "png";
  }

  return subtype.replace("jpeg", "jpg");
}
