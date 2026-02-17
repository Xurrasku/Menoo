"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { Loader2, Plus, Sparkles, UploadCloud, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  buildPromptFromStyle,
  labelBackground,
  labelLighting,
  labelPerspective,
  type BackgroundStyle,
  type LightingStyle,
  type PerspectiveStyle,
  type CameraStyle,
  type VisualStyleConfig,
} from "./visuals-style-prompt";

const MAX_SIZE_MB = 10;
const PREVIEW_TARGET_SIZE = 1024;

// Duplicated from ai/image-enhance.ts (server module). Keep in sync.
const DEFAULT_IMAGE_ENHANCE_PROMPT =
  "Enhance this dish photo into professional food photography. Preserve the exact dish, ingredients, portion size, plating, and arrangement. Do not add, remove, or replace any ingredients or garnishes. Improve lighting, color balance, texture, and sharpness to look appetizing yet photorealistic. Remove distracting background objects and clutter, keeping a clean, neutral setting that matches the original plate or bowl. No stylization, no text, no logos, no watermark.";

const DEFAULT_STYLE_CONFIG: VisualStyleConfig = {
  background: "neutral",
  lighting: "natural",
  perspective: "angle_45",
  camera: "smartphone",
  textureBoost: true,
  consistentMenu: true,
};

type GlobalPreset = {
  id: string;
  title: string;
  config: VisualStyleConfig;
  previewImageDataUrl?: string | null;
};

const GLOBAL_PRESETS: GlobalPreset[] = [
  {
    id: "natural-modern",
    title: "Natural Modern",
    config: {
      ...DEFAULT_STYLE_CONFIG,
      background: "neutral",
      lighting: "natural",
      perspective: "angle_45",
      camera: "smartphone",
    },
    previewImageDataUrl: "/visuals/presets/natural-modern.jpg",
  },
  {
    id: "minimal-studio",
    title: "Minimal Studio",
    config: {
      ...DEFAULT_STYLE_CONFIG,
      background: "neutral",
      lighting: "studio",
      perspective: "angle_45",
      camera: "dslr",
    },
    previewImageDataUrl: "/visuals/presets/minimal-studio.jpg",
  },
  {
    id: "bright-casual",
    title: "Bright Casual",
    config: {
      ...DEFAULT_STYLE_CONFIG,
      background: "neutral",
      lighting: "bright",
      perspective: "angle_45",
      camera: "smartphone",
    },
    previewImageDataUrl: "/visuals/presets/bright-casual.jpg",
  },
  {
    id: "moody-fine-dining",
    title: "Moody Fine‑Dining",
    config: {
      ...DEFAULT_STYLE_CONFIG,
      background: "dark",
      lighting: "moody",
      perspective: "angle_45",
      camera: "dslr",
      textureBoost: true,
    },
    previewImageDataUrl: "/visuals/presets/moody-fine-dining.jpg",
  },
  {
    id: "rustic-warm",
    title: "Rustic Warm",
    config: {
      ...DEFAULT_STYLE_CONFIG,
      background: "bokeh",
      lighting: "natural",
      perspective: "table_level",
      camera: "dslr",
    },
    previewImageDataUrl: "/visuals/presets/rustic-warm.jpg",
  },
  {
    id: "macro-texture",
    title: "Macro Texture",
    config: {
      ...DEFAULT_STYLE_CONFIG,
      background: "neutral",
      lighting: "studio",
      perspective: "angle_45",
      camera: "macro",
      textureBoost: true,
    },
    previewImageDataUrl: "/visuals/presets/macro-texture.jpg",
  },
];

type PendingImage = {
  id: string;
  file: File;
  previewUrl: string;
  status: "idle" | "enhancing" | "done" | "error";
  error?: string;
  outputUrl?: string;
  promptUsed?: string;
  promptTitleUsed?: string;
};

type GalleryImage = {
  id: string;
  imageDataUrl: string;
  originalFileName: string | null;
  createdAt: string;
};

type PromptGalleryItem = {
  id: string;
  title: string;
  prompt: string;
  styleConfig: Record<string, unknown> | null;
  previewImageDataUrl: string | null;
  sourceAssetId: string | null;
  createdAt: string;
};

type VisualsImageEnhancerProps = {
  initialGallery?: GalleryImage[];
  initialPromptGallery?: PromptGalleryItem[];
};

export function VisualsImageEnhancer({
  initialGallery = [],
  initialPromptGallery = [],
}: VisualsImageEnhancerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [styleTab, setStyleTab] = useState<"presets" | "builder">("presets");
  const [promptEditMode, setPromptEditMode] = useState(false);
  const [styleConfig, setStyleConfig] = useState<VisualStyleConfig>(DEFAULT_STYLE_CONFIG);
  const [selectedGlobalPresetId, setSelectedGlobalPresetId] = useState<string | null>("natural-modern");

  const [prompt, setPrompt] = useState(DEFAULT_IMAGE_ENHANCE_PROMPT);
  const [promptTitle, setPromptTitle] = useState("");
  const [selectedPromptGalleryId, setSelectedPromptGalleryId] = useState<string | null>(null);
  const [items, setItems] = useState<PendingImage[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>(initialGallery);
  const [promptGallery, setPromptGallery] = useState<PromptGalleryItem[]>(initialPromptGallery);
  const [savingPromptItemId, setSavingPromptItemId] = useState<string | null>(null);
  const [savingPromptOnly, setSavingPromptOnly] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const generatedPrompt = useMemo(() => buildPromptFromStyle(styleConfig), [styleConfig]);

  const effectivePrompt = useMemo(() => {
    if (promptEditMode) {
      return prompt.trim().length > 0 ? prompt.trim() : generatedPrompt;
    }

    return generatedPrompt;
  }, [generatedPrompt, prompt, promptEditMode]);

  const canEnhance = useMemo(
    () => items.length > 0 && items.some((item) => item.status === "idle" || item.status === "error"),
    [items]
  );

  function createClientId(prefix: string) {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }

    return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
  }

  function addFiles(files: FileList | File[]) {
    const next: PendingImage[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        continue;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setGlobalError(`Some files exceed ${MAX_SIZE_MB}MB and were skipped.`);
        continue;
      }

      next.push({
        id: createClientId("visual"),
        file,
        previewUrl: URL.createObjectURL(file),
        status: "idle",
      });
    }

    if (next.length > 0) {
      setItems((prev) => [...prev, ...next]);
      setGlobalError(null);
    }
  }

  function removeItem(id: string) {
    setItems((prev) => {
      const found = prev.find((item) => item.id === id);
      if (found) {
        URL.revokeObjectURL(found.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  }

  function clearAll() {
    setItems((prev) => {
      for (const item of prev) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return [];
    });
    setGlobalError(null);
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    event.target.value = "";
    if (!files || files.length === 0) return;
    addFiles(files);
  }

  function handleDragOver(event: React.DragEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(event: React.DragEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(event: React.DragEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const files = event.dataTransfer.files;
    if (!files || files.length === 0) {
      setGlobalError("Please drop image files.");
      return;
    }

    addFiles(files);
  }

  const fileToSquarePngDataUrl = (file: File) =>
    new Promise<{ dataUrl: string; mimeType: string }>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result as string;
        const image = new Image();

        image.onload = () => {
          const width = image.naturalWidth || image.width;
          const height = image.naturalHeight || image.height;
          const maxSide = Math.max(width, height);
          const scale = Math.min(1, PREVIEW_TARGET_SIZE / maxSide);
          const canvasSize = Math.round(maxSide * scale);
          const targetWidth = Math.round(width * scale);
          const targetHeight = Math.round(height * scale);

          const canvas = document.createElement("canvas");
          canvas.width = canvasSize;
          canvas.height = canvasSize;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Failed to render image"));
            return;
          }

          ctx.fillStyle = "#f5f2ec";
          ctx.fillRect(0, 0, canvasSize, canvasSize);

          const offsetX = Math.round((canvasSize - targetWidth) / 2);
          const offsetY = Math.round((canvasSize - targetHeight) / 2);
          ctx.drawImage(image, offsetX, offsetY, targetWidth, targetHeight);

          resolve({ dataUrl: canvas.toDataURL("image/png"), mimeType: "image/png" });
        };

        image.onerror = () => reject(new Error("Failed to load image"));
        image.src = result;
      };

      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  async function enhanceOne(id: string) {
    const currentPrompt = effectivePrompt;
    const currentPromptTitle = promptTitle.trim();
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "enhancing",
              error: undefined,
              promptUsed: currentPrompt,
              promptTitleUsed: currentPromptTitle,
            }
          : item
      )
    );

    const item = items.find((it) => it.id === id);
    if (!item) return;

    try {
      const { dataUrl, mimeType } = await fileToSquarePngDataUrl(item.file);
      const response = await fetch("/api/ai/image-enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: dataUrl,
          mimeType,
          prompt: currentPrompt,
          fileName: item.file.name,
          promptGalleryId: selectedPromptGalleryId ?? undefined,
          styleConfig,
        }),
      });

      const responseText = await response.text();
      let payload: {
        data?: {
          output?: string;
          savedAsset?: GalleryImage | null;
        };
        error?: string;
      } | null = null;
      try {
        payload = JSON.parse(responseText) as {
          data?: {
            output?: string;
            savedAsset?: GalleryImage | null;
          };
          error?: string;
        };
      } catch {
        payload = null;
      }

      if (!response.ok) {
        const fallback = responseText.trim().slice(0, 240);
        const details = payload?.error || fallback;
        throw new Error(details ? `Enhance request failed (${response.status}): ${details}` : `Enhance request failed (${response.status})`);
      }
      if (!payload?.data?.output) {
        throw new Error("Invalid response");
      }

      setItems((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, status: "done", outputUrl: payload.data!.output } : it
        )
      );

      if (payload.data.savedAsset) {
        const savedAsset = payload.data.savedAsset;
        setGallery((prev) => [savedAsset, ...prev.filter((entry) => entry.id !== savedAsset.id)]);
        if (selectedPromptGalleryId) {
          setPromptGallery((prev) =>
            prev.map((entry) =>
              entry.id === selectedPromptGalleryId && !entry.previewImageDataUrl
                ? {
                    ...entry,
                    previewImageDataUrl: savedAsset.imageDataUrl,
                    sourceAssetId: savedAsset.id,
                  }
                : entry
            )
          );
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to enhance image.";
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: "error", error: message } : it)));
    }
  }

  async function enhanceAll() {
    setGlobalError(null);
    // sequential to avoid hammering API + rate limits
    for (const item of items) {
      if (item.status === "enhancing") continue;
      if (item.status === "done") continue;
        await enhanceOne(item.id);
    }
  }

  async function savePromptResult(item: PendingImage) {
    if (!item.outputUrl) return;
    const trimmedPrompt = (item.promptUsed ?? effectivePrompt).trim();
    const trimmedTitle = (item.promptTitleUsed ?? promptTitle).trim();
    if (!trimmedPrompt) {
      setGlobalError("Escribe un prompt antes de guardarlo en la galeria.");
      return;
    }
    if (!trimmedTitle) {
      setGlobalError("Pon un titulo para guardar el prompt.");
      return;
    }

    setSavingPromptItemId(item.id);
    setGlobalError(null);
    try {
      const response = await fetch("/api/visuals/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmedTitle,
          prompt: trimmedPrompt,
          styleConfig,
          previewImageDataUrl: item.outputUrl,
        }),
      });

      const responseText = await response.text();
      let payload: { data?: PromptGalleryItem; error?: string } | null = null;
      try {
        payload = JSON.parse(responseText) as { data?: PromptGalleryItem; error?: string };
      } catch {
        payload = null;
      }

      if (!response.ok || !payload?.data) {
        const fallback = payload?.error ?? responseText.slice(0, 220) ?? "Unable to save prompt.";
        throw new Error(fallback);
      }

      const savedPrompt = payload.data;
      setPromptGallery((prev) => [savedPrompt, ...prev.filter((entry) => entry.id !== savedPrompt.id)]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save prompt.";
      setGlobalError(message);
    } finally {
      setSavingPromptItemId(null);
    }
  }

  async function savePromptOnly() {
    const trimmedPrompt = effectivePrompt.trim();
    const trimmedTitle = promptTitle.trim();
    if (!trimmedPrompt) {
      setGlobalError("Escribe un prompt para guardarlo.");
      return;
    }
    if (!trimmedTitle) {
      setGlobalError("Pon un titulo para guardar el prompt.");
      return;
    }

    setSavingPromptOnly(true);
    setGlobalError(null);
    try {
      const response = await fetch("/api/visuals/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmedTitle,
          prompt: trimmedPrompt,
          styleConfig,
        }),
      });
      const responseText = await response.text();
      let payload: { data?: PromptGalleryItem; error?: string } | null = null;
      try {
        payload = JSON.parse(responseText) as { data?: PromptGalleryItem; error?: string };
      } catch {
        payload = null;
      }

      if (!response.ok || !payload?.data) {
        const fallback = payload?.error ?? responseText.slice(0, 220) ?? "Unable to save prompt.";
        throw new Error(fallback);
      }

      const savedPrompt = payload.data;
      setPromptGallery((prev) => [savedPrompt, ...prev.filter((entry) => entry.id !== savedPrompt.id)]);
      setSelectedPromptGalleryId(savedPrompt.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save prompt.";
      setGlobalError(message);
    } finally {
      setSavingPromptOnly(false);
    }
  }

  const anyEnhancing = items.some((item) => item.status === "enhancing");

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground">Visuales</h3>
            <p className="text-sm text-muted-foreground">
              Sube fotos de platos y mejora su calidad con IA. Puedes ajustar el prompt antes de generar.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              className="rounded-full"
              onClick={clearAll}
              disabled={items.length === 0 || anyEnhancing}
            >
              Limpiar
            </Button>
            <Button
              type="button"
              className="rounded-full"
              onClick={() => void enhanceAll()}
              disabled={!canEnhance || anyEnhancing}
            >
              {anyEnhancing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mejorando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Mejorar imágenes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Style selector */}
        <div className="mt-6 rounded-2xl border border-border bg-muted/20 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Estilo</p>
              <p className="text-xs text-muted-foreground">Elige un preset o ajusta opciones. El prompt se genera automáticamente.</p>
            </div>
            <div className="inline-flex rounded-full border border-border bg-background p-1">
              <button
                type="button"
                onClick={() => setStyleTab("presets")}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold transition",
                  styleTab === "presets" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                Presets
              </button>
              <button
                type="button"
                onClick={() => setStyleTab("builder")}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold transition",
                  styleTab === "builder" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                Personalizado
              </button>
            </div>
          </div>

          {styleTab === "presets" ? (
            <div className="mt-4 space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Menoo presets</p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {GLOBAL_PRESETS.map((preset) => {
                    const selected = selectedGlobalPresetId === preset.id && !selectedPromptGalleryId;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setSelectedGlobalPresetId(preset.id);
                          setSelectedPromptGalleryId(null);
                          setPromptEditMode(false);
                          setPromptTitle(preset.title);
                          setStyleConfig(preset.config);
                          setPrompt("");
                        }}
                        className={cn(
                          "rounded-2xl border p-3 text-left transition",
                          selected ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40",
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-foreground">{preset.title}</p>
                          <span className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                          )}>
                            {selected ? "Activo" : "Usar"}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">Fons: {labelBackground(preset.config.background)}</span>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">Llum: {labelLighting(preset.config.lighting)}</span>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">Angle: {labelPerspective(preset.config.perspective)}</span>
                        </div>
                        <div className="mt-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={preset.previewImageDataUrl ?? "/visuals/presets/placeholder.jpg"}
                            alt=""
                            className="h-24 w-full rounded-xl border border-border object-cover"
                            onError={(event) => {
                              const target = event.currentTarget;
                              target.src = "/visuals/presets/placeholder.jpg";
                            }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tus presets</p>
                  <Button type="button" variant="ghost" className="h-8 rounded-full text-xs" onClick={() => setStyleTab("builder")}>Editar</Button>
                </div>
                {promptGallery.length === 0 ? (
                  <div className="mt-3 rounded-xl border border-dashed border-border bg-muted/30 p-4 text-xs text-muted-foreground">
                    Todavía no has guardado presets. Ajusta el estilo y pulsa “Guardar preset”.
                  </div>
                ) : (
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {promptGallery.map((preset) => {
                      const selected = selectedPromptGalleryId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setSelectedGlobalPresetId(null);
                            setSelectedPromptGalleryId(preset.id);
                            setPromptTitle(preset.title);
                            setPromptEditMode(false);

                            if (preset.styleConfig) {
                              setStyleConfig(preset.styleConfig as VisualStyleConfig);
                              setPrompt("");
                            } else {
                              setStyleConfig(DEFAULT_STYLE_CONFIG);
                              setPrompt(preset.prompt);
                              setPromptEditMode(true);
                            }
                          }}
                          className={cn(
                            "rounded-2xl border p-3 text-left transition",
                            selected ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40",
                          )}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-foreground">{preset.title}</p>
                            <span className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                            )}>
                              {selected ? "Activo" : "Usar"}
                            </span>
                          </div>
                          <div className="mt-3">
                            {preset.previewImageDataUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={preset.previewImageDataUrl} alt="" className="h-24 w-full rounded-xl border border-border object-cover" />
                            ) : (
                              <div className="flex h-24 w-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 text-xs font-medium text-muted-foreground">
                                Preview próximamente
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground">Fons</span>
                <select
                  value={styleConfig.background}
                  onChange={(e) => {
                    setStyleConfig((prev) => ({ ...prev, background: e.target.value as BackgroundStyle }));
                    setSelectedGlobalPresetId(null);
                    setSelectedPromptGalleryId(null);
                    setPromptEditMode(false);
                  }}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="neutral">Net neutre</option>
                  <option value="bokeh">Restaurant subtil (bokeh)</option>
                  <option value="dark">Fosc elegant</option>
                  <option value="keep">Respecta fons original</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground">Llum</span>
                <select
                  value={styleConfig.lighting}
                  onChange={(e) => {
                    setStyleConfig((prev) => ({ ...prev, lighting: e.target.value as LightingStyle }));
                    setSelectedGlobalPresetId(null);
                    setSelectedPromptGalleryId(null);
                    setPromptEditMode(false);
                  }}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="natural">Natural suau</option>
                  <option value="studio">Estudi (softbox)</option>
                  <option value="moody">Moody (low‑key)</option>
                  <option value="bright">Bright (high‑key)</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground">Perspectiva</span>
                <select
                  value={styleConfig.perspective}
                  onChange={(e) => {
                    setStyleConfig((prev) => ({ ...prev, perspective: e.target.value as PerspectiveStyle }));
                    setSelectedGlobalPresetId(null);
                    setSelectedPromptGalleryId(null);
                    setPromptEditMode(false);
                  }}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="angle_45">45° clàssic</option>
                  <option value="top_down">Zenital (top‑down)</option>
                  <option value="table_level">A nivell de taula</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground">Càmera</span>
                <select
                  value={styleConfig.camera}
                  onChange={(e) => {
                    setStyleConfig((prev) => ({ ...prev, camera: e.target.value as CameraStyle }));
                    setSelectedGlobalPresetId(null);
                    setSelectedPromptGalleryId(null);
                    setPromptEditMode(false);
                  }}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="smartphone">Smartphone premium</option>
                  <option value="dslr">DSLR editorial</option>
                  <option value="macro">Macro (textura)</option>
                </select>
              </label>

              <div className="flex flex-col gap-2 sm:col-span-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={styleConfig.textureBoost}
                    onChange={(e) => {
                      setStyleConfig((prev) => ({ ...prev, textureBoost: e.target.checked }));
                      setSelectedGlobalPresetId(null);
                      setSelectedPromptGalleryId(null);
                      setPromptEditMode(false);
                    }}
                  />
                  <span className="text-sm text-foreground">Millora textura (sense canviar ingredients)</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={styleConfig.consistentMenu}
                    onChange={(e) => {
                      setStyleConfig((prev) => ({ ...prev, consistentMenu: e.target.checked }));
                      setSelectedGlobalPresetId(null);
                      setSelectedPromptGalleryId(null);
                      setPromptEditMode(false);
                    }}
                  />
                  <span className="text-sm text-foreground">Mantén coherència entre plats del menú</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Save preset */}
        <div className="mt-5 space-y-2">
          <label className="text-sm font-medium text-foreground">Título del preset</label>
          <input
            value={promptTitle}
            onChange={(event) => {
              setPromptTitle(event.target.value);
            }}
            className="w-full rounded-2xl border border-input bg-muted px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none"
            placeholder="Ej: Natural Modern (mi carta)"
            disabled={anyEnhancing || savingPromptOnly}
          />
        </div>

        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => void savePromptOnly()}
            disabled={anyEnhancing || savingPromptOnly}
          >
            {savingPromptOnly ? "Guardando..." : "Guardar preset"}
          </Button>
        </div>

        {/* Prompt (advanced) */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-medium text-foreground">Prompt generado (avanzado)</label>
            <div className="flex gap-2">
              {promptEditMode ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 rounded-full text-xs"
                  onClick={() => {
                    setPromptEditMode(false);
                    setPrompt("");
                  }}
                >
                  Revertir
                </Button>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                className="h-8 rounded-full text-xs"
                onClick={() => {
                  setPromptEditMode(true);
                  setPrompt(generatedPrompt);
                }}
              >
                {promptEditMode ? "Editando" : "Editar prompt"}
              </Button>
            </div>
          </div>

          <textarea
            value={promptEditMode ? prompt : generatedPrompt}
            onChange={(event) => {
              setPrompt(event.target.value);
              setPromptEditMode(true);
              setSelectedGlobalPresetId(null);
              setSelectedPromptGalleryId(null);
            }}
            rows={4}
            className="w-full rounded-2xl border border-input bg-muted px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none"
            placeholder="El prompt se genera automáticamente..."
            disabled={anyEnhancing || !promptEditMode}
          />
        </div>

        <div className="mt-5">
          {items.length === 0 ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !anyEnhancing && inputRef.current?.click()}
              className={cn(
                "relative flex h-56 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-colors",
                isDragging
                  ? "border-primary bg-primary/10"
                  : "border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10",
                anyEnhancing && "cursor-not-allowed opacity-60",
              )}
            >
              <div className="flex flex-col items-center gap-3 p-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <UploadCloud className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    Arrastra tus imágenes aquí o haz click para subir
                  </p>
                  <p className="text-xs text-muted-foreground">PNG, JPG hasta {MAX_SIZE_MB}MB</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {items.map((item) => (
                  <div key={item.id} className="rounded-xl border border-border bg-muted/40 p-2">
                    <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
                      <img src={item.outputUrl ?? item.previewUrl} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={anyEnhancing}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 text-muted-foreground transition hover:bg-background hover:text-foreground disabled:opacity-50"
                        aria-label="Remove"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-foreground">{item.file.name}</p>
                        {item.status === "error" ? (
                          <p className="truncate text-[11px] text-destructive">{item.error}</p>
                        ) : (
                          <p className="text-[11px] text-muted-foreground">
                            {item.status === "done" ? "Listo" : item.status === "enhancing" ? "Mejorando..." : "Pendiente"}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-1">
                        {item.outputUrl ? (
                          <>
                            <a
                              href={item.outputUrl}
                              download={`enhanced-${item.file.name.replace(/\.[^.]+$/, "")}.png`}
                              className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground hover:bg-muted"
                            >
                              Descargar
                            </a>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="rounded-full"
                              onClick={() => void savePromptResult(item)}
                              disabled={savingPromptItemId === item.id || anyEnhancing}
                            >
                              {savingPromptItemId === item.id ? "Guardando..." : "Guardar prompt"}
                            </Button>
                          </>
                        ) : null}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="rounded-full"
                          disabled={anyEnhancing}
                          onClick={() => void enhanceOne(item.id)}
                        >
                          <Sparkles className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => !anyEnhancing && inputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  disabled={anyEnhancing}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-xl border-2 border-dashed transition-colors",
                    isDragging
                      ? "border-primary bg-primary/10"
                      : "border-border bg-muted/50 hover:border-primary/50 hover:bg-primary/5",
                    anyEnhancing && "cursor-not-allowed opacity-60"
                  )}
                >
                  <Plus className={cn("h-6 w-6", isDragging ? "text-primary" : "text-muted-foreground")} />
                </button>
              </div>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={onFileChange}
          />

          {globalError ? (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {globalError}
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground">Galeria</h3>
          <p className="text-sm text-muted-foreground">
            Aqui se guardan automaticamente las fotos mejoradas.
          </p>
        </div>

        {gallery.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Todavia no hay imagenes guardadas.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {gallery.map((asset) => (
              <div key={asset.id} className="rounded-xl border border-border bg-muted/30 p-2">
                <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
                  <img src={asset.imageDataUrl} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="mt-2 min-w-0">
                  <p className="truncate text-xs font-medium text-foreground">
                    {asset.originalFileName || "Imagen mejorada"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(asset.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground">Galeria de prompts</h3>
          <p className="text-sm text-muted-foreground">
            Guarda los prompts que te funcionen y pulsa uno para reutilizarlo.
          </p>
        </div>

        {promptGallery.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Aun no has guardado prompts.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {promptGallery.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => {
                  setPrompt(entry.prompt);
                  setPromptTitle(entry.title);
                  setSelectedPromptGalleryId(entry.id);
                }}
                className="rounded-xl border border-border bg-muted/30 p-3 text-left transition hover:border-primary/50 hover:bg-primary/5"
              >
                {entry.previewImageDataUrl ? (
                  <div className="relative mb-2 aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted">
                    <img src={entry.previewImageDataUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="mb-2 flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-border bg-muted text-xs text-muted-foreground">
                    Sin imagen asociada
                  </div>
                )}
                <p className="truncate text-xs font-semibold text-foreground">{entry.title}</p>
                <p className="line-clamp-3 text-xs font-medium text-foreground">{entry.prompt}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {new Date(entry.createdAt).toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
