export type DownloadPreset = {
  id: string;
  labelKey: string;
  descriptionKey?: string;
  format: "png" | "svg";
  width: number;
  margin: number;
};

export const QR_DOWNLOAD_PRESETS = [
  {
    id: "pdfSmall",
    labelKey: "download.pdfSmall",
    descriptionKey: "download.pdfSmallDescription",
    format: "png",
    width: 1024,
    margin: 2,
  },
  {
    id: "pdfLarge",
    labelKey: "download.pdfLarge",
    descriptionKey: "download.pdfLargeDescription",
    format: "png",
    width: 1536,
    margin: 2,
  },
  {
    id: "stickers",
    labelKey: "download.stickers",
    descriptionKey: "download.stickersDescription",
    format: "png",
    width: 1152,
    margin: 3,
  },
  {
    id: "tableDisplay",
    labelKey: "download.tableDisplay",
    descriptionKey: "download.tableDisplayDescription",
    format: "png",
    width: 1280,
    margin: 4,
  },
  {
    id: "svg",
    labelKey: "download.svg",
    descriptionKey: "download.svgDescription",
    format: "svg",
    width: 512,
    margin: 1,
  },
] as const satisfies readonly DownloadPreset[];

export type DownloadPresetId = (typeof QR_DOWNLOAD_PRESETS)[number]["id"];

export type QrRequestConfig = {
  url: string;
  format: "png" | "svg";
  width: number;
  margin: number;
};

export const DEFAULT_DOWNLOAD_PRESET: DownloadPresetId = "pdfSmall";

const fallbackPreset = (() => {
  const preset = QR_DOWNLOAD_PRESETS.find(
    (item) => item.id === DEFAULT_DOWNLOAD_PRESET,
  );

  if (!preset) {
    throw new Error("DEFAULT_DOWNLOAD_PRESET must exist in QR_DOWNLOAD_PRESETS");
  }

  return preset;
})();

export function resolveDownloadConfig(
  presetId: string,
  menuUrl: string,
  overrides?: Partial<Omit<QrRequestConfig, "url">>,
): QrRequestConfig {
  const preset =
    QR_DOWNLOAD_PRESETS.find((item) => item.id === presetId) ?? fallbackPreset;

  return {
    url: menuUrl,
    format: overrides?.format ?? preset.format,
    width: overrides?.width ?? preset.width,
    margin: overrides?.margin ?? preset.margin,
  } satisfies QrRequestConfig;
}










