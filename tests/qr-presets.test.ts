import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_DOWNLOAD_PRESET,
  QR_DOWNLOAD_PRESETS,
  resolveDownloadConfig,
  type DownloadPresetId,
} from "../lib/qr/presets";

const DEMO_MENU_URL = "https://example.com/menu/demo";

test("download presets expose unique identifiers", () => {
  const ids = QR_DOWNLOAD_PRESETS.map((preset) => preset.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("svg preset resolves to vector format", () => {
  const config = resolveDownloadConfig(
    "svg" as DownloadPresetId,
    DEMO_MENU_URL,
  );

  assert.equal(config.format, "svg");
  assert.equal(config.url, DEMO_MENU_URL);
});

test("unknown preset falls back to default", () => {
  const config = resolveDownloadConfig("unknown" as DownloadPresetId, DEMO_MENU_URL);
  const fallback = QR_DOWNLOAD_PRESETS.find(
    (preset) => preset.id === DEFAULT_DOWNLOAD_PRESET,
  );

  assert.ok(fallback, "default preset must be present in the preset list");
  assert.equal(config.format, fallback!.format);
  assert.equal(config.width, fallback!.width);
  assert.equal(config.margin, fallback!.margin);
});

test("overrides allow adjusting request properties", () => {
  const widthOverride = 768;
  const config = resolveDownloadConfig(
    "svg" as DownloadPresetId,
    DEMO_MENU_URL,
    { width: widthOverride },
  );

  assert.equal(config.width, widthOverride);
});

















