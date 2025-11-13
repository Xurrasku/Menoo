import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const menuHtmlPath = join(process.cwd(), "public", "menu.html");

test("mobile menu HTML blueprint exists", () => {
  assert.ok(
    existsSync(menuHtmlPath),
    "Expected public/menu.html to exist as the mobile menu reference"
  );
});

test("mobile menu HTML exposes key content for diners", () => {
  assert.ok(
    existsSync(menuHtmlPath),
    "Expected public/menu.html to exist before inspecting its contents"
  );

  const markup = readFileSync(menuHtmlPath, "utf8");

  assert.match(
    markup,
    /<meta[^>]*name="viewport"[^>]*content="width=device-width, initial-scale=1"/i,
    "Viewport meta tag should ensure responsive behaviour"
  );

  assert.match(
    markup,
    /marcoslol/i,
    "The menu should highlight the venue name"
  );

  assert.match(
    markup,
    /Ensalada caprese/i,
    "The Caprese salad item should be rendered"
  );

  assert.match(
    markup,
    /Aros de cebolla/i,
    "The onion rings item should be rendered"
  );

  assert.match(
    markup,
    /Valora tu experiencia/i,
    "The feedback call-to-action should be present"
  );
});



