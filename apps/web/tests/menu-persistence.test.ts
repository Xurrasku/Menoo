import assert from "node:assert/strict";
import test from "node:test";

import { buildMenuPersistencePayload } from "../lib/menus/persistence";

test("buildMenuPersistencePayload normalizes categories and items", () => {
  const payload = buildMenuPersistencePayload({
    name: "Summer Menu",
    restaurantId: "11111111-1111-4111-8111-111111111111",
    categories: [
      {
        id: "cat-1",
        name: "Starters",
        description: "Fresh appetisers",
        dishes: [
          {
            id: "dish-1",
            name: "Tomato soup",
            description: "Served chilled",
            price: 12.5,
            currency: "EUR",
            thumbnail: "🥣",
            isVisible: true,
            labels: ["Vegan"],
            allergens: ["Soy"],
          },
        ],
      },
    ],
  });

  assert.equal(payload.menu.name, "Summer Menu");
  assert.equal(payload.menu.restaurantId, "11111111-1111-4111-8111-111111111111");
  assert.equal(payload.categories.length, 1);
  assert.equal(payload.categories[0].name, "Starters");
  assert.equal(payload.categories[0].position, 0);
  assert.equal(payload.items.length, 1);
  assert.equal(payload.items[0].categoryIndex, 0);
  assert.equal(payload.items[0].priceCents, 1250);
  assert.deepEqual(payload.items[0].labels, ["Vegan"]);
  assert.deepEqual(payload.items[0].allergens, ["Soy"]);
  assert.equal(payload.items[0].thumbnail, "🥣");
});

test("buildMenuPersistencePayload guards against invalid dish prices", () => {
  assert.throws(() =>
    buildMenuPersistencePayload({
      name: "Invalid menu",
      restaurantId: "11111111-1111-4111-8111-111111111111",
      categories: [
        {
          id: "cat-1",
          name: "Starters",
          description: "",
          dishes: [
            {
              id: "dish-1",
              name: "Free soup",
              description: "",
              price: -2,
              currency: "EUR",
              thumbnail: "🥣",
              isVisible: true,
              labels: [],
              allergens: [],
            },
          ],
        },
      ],
    })
  );
});

