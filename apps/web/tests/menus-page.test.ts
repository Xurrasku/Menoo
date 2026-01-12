import assert from "node:assert/strict";
import test from "node:test";

import { resolveLocaleFromParams } from "../app/[locale]/(dashboard)/dashboard/(with-nav)/menus/locale";

test("resolveLocaleFromParams awaits promise params", async () => {
  const locale = await resolveLocaleFromParams(Promise.resolve({ locale: "es" }));

  assert.equal(locale, "es");
});

test("resolveLocaleFromParams accepts already resolved params", async () => {
  const locale = await resolveLocaleFromParams({ locale: "ca" });

  assert.equal(locale, "ca");
});

