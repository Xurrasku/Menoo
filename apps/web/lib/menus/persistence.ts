type DishDraft = {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  thumbnail?: string;
  isVisible?: boolean;
  labels?: string[];
  allergens?: string[];
};

type CategoryDraft = {
  id: string;
  name: string;
  description?: string;
  dishes: DishDraft[];
};

export type MenuDraft = {
  name: string;
  restaurantId?: string;
  isDefault?: boolean;
  categories: CategoryDraft[];
};

export type MenuPersistencePayload = {
  menu: {
    name: string;
    restaurantId?: string;
    isDefault: boolean;
  };
  categories: Array<{
    name: string;
    description: string;
    position: number;
  }>;
  items: Array<{
    categoryIndex: number;
    name: string;
    description: string;
    priceCents: number;
    currency: string;
    thumbnail: string | null;
    isVisible: boolean;
    labels: string[];
    allergens: string[];
  }>;
};

const EURO_SYMBOLS = new Set(["€", "EUR", "eur"]);

function normaliseCurrency(currency?: string) {
  if (!currency) return "EUR";
  if (EURO_SYMBOLS.has(currency)) return "EUR";
  const cleaned = currency.trim().toUpperCase();
  return cleaned.length === 0 ? "EUR" : cleaned.slice(0, 3);
}

function toPriceCents(price: number) {
  if (!Number.isFinite(price) || price < 0) {
    throw new Error(`Invalid dish price: ${price}`);
  }

  return Math.round(price * 100);
}

export function buildMenuPersistencePayload(draft: MenuDraft): MenuPersistencePayload {
  const menuName = draft.name.trim();

  if (!menuName) {
    throw new Error("Menu name is required");
  }

  const categories = draft.categories.map((category, index) => ({
    name: category.name.trim() || `Category ${index + 1}`,
    description: category.description?.trim() ?? "",
    position: index,
  }));

  const items = draft.categories.flatMap((category, categoryIndex) =>
    category.dishes.map((dish) => {
      const priceCents = toPriceCents(dish.price);

      return {
        categoryIndex,
        name: dish.name.trim() || "Dish",
        description: dish.description?.trim() ?? "",
        priceCents,
        currency: normaliseCurrency(dish.currency),
        thumbnail: dish.thumbnail?.trim() ?? null,
        isVisible: dish.isVisible ?? true,
        labels: dish.labels?.map((label) => label.trim()).filter(Boolean) ?? [],
        allergens: dish.allergens?.map((allergen) => allergen.trim()).filter(Boolean) ?? [],
      };
    })
  );

  return {
    menu: {
      name: menuName,
      restaurantId: draft.restaurantId,
      isDefault: draft.isDefault ?? false,
    },
    categories,
    items,
  };
}


