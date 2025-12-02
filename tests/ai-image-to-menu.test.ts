import assert from "node:assert/strict";
import test from "node:test";

import { extractMenuFromImage, DEFAULT_IMAGE_MENU_MODEL } from "../ai/image-to-menu";
import { menuJsonSchema } from "../ai/schemas/menu";
import { getGeminiClient } from "../ai/client";

type MockMenu = {
  restaurant_name: string;
  language: string;
  categories: Array<{
    name: string;
    items: Array<{
      name: string;
      description?: string;
      price: number;
      currency?: string;
    }>;
  }>;
};

type MockContentPart =
  | { inlineData: { mimeType: string; data: string } }
  | { text: string };

type MockGenerateContentRequest = {
  model: string;
  contents: MockContentPart[];
  config?: {
    responseMimeType?: string;
    responseJsonSchema?: unknown;
  };
};

test("extractMenuFromImage sends structured output request and parses response", async () => {
  const menu: MockMenu = {
    restaurant_name: "Cafe Menoo",
    language: "en",
    categories: [
      {
        name: "Breakfast",
        items: [
          { name: "Pancakes", description: "With syrup", price: 8, currency: "USD" },
          { name: "Omelette", price: 10, currency: "USD" },
        ],
      },
    ],
  };

  const requests: MockGenerateContentRequest[] = [];
  const mockClient = {
    models: {
      async generateContent(request: MockGenerateContentRequest) {
        requests.push(request);
        return {
          text: () => JSON.stringify(menu),
        };
      },
    },
  };

  const source = Buffer.from("fake-image");
  const result = await extractMenuFromImage(source, {
    client: mockClient,
    mimeType: "image/png",
    model: "test-model",
  });

  assert.deepEqual(result, menu);
  assert.equal(requests.length, 1);

  const request = requests[0];
  assert.equal(request.model, "test-model");
  assert.equal(request.config?.responseMimeType, "application/json");
  assert.deepEqual(request.config?.responseJsonSchema, menuJsonSchema);

  const [imagePart, promptPart] = request.contents;
  assert.equal(imagePart.inlineData.mimeType, "image/png");
  assert.equal(imagePart.inlineData.data, source.toString("base64"));
  assert.match(promptPart.text, /Extract ONLY the menu information/i);
});

test("extractMenuFromImage infers mime from data url and defaults model", async () => {
  const requests: MockGenerateContentRequest[] = [];
  const mockClient = {
    models: {
      async generateContent(request: MockGenerateContentRequest) {
        requests.push(request);
        return { text: () => JSON.stringify({ categories: [] }) };
      },
    },
  };

  const dataUrl = "data:image/jpeg;base64," + Buffer.from("another-image").toString("base64");
  await extractMenuFromImage(dataUrl, { client: mockClient });

  const [request] = requests;
  assert.equal(request.model, DEFAULT_IMAGE_MENU_MODEL);
  const [imagePart] = request.contents;
  assert.equal(imagePart.inlineData.mimeType, "image/jpeg");
});

test("getGeminiClient throws when GEMINI_API_KEY is missing", () => {
  const original = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  assert.throws(() => getGeminiClient(), /GEMINI_API_KEY/i);

  if (original) {
    process.env.GEMINI_API_KEY = original;
  } else {
    delete process.env.GEMINI_API_KEY;
  }
});


