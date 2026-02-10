export type ImageSource = string | Buffer | ArrayBuffer | ArrayBufferView;

export const DEFAULT_IMAGE_MIME_TYPE = "image/jpeg";

const DATA_URL_PREFIX = "data:";
const BASE64_SEPARATOR = ";base64,";
const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}(?:==)?|[A-Za-z0-9+/]{3}=)?$/;

export type InlineDataPart = {
  mimeType: string;
  data: string;
};

export function encodeImageSource(image: ImageSource, mimeOverride?: string): InlineDataPart {
  if (image === null || image === undefined) {
    throw new Error("image source is required");
  }

  const mimeType = mimeOverride ?? DEFAULT_IMAGE_MIME_TYPE;

  if (typeof image === "string") {
    return buildInlineDataFromString(image, mimeOverride);
  }

  if (Buffer.isBuffer(image)) {
    return {
      mimeType,
      data: image.toString("base64"),
    };
  }

  if (image instanceof ArrayBuffer) {
    return {
      mimeType,
      data: Buffer.from(image).toString("base64"),
    };
  }

  if (ArrayBuffer.isView(image)) {
    const buffer = Buffer.from(image.buffer, image.byteOffset, image.byteLength);
    return {
      mimeType,
      data: buffer.toString("base64"),
    };
  }

  throw new Error("Unsupported image source");
}

function buildInlineDataFromString(value: string, mimeOverride?: string): InlineDataPart {
  const trimmed = value.trim();
  if (trimmed.startsWith(DATA_URL_PREFIX)) {
    const separatorIndex = trimmed.indexOf(BASE64_SEPARATOR);
    if (separatorIndex > 0) {
      const mimeType = trimmed.slice(DATA_URL_PREFIX.length, separatorIndex);
      const data = trimmed.slice(separatorIndex + BASE64_SEPARATOR.length);
      return {
        mimeType: mimeOverride ?? mimeType,
        data,
      };
    }
  }

  if (isBase64(trimmed)) {
    return {
      mimeType: mimeOverride ?? DEFAULT_IMAGE_MIME_TYPE,
      data: trimmed,
    };
  }

  return {
    mimeType: mimeOverride ?? DEFAULT_IMAGE_MIME_TYPE,
    data: Buffer.from(trimmed, "utf8").toString("base64"),
  };
}

function isBase64(value: string): boolean {
  if (value.length === 0 || value.length % 4 !== 0) {
    return false;
  }

  return BASE64_PATTERN.test(value);
}

