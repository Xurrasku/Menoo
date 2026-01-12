import assert from "node:assert/strict";
import test from "node:test";

import caMessages from "../messages/ca.json";
import enMessages from "../messages/en.json";
import esMessages from "../messages/es.json";

type Messages = Record<string, unknown>;

const LOCALES: Record<string, Messages> = {
  ca: caMessages,
  en: enMessages,
  es: esMessages,
};

const resolveKey = (messages: Messages, key: string) => {
  return key.split(".").reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === "object" && segment in (acc as Messages)) {
      return (acc as Messages)[segment];
    }

    return undefined;
  }, messages);
};

test("dashboard row actions are translated in supported locales", () => {
  const requiredKeys = ["edit", "duplicate", "delete"] as const;

  for (const [locale, messages] of Object.entries(LOCALES)) {
    for (const key of requiredKeys) {
      const value = resolveKey(messages, `dashboard.rowActions.${key}`);

      assert.equal(
        typeof value,
        "string",
        `missing dashboard.rowActions.${key} in ${locale}`,
      );
    }
  }
});









