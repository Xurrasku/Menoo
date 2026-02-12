import type { ImageSource } from "@/ai/image-inline-data";
import type { ExtractedMenu } from "@/ai/schemas/menu";
import { extractMenuFromImage } from "@/ai/image-to-menu";

export type AiMenuDraftDish = {
  name: string;
  description: string;
  price: number;
  currency: string;
};

export type AiMenuDraftCategory = {
  name: string;
  description: string;
  dishes: AiMenuDraftDish[];
};

export type AiMenuDraft = {
  name?: string;
  language?: string;
  categories: AiMenuDraftCategory[];
};

const DEFAULT_DISH_NAME = "Dish";
const DEFAULT_CATEGORY_DESCRIPTION = "";
const DEFAULT_CURRENCY = "€";

export function buildAiMenuDraft(menu: ExtractedMenu): AiMenuDraft {
  const categories = Array.isArray(menu.categories) ? menu.categories : [];

  const normalizedCategories = categories
    .map((category) => {
      const items = Array.isArray(category?.items) ? category.items : [];
      if (items.length === 0) {
        return null;
      }

      const dishes = items.map((item) => ({
        name: normalizeName(item.name) ?? DEFAULT_DISH_NAME,
        description: typeof item.description === "string" ? item.description.trim() : "",
        price: normalizePrice(item.price),
        currency: normalizeCurrency(item.currency),
      }));

      const categoryDescription = (category as { description?: string })?.description;
      return {
        name: normalizeName(category?.name) ?? "",
        description:
          typeof categoryDescription === "string" ? categoryDescription.trim() : DEFAULT_CATEGORY_DESCRIPTION,
        dishes,
      };
    })
    .filter((category): category is AiMenuDraftCategory => Boolean(category));

  return {
    name: normalizeName(menu.restaurant_name ?? undefined),
    language: typeof menu.language === "string" ? menu.language : undefined,
    categories: normalizedCategories,
  };
}

export async function generateMenuDraftFromImage(
  image: ImageSource,
  options: {
    mimeType?: string;
    extractor?: typeof extractMenuFromImage;
  } = {},
) {
  const extractor = options.extractor ?? extractMenuFromImage;
  const extracted = await extractor(image, { mimeType: options.mimeType });
  return buildAiMenuDraft(extracted);
}

function normalizeName(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizePrice(value: unknown): number {
  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
    return 0;
  }

  return value > 0 ? value : 0;
}

function normalizeCurrency(value: unknown): string {
  if (typeof value !== "string") {
    return DEFAULT_CURRENCY;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : DEFAULT_CURRENCY;
}



