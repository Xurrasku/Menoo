import assert from "node:assert/strict";
import test from "node:test";

import { buildMenuDomain } from "../lib/restaurants/domain";

test("buildMenuDomain slugifies restaurant name", () => {
  const previousBase = process.env.NEXT_PUBLIC_MENU_DOMAIN_BASE;
  process.env.NEXT_PUBLIC_MENU_DOMAIN_BASE = "https://menus.menoo.app";

  try {
    const result = buildMenuDomain("Restaurante El Niño");

    assert.equal(result.slug, "restaurante-el-nino");
    assert.equal(result.url, "https://menus.menoo.app/restaurante-el-nino");
  } finally {
    if (previousBase === undefined) {
      delete process.env.NEXT_PUBLIC_MENU_DOMAIN_BASE;
    } else {
      process.env.NEXT_PUBLIC_MENU_DOMAIN_BASE = previousBase;
    }
  }
});

test("buildMenuDomain rejects empty names", () => {
  assert.throws(() => buildMenuDomain("   "), /restaurant name/i);
});



