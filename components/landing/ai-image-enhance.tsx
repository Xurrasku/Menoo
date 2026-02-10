"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, UploadCloud, ShieldCheck } from "lucide-react";
import posthog from "posthog-js";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { scrollViewportConfig, slideUpVariants, staggerContainerVariants } from "./animation-variants";

const MAX_SIZE_MB = 10;
const TRIAL_LIMIT = 3;
const TRIAL_STORAGE_KEY = "menoo_ai_image_trial_remaining";
const PREVIEW_TARGET_SIZE = 1024;

type AiImageEnhanceSectionProps = {
  locale: string;
  content: {
    eyebrow: string;
    title: string;
    subtitle: string;
    steps: Array<{ title: string; description: string }>;
    trialNote: string;
    upload: {
      title: string;
      description: string;
      cta: string;
      loading: string;
      noTrials: string;
      download: string;
      secondaryCta: string;
      empty: string;
      maxSize: string;
      clear: string;
      remaining: string;
      error: string;
    };
    before: string;
    after: string;
    placeholder: string;
    watermark: string;
  };
};

export function AiImageEnhanceSection({ locale, content }: AiImageEnhanceSectionProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [trialsLeft, setTrialsLeft] = useState(TRIAL_LIMIT);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (process.env.NODE_ENV === "development") {
      window.localStorage.setItem(TRIAL_STORAGE_KEY, String(TRIAL_LIMIT));
      setTrialsLeft(TRIAL_LIMIT);
      return;
    }

    const stored = window.localStorage.getItem(TRIAL_STORAGE_KEY);
    if (!stored) {
      window.localStorage.setItem(TRIAL_STORAGE_KEY, String(TRIAL_LIMIT));
      setTrialsLeft(TRIAL_LIMIT);
      return;
    }

    const parsed = Number(stored);
    setTrialsLeft(Number.isFinite(parsed) ? Math.max(parsed, 0) : TRIAL_LIMIT);
  }, []);

  const updateTrialsLeft = (nextValue: number) => {
    setTrialsLeft(nextValue);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TRIAL_STORAGE_KEY, String(nextValue));
    }
  };

  const fileToDataUrl = (file: File) =>
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    handleSelectedFile(file, event.target);
  };

  const handleSelectedFile = (file: File, input?: HTMLInputElement | null) => {
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      if (input) {
        input.value = "";
      }
      setErrorMessage(content.upload.error);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setFileName(file.name);
    setSelectedFile(file);
    setEnhancedUrl(null);
    setErrorMessage(null);
    posthog.capture?.("landing_ai_image_upload", { fileSize: file.size, mimeType: file.type });
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) {
      return;
    }

    handleSelectedFile(file);
  };

  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setFileName(null);
    setSelectedFile(null);
    setEnhancedUrl(null);
    setErrorMessage(null);
  };

  const handleEnhance = async () => {
    if (!selectedFile || !previewUrl) {
      return;
    }

    if (trialsLeft <= 0) {
      setErrorMessage(content.upload.noTrials);
      posthog.capture?.("landing_ai_image_trial_exhausted");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    posthog.capture?.("landing_ai_image_enhance_start");

    try {
      const { dataUrl, mimeType } = await fileToDataUrl(selectedFile);
      const response = await fetch("/api/ai/image-enhance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: dataUrl, mimeType }),
      });

      const payload = (await response.json()) as {
        data?: { output?: string };
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Enhance request failed");
      }
      if (!payload.data?.output) {
        throw new Error("Invalid response");
      }

      setEnhancedUrl(payload.data.output);
      updateTrialsLeft(Math.max(trialsLeft - 1, 0));
      posthog.capture?.("landing_ai_image_enhance_success");
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : content.upload.error;
      setErrorMessage(message || content.upload.error);
      posthog.capture?.("landing_ai_image_enhance_failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden border-y border-border bg-gradient-to-br from-amber-50 via-orange-50 to-emerald-50 py-20">
      <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden="true">
        <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-amber-200/50 blur-3xl" />
        <div className="absolute -bottom-40 left-10 h-80 w-80 rounded-full bg-emerald-200/50 blur-3xl" />
      </div>
      <div className="container relative mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <motion.div
            variants={slideUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={scrollViewportConfig}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
              <Sparkles className="h-3 w-3" />
              {content.eyebrow}
            </span>
            <h2 className="mt-5 font-display text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
              {content.title}
            </h2>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">
              {content.subtitle}
            </p>

            <motion.div
              className="mt-8 grid gap-4 sm:grid-cols-3"
              variants={staggerContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={scrollViewportConfig}
            >
              {content.steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  className="rounded-2xl border border-foreground/10 bg-white/70 p-4 shadow-sm"
                  variants={slideUpVariants}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="text-sm font-semibold text-foreground">{step.title}</div>
                  <div className="mt-2 text-sm text-muted-foreground">{step.description}</div>
                </motion.div>
              ))}
            </motion.div>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-white/70 px-4 py-2 text-sm text-foreground">
              <ShieldCheck className="h-4 w-4" />
              {content.trialNote}
            </div>
          </motion.div>

          <motion.div
            variants={slideUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={scrollViewportConfig}
          >
            <Card className="border-foreground/10 bg-white/80 shadow-xl">
              <CardHeader>
                <CardTitle className="text-foreground">{content.upload.title}</CardTitle>
                <CardDescription>{content.upload.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <input
                    id="ai-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                  <label
                    htmlFor="ai-image-upload"
                    className="group flex h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-foreground/20 bg-white/60 px-4 text-center transition hover:border-foreground/40"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleDrop}
                  >
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt={content.before}
                        className="h-full w-full rounded-xl object-cover"
                      />
                    ) : (
                      <div className="space-y-2">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                          <UploadCloud className="h-6 w-6" />
                        </div>
                        <div className="text-sm font-semibold text-foreground">{content.upload.empty}</div>
                        <div className="text-xs text-muted-foreground">
                          {content.upload.maxSize.replace("{size}", String(MAX_SIZE_MB))}
                        </div>
                      </div>
                    )}
                  </label>
                  {fileName ? (
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{fileName}</span>
                      <button
                        type="button"
                        onClick={handleClear}
                        className="text-amber-700 hover:text-amber-900"
                      >
                        {content.upload.clear}
                      </button>
                    </div>
                  ) : null}
                  <div className="text-xs text-muted-foreground">
                    {content.upload.remaining.replace("{count}", String(trialsLeft))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-foreground/10 bg-white/70 p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {content.before}
                    </div>
                    <div className="mt-3 aspect-[4/3] overflow-hidden rounded-lg bg-muted/40">
                      {previewUrl ? (
                        <img src={previewUrl} alt={content.before} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                          {content.upload.empty}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="relative rounded-xl border border-foreground/10 bg-white/70 p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {content.after}
                    </div>
                    <div className="mt-3 aspect-[4/3] overflow-hidden rounded-lg bg-muted/40">
                      {enhancedUrl ? (
                        <img src={enhancedUrl} alt={content.after} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                          {content.placeholder}
                        </div>
                      )}
                    </div>
                    {null}
                  </div>
                </div>

                {errorMessage ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {errorMessage}
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    size="lg"
                    className="flex-1"
                    disabled={!previewUrl || isLoading || trialsLeft <= 0}
                    onClick={handleEnhance}
                  >
                    {isLoading
                      ? content.upload.loading
                      : trialsLeft <= 0
                        ? content.upload.noTrials
                        : content.upload.cta}
                  </Button>
                  <Button variant="outline" size="lg" className="flex-1" disabled={!enhancedUrl} asChild>
                    <a href={enhancedUrl ?? "#"} download="menoo-enhanced.png">
                      {content.upload.download}
                    </a>
                  </Button>
                  <Link href={`/${locale}/auth/sign-in`} className="flex-1">
                    <Button variant="outline" size="lg" className="w-full">
                      {content.upload.secondaryCta}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
