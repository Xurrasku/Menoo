import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

type WatermarkOptions = {
  logoPath?: string;
};

type DataUrlParts = {
  mimeType: string;
  base64Data: string;
};

const DEFAULT_LOGO_PATH = path.join(process.cwd(), "public", "assets", "logo.png");

export async function applyLogoWatermarkToDataUrl(
  dataUrl: string,
  options: WatermarkOptions = {},
): Promise<string> {
  const { base64Data } = parseDataUrl(dataUrl);
  const baseImageBuffer = Buffer.from(base64Data, "base64");
  const baseImage = sharp(baseImageBuffer, { failOnError: false });
  const metadata = await baseImage.metadata();

  if (!metadata.width || !metadata.height) {
    return dataUrl;
  }

  const logoBuffer = await readFile(options.logoPath ?? DEFAULT_LOGO_PATH);
  const targetWidth = clamp(Math.round(metadata.width * 0.9), 240, metadata.width);
  const logoResizedBuffer = await sharp(logoBuffer)
    .resize({ width: targetWidth })
    .png()
    .toBuffer();
  const logoMeta = await sharp(logoResizedBuffer).metadata();
  const logoWidth = logoMeta.width ?? targetWidth;
  const logoHeight = logoMeta.height ?? Math.round(targetWidth * 0.4);
  const logoOpacity = 0.4;

  const margin = clamp(Math.round(metadata.height * 0.04), 16, 48);
  const left = Math.max(Math.round((metadata.width - logoWidth) / 2), 0);
  const top = Math.max(metadata.height - logoHeight - margin, 0);
  const logoOverlaySvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${logoWidth}" height="${logoHeight}"><image href="data:image/png;base64,${logoResizedBuffer.toString("base64")}" width="${logoWidth}" height="${logoHeight}" opacity="${logoOpacity}"/></svg>`,
  );

  const watermarkedBuffer = await baseImage
    .composite([
      {
        input: logoOverlaySvg,
        left,
        top,
      },
    ])
    .png()
    .toBuffer();

  const outputMimeType = "image/png";
  return `data:${outputMimeType};base64,${watermarkedBuffer.toString("base64")}`;
}

function parseDataUrl(dataUrl: string): DataUrlParts {
  const match = /^data:([^;]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) {
    throw new Error("Invalid data URL for watermark");
  }
  return { mimeType: match[1], base64Data: match[2] };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
