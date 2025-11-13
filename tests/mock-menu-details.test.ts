import assert from "node:assert/strict";
import test from "node:test";

import { mockMenus } from "../lib/mock/menus";
import { getMockMenuDetail } from "../lib/mock/menu-details";

test("mock menu details exist for each menu", () => {
  for (const menu of mockMenus) {
    const detail = getMockMenuDetail(menu.id);

    assert.ok(detail, `missing menu detail for ${menu.id}`);
    assert.equal(detail.id, menu.id);
    assert.equal(detail.name, menu.name);

    if (typeof menu.categories === "number") {
      assert.equal(
        detail.categories.length,
        menu.categories,
        `unexpected category count for ${menu.id}`,
      );
    }
  }
});

test("menu details expose category metadata necessary for editing", () => {
  for (const menu of mockMenus) {
    const detail = getMockMenuDetail(menu.id);

    if (!detail) continue;

    for (const category of detail.categories) {
      assert.equal(typeof category.id, "string");
      assert.ok(category.id.length > 0, "category id cannot be empty");

      assert.equal(typeof category.name, "string");
      assert.ok(category.name.length > 0, "category name cannot be empty");

      assert.equal(typeof category.description, "string");
    }
  }
});






