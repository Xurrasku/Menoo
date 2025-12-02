import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  DEFAULT_IMAGE_EDIT_MODEL,
  generateImageEdit,
  nanoBananaEdit,
} from "../ai/image-edit";

type MockContentPart =
  | { text: string }
  | { inlineData: { mimeType?: string; data: string } };

type MockGenerateContentRequest = {
  model: string;
  contents: MockContentPart[];
};

test("generateImageEdit sends prompt + inline image and returns binary helpers", async () => {
  const requests: MockGenerateContentRequest[] = [];
  const mockClient = {
    models: {
      async generateContent(request: MockGenerateContentRequest) {
        requests.push(request);
        return {
          candidates: [
            {
              content: {
                parts: [
                  {
                    inlineData: {
                      data: Buffer.from("edited-image").toString("base64"),
                      mimeType: "image/png",
                    },
                  },
                ],
              },
            },
          ],
        };
      },
    },
  };

  const image = Buffer.from("original-image");
  const result = await generateImageEdit(image, {
    prompt: "Make it pastel",
    client: mockClient,
  });

  assert.equal(requests.length, 1);
  const [request] = requests;
  assert.equal(request.model, DEFAULT_IMAGE_EDIT_MODEL);
  const [promptPart, imagePart] = request.contents;
  assert.equal(promptPart.text, "Make it pastel");
  assert.equal(imagePart.inlineData.mimeType, "image/jpeg");
  assert.equal(imagePart.inlineData.data, image.toString("base64"));

  assert.equal(result.mimeType, "image/png");
  assert.equal(result.base64Data, Buffer.from("edited-image").toString("base64"));
  assert.equal(result.buffer.toString(), "edited-image");
  assert.match(result.toDataUrl(), /^data:image\/png;base64,/);
});

test("nanoBananaEdit reads input file, writes output file, and returns helpers", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "nanobanana-"));
  const inputPath = path.join(dir, "input.png");
  const outputPath = path.join(dir, "output.png");

  const originalImage = Buffer.from("disk-image");
  await writeFile(inputPath, originalImage);

  const generatedBase64 = Buffer.from("transformed").toString("base64");
  const mockClient = {
    models: {
      async generateContent() {
        return {
          candidates: [
            {
              content: {
                parts: [
                  {
                    inlineData: {
                      data: generatedBase64,
                      mimeType: "image/png",
                    },
                  },
                ],
              },
            },
          ],
        };
      },
    },
  };

  const result = await nanoBananaEdit({
    inputPath,
    outputPath,
    prompt: "Hero illustration",
    client: mockClient,
  });

  const written = await readFile(outputPath);
  assert.equal(result.base64Data, generatedBase64);
  assert.equal(result.buffer.toString(), "transformed");
  assert.equal(written.toString(), "transformed");
});


