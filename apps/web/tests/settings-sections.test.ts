import assert from "node:assert/strict";
import test from "node:test";

import caMessages from "../messages/ca.json";
import enMessages from "../messages/en.json";
import esMessages from "../messages/es.json";

import { SETTINGS_SECTIONS } from "../app/[locale]/(dashboard)/dashboard/(with-nav)/settings/sections";

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

test("settings page exposes expected number of sections", () => {
  assert.equal(SETTINGS_SECTIONS.length, 8);
});

test("settings sections expose unique identifiers", () => {
  const ids = SETTINGS_SECTIONS.map((section) => section.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("settings section titles and descriptions are translated in supported locales", () => {
  for (const [locale, messages] of Object.entries(LOCALES)) {
    for (const section of SETTINGS_SECTIONS) {
      const title = resolveKey(messages, `settings.${section.titleKey}`);
      const description = resolveKey(messages, `settings.${section.descriptionKey}`);

      assert.ok(
        typeof title === "string" && title.length > 0,
        `missing title for section ${section.id} in ${locale}`,
      );
      assert.ok(
        typeof description === "string" && description.length > 0,
        `missing description for section ${section.id} in ${locale}`,
      );
    }
  }
});

test("settings preview content is available for all locales", () => {
  const previewItemKeys = ["caprese", "gazpacho", "onionRings"] as const;

  for (const [locale, messages] of Object.entries(LOCALES)) {
    const subtitle = resolveKey(messages, "settings.subtitle");
    const time = resolveKey(messages, "settings.preview.time");
    const restaurant = resolveKey(messages, "settings.preview.restaurant");
    const section = resolveKey(messages, "settings.preview.section");
    const cta = resolveKey(messages, "settings.preview.cta");

    assert.equal(typeof subtitle, "string", `missing settings.subtitle in ${locale}`);
    assert.equal(typeof time, "string", `missing settings.preview.time in ${locale}`);
    assert.equal(
      typeof restaurant,
      "string",
      `missing settings.preview.restaurant in ${locale}`,
    );
    assert.equal(typeof section, "string", `missing settings.preview.section in ${locale}`);
    assert.equal(typeof cta, "string", `missing settings.preview.cta in ${locale}`);

    for (const key of previewItemKeys) {
      const name = resolveKey(messages, `settings.preview.items.${key}.name`);
      const description = resolveKey(messages, `settings.preview.items.${key}.description`);

      assert.equal(
        typeof name,
        "string",
        `missing settings.preview.items.${key}.name in ${locale}`,
      );
      assert.equal(
        typeof description,
        "string",
        `missing settings.preview.items.${key}.description in ${locale}`,
      );
    }
  }
});

