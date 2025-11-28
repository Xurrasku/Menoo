import assert from "node:assert/strict";
import test from "node:test";

import { createSupabaseCookieAdapter, type SupabaseCookieStore } from "@/lib/supabase/server";

type CookieRecord = { name: string; value: string };

const cookieMutations: CookieRecord[] = [];

const cookieStore = {
  get(name: string) {
    void name;
    return undefined as { name: string; value: string } | undefined;
  },
  set(cookie: { name: string; value: string }) {
    cookieMutations.push({ name: cookie.name, value: cookie.value });
  },
} as unknown as SupabaseCookieStore;

test("createSupabaseCookieAdapter only mutates cookies when persistence is enabled", () => {
  cookieMutations.length = 0;

  const readonlyAdapter = createSupabaseCookieAdapter(cookieStore, false);
  const writableAdapter = createSupabaseCookieAdapter(cookieStore, true);

  readonlyAdapter.set("sb", "value");
  readonlyAdapter.remove("sb");
  assert.equal(cookieMutations.length, 0, "readonly contexts should never attempt to write cookies");

  writableAdapter.set("sb", "value");
  writableAdapter.remove("sb");
  assert.equal(cookieMutations.length, 2, "route handlers should be able to persist and clear cookies");
});


