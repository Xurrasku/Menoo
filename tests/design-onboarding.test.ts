import assert from "node:assert/strict";
import test from "node:test";

/**
 * Design step form validation tests
 * The design step allows users to provide design preferences via:
 * - A website URL reference
 * - A text description
 * At least one of these must be provided.
 */

// Design preference validation schema (mirrors what will be in the form)
function validateDesignPreferences(data: {
  designUrl?: string;
  designDescription?: string;
}): { valid: boolean; error?: string } {
  const hasUrl = data.designUrl && data.designUrl.trim().length > 0;
  const hasDescription = data.designDescription && data.designDescription.trim().length > 0;

  if (!hasUrl && !hasDescription) {
    return {
      valid: false,
      error: "Please provide either a website URL or a design description",
    };
  }

  if (hasUrl) {
    try {
      new URL(data.designUrl!);
    } catch {
      return {
        valid: false,
        error: "Please enter a valid URL",
      };
    }
  }

  return { valid: true };
}

test("design step validates with URL only", () => {
  const result = validateDesignPreferences({
    designUrl: "https://example.com",
    designDescription: "",
  });
  assert.equal(result.valid, true);
});

test("design step validates with description only", () => {
  const result = validateDesignPreferences({
    designUrl: "",
    designDescription: "Modern, minimalist design with dark colors",
  });
  assert.equal(result.valid, true);
});

test("design step validates with both URL and description", () => {
  const result = validateDesignPreferences({
    designUrl: "https://my-restaurant.com",
    designDescription: "Match the branding from our website",
  });
  assert.equal(result.valid, true);
});

test("design step fails when both are empty", () => {
  const result = validateDesignPreferences({
    designUrl: "",
    designDescription: "",
  });
  assert.equal(result.valid, false);
  assert.equal(
    result.error,
    "Please provide either a website URL or a design description"
  );
});

test("design step fails when both are undefined", () => {
  const result = validateDesignPreferences({});
  assert.equal(result.valid, false);
});

test("design step fails with invalid URL", () => {
  const result = validateDesignPreferences({
    designUrl: "not-a-valid-url",
    designDescription: "",
  });
  assert.equal(result.valid, false);
  assert.equal(result.error, "Please enter a valid URL");
});

test("design step validates URL with path", () => {
  const result = validateDesignPreferences({
    designUrl: "https://example.com/menu/styles",
    designDescription: "",
  });
  assert.equal(result.valid, true);
});

test("design step trims whitespace from description", () => {
  const result = validateDesignPreferences({
    designUrl: "",
    designDescription: "   ",
  });
  assert.equal(result.valid, false);
});

test("design step trims whitespace from URL", () => {
  const result = validateDesignPreferences({
    designUrl: "   ",
    designDescription: "",
  });
  assert.equal(result.valid, false);
});
