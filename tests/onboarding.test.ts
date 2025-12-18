import assert from "node:assert/strict";
import test from "node:test";

import { toSlug } from "../lib/restaurants/domain";

test("toSlug normalizes restaurant names correctly", () => {
  assert.equal(toSlug("La Bodega de Juan"), "la-bodega-de-juan");
  assert.equal(toSlug("Restaurant El Niño"), "restaurant-el-nino");
  assert.equal(toSlug("Café & Bistro"), "cafe-bistro");
  assert.equal(toSlug("Restaurant  123"), "restaurant-123");
});

test("toSlug handles special characters", () => {
  assert.equal(toSlug("Café"), "cafe");
  assert.equal(toSlug("Restaurante El Niño"), "restaurante-el-nino");
  assert.equal(toSlug("Pizza's & Pasta"), "pizzas-pasta");
});

test("toSlug handles empty and whitespace strings", () => {
  assert.equal(toSlug(""), "");
  assert.equal(toSlug("   "), "");
  assert.equal(toSlug("---"), "");
});

test("toSlug normalizes multiple hyphens", () => {
  assert.equal(toSlug("restaurant---name"), "restaurant-name");
  assert.equal(toSlug("---restaurant---name---"), "restaurant-name");
});

test("toSlug handles numbers", () => {
  assert.equal(toSlug("Restaurant 123"), "restaurant-123");
  assert.equal(toSlug("Cafe2024"), "cafe2024");
});
