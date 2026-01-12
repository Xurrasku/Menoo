#!/usr/bin/env tsx

import "dotenv/config";
import path from "node:path";
import { nanoBananaEdit } from "../ai/image-edit";

const shouldSkip =
  process.env.npm_lifecycle_event === "test" && process.env.RUN_IMAGE_GENERATION_TEST !== "true";

if (shouldSkip) {
  console.log(
    "Skipping Nano Banana image generation smoke test. Set RUN_IMAGE_GENERATION_TEST=true to enable it during npm test.",
  );
  process.exit(0);
}

async function main() {
  const inputImage = path.join(process.cwd(), "public", "assets", "logo.png");
  const outputImage = path.join(process.cwd(), "public", "assets", "logo-nanobanana-test.png");

  const prompt = `Transform this logo into a clean, modern hero illustration for a digital restaurant menu app. Use soft pastel colors (#F5F0EA, #E9C9C0, #C06A5A, #2E2A28), flat illustration style, modern startup aesthetic. Make it suitable as a background header image.`;

  console.log("🎨 Testing Nano Banana image generation...");
  console.log(`📥 Input: ${inputImage}`);
  console.log(`📤 Output: ${outputImage}`);
  console.log(`💬 Prompt: ${prompt}`);
  console.log("");

  try {
    const result = await nanoBananaEdit({
      inputPath: inputImage,
      outputPath: outputImage,
      prompt,
      mimeType: "image/png",
    });

    console.log("✅ Success! Generated image:");
    console.log(`   - MIME Type: ${result.mimeType}`);
    console.log(`   - Size: ${result.buffer.length} bytes`);
    console.log(`   - Saved to: ${outputImage}`);
    console.log(`   - Data URL length: ${result.toDataUrl().length} chars`);
  } catch (error) {
    console.error("❌ Error generating image:");
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
      if (error.cause) {
        console.error(`   Cause: ${error.cause}`);
      }
    } else {
      console.error(error);
    }
    
    console.log("\n💡 Troubleshooting tips:");
    console.log("   1. Image generation may not be available on the free tier");
    console.log("   2. Check your Google Cloud Console API quotas");
    console.log("   3. Try using 'gemini-2.5-flash-preview-image' as the model");
    console.log("   4. Consider upgrading to a paid plan for image generation");
    console.log("   5. Wait for quota reset if you've hit rate limits");
    
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});

