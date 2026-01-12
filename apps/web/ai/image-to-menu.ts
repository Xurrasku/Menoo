import { getGeminiClient, type GeminiClient } from "./client";
import { encodeImageSource, type ImageSource } from "./image-inline-data";
import { menuJsonSchema, type ExtractedMenu } from "./schemas/menu";

export const DEFAULT_IMAGE_MENU_MODEL = "gemini-2.5-flash";
const MENU_EXTRACTION_PROMPT = `
You see a restaurant menu photo.
Extract ONLY the menu information and return JSON that matches the provided schema.
Do NOT add explanations or markdown.
`.trim();

type GenerateContentParams = Parameters<GeminiClient["models"]["generateContent"]>[0];
type GenerateContentResult = Awaited<ReturnType<GeminiClient["models"]["generateContent"]>>;
type ResponseSchema =
  Exclude<GenerateContentParams["config"], undefined> extends { responseJsonSchema?: infer Schema }
    ? Schema
    : unknown;

type StructuredOutputClient = {
  models: {
    generateContent: (
      params: GenerateContentParams,
    ) => Promise<GenerateContentResult>;
  };
};

export type ImageToMenuOptions = {
  mimeType?: string;
  model?: string;
  prompt?: string;
  responseSchema?: ResponseSchema;
  client?: StructuredOutputClient;
};

export async function extractMenuFromImage(
  image: ImageSource,
  options: ImageToMenuOptions = {},
): Promise<ExtractedMenu> {
  const client: StructuredOutputClient = options.client ?? getGeminiClient();

  const inlineData = encodeImageSource(image, options.mimeType);
  const prompt = options.prompt ?? MENU_EXTRACTION_PROMPT;
  const model = options.model ?? DEFAULT_IMAGE_MENU_MODEL;
  const responseSchema = options.responseSchema ?? menuJsonSchema;

  const result = await client.models.generateContent({
    model,
    contents: [
      {
        inlineData,
      },
      {
        text: prompt,
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: responseSchema,
    },
  });

  const parsed = parseStructuredMenu(result);
  return normalizeExtractedMenu(parsed);
}

function parseStructuredMenu(result: GenerateContentResult) {
  const maybeText = readResponseText(result);
  if (!maybeText) {
    throw new Error("Gemini response did not include any text output");
  }

  try {
    return JSON.parse(maybeText) as unknown;
  } catch (error) {
    throw new Error("Gemini response was not valid JSON", { cause: error });
  }
}

function readResponseText(result: GenerateContentResult): string | undefined {
  const candidateText = getTextFromResult(result);
  if (candidateText && candidateText.trim().length > 0) {
    return candidateText.trim();
  }

  const candidate = result.candidates?.[0];
  const parts = candidate?.content?.parts ?? [];
  const textParts = parts
    .map((part) => {
      if (typeof (part as { text?: unknown }).text === "string") {
        return (part as { text: string }).text;
      }
      return undefined;
    })
    .filter((part): part is string => typeof part === "string");

  if (textParts.length === 0) {
    return undefined;
  }

  return textParts.join("").trim();
}

function getTextFromResult(result: GenerateContentResult): string | undefined {
  const textProp = (result as { text?: unknown }).text;
  if (typeof textProp === "function") {
    try {
      const value = textProp.call(result);
      return typeof value === "string" ? value : undefined;
    } catch {
      return undefined;
    }
  }

  if (typeof textProp === "string") {
    return textProp;
  }

  return undefined;
}

function normalizeExtractedMenu(payload: unknown): ExtractedMenu {
  if (!payload || typeof payload !== "object") {
    return { categories: [] };
  }

  const data = payload as Partial<ExtractedMenu>;

  return {
    restaurant_name: typeof data.restaurant_name === "string" ? data.restaurant_name : undefined,
    language: typeof data.language === "string" ? data.language : undefined,
    categories: Array.isArray(data.categories) ? data.categories : [],
  };
}

export { menuJsonSchema };
export { DEFAULT_IMAGE_MIME_TYPE } from "./image-inline-data";
export type { ImageSource } from "./image-inline-data";


