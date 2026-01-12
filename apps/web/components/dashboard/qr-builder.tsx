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
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";

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
    const didCopy = await copyTextToClipboard(menuUrl);

    if (didCopy) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      console.warn("Clipboard API unavailable, unable to copy the menu URL");
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
    <div className="space-y-[6%] sm:space-y-10">
      <div className="flex flex-col gap-[3%] sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="space-y-[1.5%] sm:space-y-2">
          <h1 className="text-[5vw] font-semibold text-slate-900 sm:text-4xl">
            {t("title")}
          </h1>
          <p className="max-w-2xl text-[3vw] text-slate-500 sm:text-base">
            {t("subtitle")}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="inline-flex items-center gap-[1.5%] rounded-full border-slate-200 bg-white px-[3%] py-[1.5%] text-[2.8vw] font-semibold text-slate-700 shadow-sm hover:bg-slate-50 sm:gap-2 sm:px-5 sm:py-2 sm:text-sm"
          onClick={handleCopyLink}
        >
          {copied ? <Check className="h-[3.5vw] w-[3.5vw] sm:h-4 sm:w-4" /> : <Copy className="h-[3.5vw] w-[3.5vw] sm:h-4 sm:w-4" />}
          {copied ? t("copied") : t("copyLink")}
        </Button>
      </div>

      <div className="grid gap-[5%] xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)] sm:gap-8">
        <div className="space-y-[3%] sm:space-y-4">
          <ConfiguratorSection
            id="frame"
            title={t("frame.title")}
            subtitle={t("frame.subtitle")}
            isOpen={openSections.has("frame")}
            onToggle={() => toggleSection("frame")}
          >
            <div className="space-y-6">
              <div className="space-y-[2%] sm:space-y-3">
                <Label className="text-[2.5vw] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
                  {t("frame.typeLabel")}
                </Label>
                <div className="grid gap-[2.5%] sm:grid-cols-3 sm:gap-3">
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

              <div className="space-y-[3.5%] sm:space-y-5">
                <div className="space-y-[1.5%] sm:space-y-2">
                  <Label htmlFor="frameColor" className="text-[2.8vw] font-semibold text-slate-600 sm:text-sm">
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

                <div className="space-y-[1.5%] sm:space-y-2">
                  <Label htmlFor="frameText" className="text-[2.8vw] font-semibold text-slate-600 sm:text-sm">
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

                <div className="space-y-[1.5%] sm:space-y-2">
                  <Label htmlFor="frameTextColor" className="text-[2.8vw] font-semibold text-slate-600 sm:text-sm">
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

                <div className="space-y-[1.5%] sm:space-y-2">
                  <Label htmlFor="fontFamily" className="text-[2.8vw] font-semibold text-slate-600 sm:text-sm">
                    {t("frame.fontFamily")}
                  </Label>
                  <div className="relative w-full">
                    <select
                      id="fontFamily"
                      className="h-[9vw] w-full appearance-none rounded-full border border-slate-200 bg-white px-[3%] pr-[8%] text-[2.8vw] font-semibold text-slate-700 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:h-12 sm:px-4 sm:pr-10 sm:text-sm"
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
                    <ChevronDown className="pointer-events-none absolute right-[3%] top-1/2 h-[3.5vw] w-[3.5vw] -translate-y-1/2 text-slate-400 sm:right-4 sm:h-4 sm:w-4" />
                  </div>
                </div>
              </div>

              <div className="space-y-[1.5%] sm:space-y-2">
                <Label htmlFor="textSize" className="text-[2.8vw] font-semibold text-slate-600 sm:text-sm">
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
                  className="h-[9vw] w-[22vw] rounded-2xl border-slate-200 bg-white text-center text-[2.8vw] font-semibold text-slate-700 disabled:cursor-not-allowed sm:h-12 sm:w-28 sm:text-sm"
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
            <div className="space-y-[4%] sm:space-y-6">
              <div className="space-y-[3.5%] sm:space-y-5">
                <div className="space-y-[1.5%] sm:space-y-2">
                  <Label htmlFor="qrColor" className="text-[2.8vw] font-semibold text-slate-600 sm:text-sm">
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

                <div className="space-y-[1.5%] sm:space-y-2">
                  <Label htmlFor="qrBackground" className="text-[2.8vw] font-semibold text-slate-600 sm:text-sm">
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

        <aside className="space-y-[3%] sm:space-y-4">
          <Card className="rounded-3xl border-slate-100 bg-white p-[4%] shadow-xl sm:p-6">
            <div className="flex flex-col items-center gap-[4%] sm:gap-6">
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
                      className="px-[4%] py-[3%] text-center font-semibold uppercase tracking-[0.32em] sm:px-6 sm:py-4"
                      style={{
                        color: state.frameTextColor,
                        fontSize: `${state.textSize}px`,
                      }}
                    >
                      {state.frameText}
                    </div>
                  ) : null}

                  <div className="flex justify-center bg-white px-[4%] py-[4%] sm:px-6 sm:py-6">
                    <div
                      className="flex items-center justify-center rounded-2xl border border-slate-200/60 bg-white p-[2.5%] shadow-inner sm:p-3"
                      style={{ backgroundColor: state.qrBackground }}
                    >
                      {qrDataUrl ? (
                        <Image
                          src={qrDataUrl}
                          alt={t("previewAlt")}
                          width={192}
                          height={192}
                          className="h-[35vw] w-[35vw] object-contain sm:h-48 sm:w-48"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-[35vw] w-[35vw] items-center justify-center rounded-xl bg-slate-100 sm:h-48 sm:w-48">
                          {isGenerating ? (
                            <Loader2 className="h-[5vw] w-[5vw] animate-spin text-slate-400 sm:h-6 sm:w-6" />
                          ) : (
                            <RefreshCcw className="h-[5vw] w-[5vw] text-slate-400 sm:h-6 sm:w-6" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {state.frameType === "bottom" && showFrameText ? (
                    <div
                      className="px-[4%] py-[3%] text-center font-semibold uppercase tracking-[0.32em] sm:px-6 sm:py-4"
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

              <div className="w-full space-y-[2.5%] sm:space-y-3">
                <label className="text-[2.5vw] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
                  {t("download.presetLabel")}
                </label>
                <div className="relative">
                  <select
                    className="h-[8.5vw] w-full appearance-none rounded-full border border-slate-200 bg-white px-[3%] pr-[8%] text-[2.8vw] font-semibold text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:h-11 sm:px-4 sm:pr-10 sm:text-sm"
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
                  <ChevronDown className="pointer-events-none absolute right-[3%] top-1/2 h-[3.5vw] w-[3.5vw] -translate-y-1/2 text-slate-400 sm:right-4 sm:h-4 sm:w-4" />
                </div>

                {selectedPreset?.descriptionKey ? (
                  <p className="text-[2.5vw] text-slate-500 sm:text-xs">
                    {t(selectedPreset.descriptionKey)}
                  </p>
                ) : null}

                <Button
                  type="button"
                  className="w-full justify-center gap-[1.5%] rounded-full bg-primary px-[4%] py-[2.5%] text-[2.8vw] font-semibold text-white shadow-lg hover:bg-primary/90 sm:gap-2 sm:px-6 sm:py-3 sm:text-sm"
                  onClick={handleDownload}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <Loader2 className="h-[3.5vw] w-[3.5vw] animate-spin sm:h-4 sm:w-4" />
                  ) : (
                    <Download className="h-[3.5vw] w-[3.5vw] sm:h-4 sm:w-4" />
                  )}
                  {t("download.cta")}
                </Button>

                <button
                  type="button"
                  className="w-full text-center text-[2.8vw] font-semibold text-primary hover:underline sm:text-sm"
                  onClick={handleReset}
                >
                  {t("reset")}
                </button>
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl border-slate-100 bg-emerald-50 p-[4%] text-emerald-900 sm:p-6">
            <h3 className="text-[2.8vw] font-semibold uppercase tracking-wide text-emerald-700 sm:text-sm">
              {t("promo.title")}
            </h3>
            <p className="mt-[2.5%] text-[2.8vw] leading-relaxed sm:mt-3 sm:text-sm">
              {t("promo.description")}
            </p>
            <p className="mt-[3%] text-[2.5vw] text-emerald-700 sm:mt-4 sm:text-xs">{t("promo.note")}</p>
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
      className="rounded-3xl border border-slate-100 bg-white p-[1.5%] shadow-sm sm:p-2"
    >
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-2xl px-[3%] py-[3%] text-left sm:px-4 sm:py-4"
        onClick={onToggle}
      >
        <div className="space-y-[0.8%] sm:space-y-1">
          <h2 className="text-[2.8vw] font-semibold text-slate-800 sm:text-sm">{title}</h2>
          {subtitle ? (
            <p className="text-[2.5vw] text-slate-500 sm:text-xs">{subtitle}</p>
          ) : null}
        </div>
        <ChevronDown
          className={cn(
            "h-[4.5vw] w-[4.5vw] text-slate-500 transition-transform sm:h-5 sm:w-5",
            isOpen ? "rotate-180" : "rotate-0",
          )}
        />
      </button>

      {isOpen ? <div className="border-t border-slate-100 px-[3%] py-[4%] sm:px-4 sm:py-6">{children}</div> : null}
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
        "flex items-center gap-[2.5%] rounded-full border border-slate-200 bg-white px-[2.5%] py-[1.5%] shadow-sm sm:gap-3 sm:px-3 sm:py-2",
        disabled && "opacity-50",
      )}
    >
      <button
        type="button"
        onClick={() => colorInputRef.current?.click()}
        disabled={disabled}
        className="flex h-[7vw] w-[7vw] items-center justify-center rounded-xl border border-slate-200 bg-white shadow-inner transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed sm:h-9 sm:w-9"
      aria-label={label}
      >
        <span
          className="h-[5vw] w-[5vw] rounded-lg sm:h-6 sm:w-6"
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
        className="flex-1 bg-transparent text-[2.8vw] font-semibold uppercase text-slate-700 outline-none focus-visible:ring-0 disabled:cursor-not-allowed sm:text-sm"
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
        "group relative flex flex-col items-center gap-[2.5%] rounded-2xl border px-[3%] py-[3%] text-[2.8vw] font-semibold text-slate-600 transition-all sm:gap-3 sm:px-4 sm:py-4 sm:text-sm",
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
    <div className="flex h-[11vw] w-[11vw] items-center justify-center sm:h-14 sm:w-14">
      <div className="relative h-[10vw] w-[8vw] overflow-hidden rounded-xl border border-slate-200 bg-slate-50 sm:h-12 sm:w-10">
        <div className="absolute inset-[0.8vw] grid grid-cols-3 gap-[0.2vw] sm:inset-1 sm:gap-[2px]">
          {Array.from({ length: 9 }).map((_, index) => (
            <span
              key={`${frameType}-${index}`}
              className="block rounded-[0.2vw] bg-slate-300 sm:rounded-[2px]"
              style={{ opacity: index % 2 === 0 ? 0.78 : 0.36 }}
            />
          ))}
        </div>
        {frameType !== "none" ? (
          <div
            className={cn(
              "absolute left-0 right-0 h-[2.5vw] bg-slate-900 sm:h-3",
              frameType === "bottom" ? "bottom-0" : "top-0",
            )}
          />
        ) : null}
      </div>
    </div>
  );
}

