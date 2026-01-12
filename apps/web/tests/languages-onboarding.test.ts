import assert from "node:assert/strict";
import test from "node:test";

/**
 * Tests for the Languages Onboarding Step
 * 
 * The Languages onboarding step allows users to:
 * 1. Upload menu files/images in additional languages for AI extraction
 * 2. Use AI to auto-translate their existing menu
 * 3. Skip and use sample translations (demo mode)
 */

// Language options available for translation
const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "ca", name: "Català", flag: "🏴" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
];

test("SUPPORTED_LANGUAGES contains required base languages", () => {
  const codes = SUPPORTED_LANGUAGES.map((lang) => lang.code);
  assert.ok(codes.includes("en"), "English should be supported");
  assert.ok(codes.includes("es"), "Spanish should be supported");
  assert.ok(codes.includes("ca"), "Catalan should be supported");
});

test("SUPPORTED_LANGUAGES has unique codes", () => {
  const codes = SUPPORTED_LANGUAGES.map((lang) => lang.code);
  const uniqueCodes = new Set(codes);
  assert.equal(codes.length, uniqueCodes.size, "All language codes should be unique");
});

test("all SUPPORTED_LANGUAGES have required properties", () => {
  for (const lang of SUPPORTED_LANGUAGES) {
    assert.ok(lang.code, "Language should have a code");
    assert.ok(lang.name, "Language should have a name");
    assert.ok(lang.flag, "Language should have a flag emoji");
    assert.ok(lang.code.length >= 2, "Language code should be at least 2 characters");
  }
});

// Test helper to check if a language is excluded (already the primary language)
function filterAvailableLanguages(primaryLanguage: string) {
  return SUPPORTED_LANGUAGES.filter((lang) => lang.code !== primaryLanguage);
}

test("filterAvailableLanguages excludes the primary language", () => {
  const available = filterAvailableLanguages("en");
  const codes = available.map((lang) => lang.code);
  
  assert.ok(!codes.includes("en"), "Primary language should be excluded");
  assert.ok(codes.includes("es"), "Other languages should remain");
  assert.ok(codes.includes("ca"), "Other languages should remain");
});

test("filterAvailableLanguages returns all languages when primary is not in list", () => {
  const available = filterAvailableLanguages("xx");
  assert.equal(available.length, SUPPORTED_LANGUAGES.length, "All languages should be available");
});

// Translation method options
type TranslationMethod = "upload" | "ai" | "skip";

type LanguageSelection = {
  code: string;
  method: TranslationMethod;
};

function validateLanguageSelection(
  selections: LanguageSelection[],
  primaryLanguage: string
): { valid: boolean; error?: string } {
  // Check for duplicate selections
  const codes = selections.map((s) => s.code);
  const uniqueCodes = new Set(codes);
  if (codes.length !== uniqueCodes.size) {
    return { valid: false, error: "Duplicate language selections are not allowed" };
  }

  // Check that primary language is not selected
  if (codes.includes(primaryLanguage)) {
    return { valid: false, error: "Cannot select the primary language for translation" };
  }

  // Check that all selected languages are supported
  const supportedCodes = SUPPORTED_LANGUAGES.map((l) => l.code);
  for (const code of codes) {
    if (!supportedCodes.includes(code)) {
      return { valid: false, error: `Unsupported language: ${code}` };
    }
  }

  return { valid: true };
}

test("validateLanguageSelection rejects duplicates", () => {
  const selections: LanguageSelection[] = [
    { code: "es", method: "ai" },
    { code: "es", method: "upload" },
  ];
  const result = validateLanguageSelection(selections, "en");
  assert.equal(result.valid, false);
  assert.ok(result.error?.includes("Duplicate"));
});

test("validateLanguageSelection rejects primary language", () => {
  const selections: LanguageSelection[] = [
    { code: "en", method: "ai" },
  ];
  const result = validateLanguageSelection(selections, "en");
  assert.equal(result.valid, false);
  assert.ok(result.error?.includes("primary"));
});

test("validateLanguageSelection accepts valid selections", () => {
  const selections: LanguageSelection[] = [
    { code: "es", method: "ai" },
    { code: "fr", method: "upload" },
  ];
  const result = validateLanguageSelection(selections, "en");
  assert.equal(result.valid, true);
  assert.equal(result.error, undefined);
});

test("validateLanguageSelection accepts empty selections (skip all)", () => {
  const selections: LanguageSelection[] = [];
  const result = validateLanguageSelection(selections, "en");
  assert.equal(result.valid, true);
});
