"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { Loader2, Plus, Sparkles, UploadCloud, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_SIZE_MB = 10;
const PREVIEW_TARGET_SIZE = 1024;

// Duplicated from ai/image-enhance.ts (server module). Keep in sync.
const DEFAULT_IMAGE_ENHANCE_PROMPT =
  "Enhance this dish photo into professional food photography. Preserve the exact dish, ingredients, portion size, plating, and arrangement. Do not add, remove, or replace any ingredients or garnishes. Improve lighting, color balance, texture, and sharpness to look appetizing yet photorealistic. Remove distracting background objects and clutter, keeping a clean, neutral setting that matches the original plate or bowl. No stylization, no text, no logos, no watermark.";

type PendingImage = {
  id: string;
  file: File;
  previewUrl: string;
  status: "idle" | "enhancing" | "done" | "error";
  error?: string;
  outputUrl?: string;
};

export function VisualsImageEnhancer() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [prompt, setPrompt] = useState(DEFAULT_IMAGE_ENHANCE_PROMPT);
  const [items, setItems] = useState<PendingImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

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
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "enhancing", error: undefined } : item))
    );

    const item = items.find((it) => it.id === id);
    if (!item) return;

    try {
      const { dataUrl, mimeType } = await fileToSquarePngDataUrl(item.file);
      const response = await fetch("/api/ai/image-enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl, mimeType, prompt: prompt.trim() || undefined }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { data?: { output?: string }; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Enhance request failed");
      }
      if (!payload?.data?.output) {
        throw new Error("Invalid response");
      }

      setItems((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, status: "done", outputUrl: payload.data!.output } : it
        )
      );
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

        <div className="mt-5 space-y-2">
          <label className="text-sm font-medium text-foreground">Prompt</label>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={4}
            className="w-full rounded-2xl border border-input bg-muted px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none"
            placeholder="Describe cómo quieres mejorar las fotos..."
            disabled={anyEnhancing}
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
                          <a
                            href={item.outputUrl}
                            download={`enhanced-${item.file.name.replace(/\.[^.]+$/, "")}.png`}
                            className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground hover:bg-muted"
                          >
                            Descargar
                          </a>
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
    </div>
  );
}
