'use client';

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronDown, Copy, Download, Loader2, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QR_DOWNLOAD_PRESETS, DEFAULT_DOWNLOAD_PRESET, resolveDownloadConfig, type DownloadPresetId } from "@/lib/qr/presets";
import { cn } from "@/lib/utils";

type FrameType = "bottom" | "top" | "none";

type QrCustomizerState = {
  frameType: FrameType;
  frameColor: string;
  frameText: string;
  frameTextColor: string;
  fontFamily: string;
  textSize: number;
  qrColor: string;
  qrBackground: string;
  downloadPreset: DownloadPresetId;
};

const DEFAULT_QR_STATE: QrCustomizerState = {
  frameType: "bottom",
  frameColor: "#000000",
  frameText: "MENU",
  frameTextColor: "#FFFFFF",
  fontFamily: "Roboto",
  textSize: 24,
  qrColor: "#000000",
  qrBackground: "#FFFFFF",
  downloadPreset: DEFAULT_DOWNLOAD_PRESET,
};

const FRAME_OPTIONS: Array<{ value: FrameType; labelKey: string }> = [
  { value: "bottom", labelKey: "frame.options.bottom" },
  { value: "top", labelKey: "frame.options.top" },
  { value: "none", labelKey: "frame.options.none" },
];

const FONT_OPTIONS = ["Roboto", "Inter", "Poppins", "Nunito", "Montserrat"];

const TEXT_SIZE_RANGE = { min: 16, max: 36 } as const;

type ConfiguratorSectionProps = {
  id: string;
  title: string;
  subtitle?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
};

type FrameOptionButtonProps = {
  frameType: FrameType;
  selected: boolean;
  label: string;
  onSelect: (frameType: FrameType) => void;
};

type ColorFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

type QrBuilderProps = {
  menuUrl: string;
};

export function QrBuilder({ menuUrl }: QrBuilderProps) {
  const t = useTranslations("dashboard.qr");
  const [state, setState] = useState<QrCustomizerState>(() => ({
    ...DEFAULT_QR_STATE,
  }));
  const [openSections, setOpenSections] = useState(() => new Set<string>(["frame"]));
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const selectedPreset = useMemo(() => {
    return (
      QR_DOWNLOAD_PRESETS.find((preset) => preset.id === state.downloadPreset) ??
      QR_DOWNLOAD_PRESETS.find((preset) => preset.id === DEFAULT_DOWNLOAD_PRESET) ??
      QR_DOWNLOAD_PRESETS[0]
    );
  }, [state.downloadPreset]);

  useEffect(() => {
    let isCancelled = false;
    setIsGenerating(true);

    async function generateQr() {
      try {
        const QRCode = await import("qrcode");
        const dataUrl = await QRCode.toDataURL(menuUrl, {
          margin: 0,
          color: {
            dark: state.qrColor,
            light: state.qrBackground,
          },
          width: 512,
        });

        if (!isCancelled) {
          setQrDataUrl(dataUrl);
        }
      } catch (error) {
        console.error("Error generating QR preview", error);
        if (!isCancelled) {
          setQrDataUrl("");
        }
      } finally {
        if (!isCancelled) {
          setIsGenerating(false);
        }
      }
    }

    void generateQr();

    return () => {
      isCancelled = true;
    };
  }, [menuUrl, state.qrColor, state.qrBackground]);

  const toggleSection = useCallback((sectionId: string) => {
    setOpenSections((previous) => {
      const next = new Set(previous);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(menuUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Clipboard copy failed", error);
    }
  }, [menuUrl]);

  const handleReset = useCallback(() => {
    setState({ ...DEFAULT_QR_STATE });
  }, []);

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    try {
      const request = resolveDownloadConfig(state.downloadPreset, menuUrl);
      const response = await fetch("/api/qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to download QR (${response.status})`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const downloadLink = document.createElement("a");
      downloadLink.href = blobUrl;
      downloadLink.download = `qr-${state.downloadPreset}.${request.format}`;
      downloadLink.rel = "noopener";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();

      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("QR download failed", error);
    } finally {
      setIsDownloading(false);
    }
  }, [menuUrl, state.downloadPreset]);

  const showFrameText = state.frameType !== "none" && state.frameText.trim().length > 0;
  const frameBackground = state.frameType === "none" ? "#FFFFFF" : state.frameColor;

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            {t("title")}
          </h1>
          <p className="max-w-2xl text-base text-slate-500">
            {t("subtitle")}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="inline-flex items-center gap-2 rounded-full border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          onClick={handleCopyLink}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? t("copied") : t("copyLink")}
        </Button>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <ConfiguratorSection
            id="frame"
            title={t("frame.title")}
            subtitle={t("frame.subtitle")}
            isOpen={openSections.has("frame")}
            onToggle={() => toggleSection("frame")}
          >
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("frame.typeLabel")}
                </Label>
                <div className="grid gap-3 sm:grid-cols-3">
                  {FRAME_OPTIONS.map((option) => (
                    <FrameOptionButton
                      key={option.value}
                      frameType={option.value}
                      label={t(option.labelKey)}
                      selected={state.frameType === option.value}
                      onSelect={(frameType) =>
                        setState((previous) => ({ ...previous, frameType }))
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="frameColor" className="text-sm font-semibold text-slate-600">
                    {t("frame.backgroundColor")}
                  </Label>
                  <ColorField
                    id="frameColor"
                    label={t("frame.backgroundColor")}
                    value={state.frameColor}
                    onChange={(next) =>
                      setState((previous) => ({
                        ...previous,
                        frameColor: next,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frameText" className="text-sm font-semibold text-slate-600">
                    {t("frame.textLabel")}
                  </Label>
                  <Input
                    id="frameText"
                    value={state.frameText}
                    disabled={state.frameType === "none"}
                    onChange={(event) =>
                      setState((previous) => ({ ...previous, frameText: event.target.value }))
                    }
                    placeholder="MENU"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frameTextColor" className="text-sm font-semibold text-slate-600">
                    {t("frame.textColor")}
                  </Label>
                  <ColorField
                    id="frameTextColor"
                    label={t("frame.textColor")}
                    value={state.frameTextColor}
                    disabled={state.frameType === "none"}
                    onChange={(next) =>
                      setState((previous) => ({
                        ...previous,
                        frameTextColor: next,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fontFamily" className="text-sm font-semibold text-slate-600">
                    {t("frame.fontFamily")}
                  </Label>
                  <div className="relative w-full">
                    <select
                      id="fontFamily"
                      className="h-12 w-full appearance-none rounded-full border border-slate-200 bg-white px-4 pr-10 text-sm font-semibold text-slate-700 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      value={state.fontFamily}
                      onChange={(event) =>
                        setState((previous) => ({ ...previous, fontFamily: event.target.value }))
                      }
                    >
                      {FONT_OPTIONS.map((font) => (
                        <option key={font} value={font}>
                          {font}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="textSize" className="text-sm font-semibold text-slate-600">
                  {t("frame.textSize")}
                </Label>
                <Input
                  id="textSize"
                  type="number"
                  min={TEXT_SIZE_RANGE.min}
                  max={TEXT_SIZE_RANGE.max}
                  step={1}
                  value={state.textSize}
                  disabled={state.frameType === "none"}
                  className="h-12 w-28 rounded-2xl border-slate-200 bg-white text-center text-sm font-semibold text-slate-700 disabled:cursor-not-allowed"
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (Number.isNaN(value)) {
                      return;
                    }
                    const clamped = Math.min(Math.max(value, TEXT_SIZE_RANGE.min), TEXT_SIZE_RANGE.max);
                    setState((previous) => ({ ...previous, textSize: clamped }));
                  }}
                />
              </div>
            </div>
          </ConfiguratorSection>

          <ConfiguratorSection
            id="style"
            title={t("style.title")}
            subtitle={t("style.subtitle")}
            isOpen={openSections.has("style")}
            onToggle={() => toggleSection("style")}
          >
            <div className="space-y-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="qrColor" className="text-sm font-semibold text-slate-600">
                    {t("style.qrColor")}
                  </Label>
                  <ColorField
                    id="qrColor"
                    label={t("style.qrColor")}
                    value={state.qrColor}
                    onChange={(next) =>
                      setState((previous) => ({
                        ...previous,
                        qrColor: next,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qrBackground" className="text-sm font-semibold text-slate-600">
                    {t("style.qrBackground")}
                  </Label>
                  <ColorField
                    id="qrBackground"
                    label={t("style.qrBackground")}
                    value={state.qrBackground}
                    onChange={(next) =>
                      setState((previous) => ({
                        ...previous,
                        qrBackground: next,
                      }))
                    }
                  />
                </div>
              </div>

            </div>
          </ConfiguratorSection>
        </div>

        <aside className="space-y-4">
          <Card className="rounded-3xl border-slate-100 bg-white p-6 shadow-xl">
            <div className="flex flex-col items-center gap-6">
              <div className="w-full max-w-xs">
                <div
                  className="overflow-hidden rounded-[32px] border border-slate-200 shadow-lg"
                  style={{
                    backgroundColor: frameBackground,
                    fontFamily: state.fontFamily,
                  }}
                >
                  {state.frameType === "top" && showFrameText ? (
                    <div
                      className="px-6 py-4 text-center font-semibold uppercase tracking-[0.32em]"
                      style={{
                        color: state.frameTextColor,
                        fontSize: `${state.textSize}px`,
                      }}
                    >
                      {state.frameText}
                    </div>
                  ) : null}

                  <div className="flex justify-center bg-white px-6 py-6">
                    <div
                      className="flex items-center justify-center rounded-2xl border border-slate-200/60 bg-white p-3 shadow-inner"
                      style={{ backgroundColor: state.qrBackground }}
                    >
                      {qrDataUrl ? (
                        <Image
                          src={qrDataUrl}
                          alt={t("previewAlt")}
                          width={192}
                          height={192}
                          className="h-48 w-48 object-contain"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-48 w-48 items-center justify-center rounded-xl bg-slate-100">
                          {isGenerating ? (
                            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                          ) : (
                            <RefreshCcw className="h-6 w-6 text-slate-400" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {state.frameType === "bottom" && showFrameText ? (
                    <div
                      className="px-6 py-4 text-center font-semibold uppercase tracking-[0.32em]"
                      style={{
                        color: state.frameTextColor,
                        fontSize: `${state.textSize}px`,
                      }}
                    >
                      {state.frameText}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="w-full space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("download.presetLabel")}
                </label>
                <div className="relative">
                  <select
                    className="h-11 w-full appearance-none rounded-full border border-slate-200 bg-white px-4 pr-10 text-sm font-semibold text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    value={state.downloadPreset}
                    onChange={(event) =>
                      setState((previous) => ({
                        ...previous,
                        downloadPreset: event.target.value as DownloadPresetId,
                      }))
                    }
                  >
                    {QR_DOWNLOAD_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {t(preset.labelKey)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>

                {selectedPreset?.descriptionKey ? (
                  <p className="text-xs text-slate-500">
                    {t(selectedPreset.descriptionKey)}
                  </p>
                ) : null}

                <Button
                  type="button"
                  className="w-full justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-primary/90"
                  onClick={handleDownload}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {t("download.cta")}
                </Button>

                <button
                  type="button"
                  className="w-full text-center text-sm font-semibold text-primary hover:underline"
                  onClick={handleReset}
                >
                  {t("reset")}
                </button>
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl border-slate-100 bg-emerald-50 p-6 text-emerald-900">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              {t("promo.title")}
            </h3>
            <p className="mt-3 text-sm leading-relaxed">
              {t("promo.description")}
            </p>
            <p className="mt-4 text-xs text-emerald-700">{t("promo.note")}</p>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function ConfiguratorSection({ id, title, subtitle, isOpen, onToggle, children }: ConfiguratorSectionProps) {
  return (
    <div
      id={id}
      className="rounded-3xl border border-slate-100 bg-white p-2 shadow-sm"
    >
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-2xl px-4 py-4 text-left"
        onClick={onToggle}
      >
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
          {subtitle ? (
            <p className="text-xs text-slate-500">{subtitle}</p>
          ) : null}
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-slate-500 transition-transform",
            isOpen ? "rotate-180" : "rotate-0",
          )}
        />
      </button>

      {isOpen ? <div className="border-t border-slate-100 px-4 py-6">{children}</div> : null}
    </div>
  );
}

function ColorField({ id, label, value, onChange, disabled }: ColorFieldProps) {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [hexValue, setHexValue] = useState(value.toUpperCase());

  useEffect(() => {
    setHexValue(value.toUpperCase());
  }, [value]);

  const handleColorChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value;
      setHexValue(next.toUpperCase());
      onChange(next);
    },
    [onChange],
  );

  const handleHexChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value.trim();
      let normalized = raw.startsWith("#") ? raw : `#${raw}`;
      normalized = normalized.toUpperCase();

      if (/^#[0-9A-F]{0,6}$/.test(normalized)) {
        setHexValue(normalized);

        if (normalized.length === 7) {
          onChange(`#${normalized.slice(1).toLowerCase()}`);
        }
      }
    },
    [onChange],
  );

  const handleHexBlur = useCallback(() => {
    setHexValue(value.toUpperCase());
  }, [value]);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm",
        disabled && "opacity-50",
      )}
    >
      <button
        type="button"
        onClick={() => colorInputRef.current?.click()}
        disabled={disabled}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-inner transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed"
      aria-label={label}
      >
        <span
          className="h-6 w-6 rounded-lg"
          style={{ backgroundColor: value }}
        />
      </button>
      <input
        id={id}
        ref={colorInputRef}
        type="color"
        value={value}
        onChange={handleColorChange}
        disabled={disabled}
        className="sr-only"
      />
      <input
        type="text"
        value={hexValue}
        onChange={handleHexChange}
        onBlur={handleHexBlur}
        disabled={disabled}
        className="flex-1 bg-transparent text-sm font-semibold uppercase text-slate-700 outline-none focus-visible:ring-0 disabled:cursor-not-allowed"
        spellCheck={false}
        aria-label={label}
      />
    </div>
  );
}

function FrameOptionButton({ frameType, selected, label, onSelect }: FrameOptionButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(frameType)}
      className={cn(
        "group relative flex flex-col items-center gap-3 rounded-2xl border px-4 py-4 text-sm font-semibold text-slate-600 transition-all",
        selected
          ? "border-primary/60 bg-white text-primary shadow-[0_18px_32px_-24px_rgba(79,70,229,0.65)] ring-2 ring-primary/15"
          : "border-slate-200 bg-white/90 hover:border-slate-300 hover:bg-white hover:shadow-[0_14px_24px_-20px_rgba(15,23,42,0.45)]",
      )}
    >
      <FrameIllustration frameType={frameType} />
      {label}
      <span
        className={cn(
          "pointer-events-none absolute inset-0 rounded-2xl border border-transparent transition",
          selected ? "border-primary/40" : "group-hover:border-slate-200/80",
        )}
        aria-hidden
      />
    </button>
  );
}

function FrameIllustration({ frameType }: { frameType: FrameType }) {
  return (
    <div className="flex h-14 w-14 items-center justify-center">
      <div className="relative h-12 w-10 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        <div className="absolute inset-1 grid grid-cols-3 gap-[2px]">
          {Array.from({ length: 9 }).map((_, index) => (
            <span
              key={`${frameType}-${index}`}
              className="block rounded-[2px] bg-slate-300"
              style={{ opacity: index % 2 === 0 ? 0.78 : 0.36 }}
            />
          ))}
        </div>
        {frameType !== "none" ? (
          <div
            className={cn(
              "absolute left-0 right-0 h-3 bg-slate-900",
              frameType === "bottom" ? "bottom-0" : "top-0",
            )}
          />
        ) : null}
      </div>
    </div>
  );
}

