import assert from "node:assert/strict";
import test from "node:test";

import { buildAiMenuDraft, generateMenuDraftFromImage } from "../lib/menus/ai-import";
import type { ExtractedMenu } from "../ai/schemas/menu";

test("buildAiMenuDraft normalizes menu name, categories, and dishes", () => {
  const extracted: ExtractedMenu = {
    restaurant_name: "  Casa Luna ",
    language: "en",
    categories: [
      {
        name: " Brunch  ",
        items: [
          {
            name: " Avocado Toast ",
            description: "Sourdough with smashed avocado",
            price: 12.5,
            currency: "USD",
          },
          {
            name: "",
            description: undefined,
            price: -4,
          },
        ],
      },
      {
        name: "",
        items: [],
      },
    ],
  };

  const draft = buildAiMenuDraft(extracted);

  assert.equal(draft.name, "Casa Luna");
  assert.equal(draft.language, "en");
  assert.equal(draft.categories.length, 1);
  const [category] = draft.categories;
  assert.equal(category.name, "Brunch");
  assert.equal(category.description, "");
  assert.equal(category.dishes.length, 2);

  const [firstDish, secondDish] = category.dishes;
  assert.equal(firstDish.name, "Avocado Toast");
  assert.equal(firstDish.description, "Sourdough with smashed avocado");
  assert.equal(firstDish.price, 12.5);
  assert.equal(firstDish.currency, "USD");
  assert.equal(secondDish.name, "Dish");
  assert.equal(secondDish.price, 0);
  assert.equal(secondDish.currency, "€");
});

test("generateMenuDraftFromImage composes buildAiMenuDraft with custom extractor", async () => {
  const menu: ExtractedMenu = {
    restaurant_name: "AI Bistro",
    language: "es",
    categories: [
      {
        name: "Tapas",
        items: [{ name: "Tortilla", price: 8 }],
      },
    ],
  };

  const draft = await generateMenuDraftFromImage("fake-image", {
    mimeType: "image/png",
    extractor: async (image, options) => {
      assert.equal(image, "fake-image");
      assert.equal(options?.mimeType, "image/png");
      return menu;
    },
  });

  assert.equal(draft.name, "AI Bistro");
  assert.equal(draft.categories.length, 1);
  assert.equal(draft.categories[0].dishes[0].name, "Tortilla");
});


