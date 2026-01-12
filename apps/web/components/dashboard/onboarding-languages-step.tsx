"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { motion, type Variants } from "framer-motion";
import Image from "next/image";
import {
  Check,
  Globe,
  Loader2,
  Plus,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Supported languages for translation
const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "ca", name: "Català", flag: "🏴" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
] as const;

type PendingImage = {
  id: string;
  file: File;
  previewUrl: string;
};

type SelectedLanguage = {
  code: string;
  name: string;
  flag: string;
  method: "upload" | "ai";
};

type OnboardingLanguagesStepProps = {
  locale: string;
  copy: {
    title: string;
    subtitle: string;
    uploadTitle: string;
    uploadSubtitle: string;
    aiTranslateTitle: string;
    aiTranslateSubtitle: string;
    dropHere: string;
    clickOrDrag: string;
    fileTypes: string;
    analyzing: string;
    translating: string;
    selectLanguage: string;
    selectedLanguages: string;
    noLanguagesSelected: string;
    addLanguage: string;
    removeLanguage: string;
    useUpload: string;
    useAiTranslate: string;
    useSampleData: string;
    sampleDataDescription: string;
    continueButton: string;
    skipButton: string;
    redirecting: string;
    errorFallback: string;
  };
  restaurantId: string;
  primaryLanguage?: string;
};

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const languageCardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.2 },
  },
};

export function OnboardingLanguagesStep({
  locale,
  copy,
  restaurantId: _restaurantId,
  primaryLanguage = "en",
}: OnboardingLanguagesStepProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // State for the multi-step flow
  const [choice, setChoice] = useState<"upload" | "ai" | "sample" | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<SelectedLanguage[]>([]);
  const [activeLanguage, setActiveLanguage] = useState<string | null>(null);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  // Filter out primary language from available options
  const availableLanguages = SUPPORTED_LANGUAGES.filter(
    (lang) =>
      lang.code !== primaryLanguage &&
      !selectedLanguages.some((s) => s.code === lang.code)
  );

  function createClientId(prefix: string) {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
  }

  function addPendingImages(files: File[]) {
    const newImages: PendingImage[] = files.map((file) => {
      const id = createClientId("img");
      const previewUrl = URL.createObjectURL(file);
      return { id, file, previewUrl };
    });
    setPendingImages((prev) => [...prev, ...newImages]);
  }

  function removePendingImage(id: string) {
    setPendingImages((prev) => {
      const image = prev.find((img) => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.previewUrl);
      }
      return prev.filter((img) => img.id !== id);
    });
  }

  function handleFileSelect(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    addPendingImages(Array.from(files));
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
      setErrorMessage("Please drop image files");
      return;
    }

    addPendingImages(Array.from(files));
  }

  function addLanguage(lang: (typeof SUPPORTED_LANGUAGES)[number], method: "upload" | "ai") {
    setSelectedLanguages((prev) => [
      ...prev,
      { code: lang.code, name: lang.name, flag: lang.flag, method },
    ]);
    setShowLanguageSelector(false);
  }

  function removeLanguage(code: string) {
    setSelectedLanguages((prev) => prev.filter((l) => l.code !== code));
    if (activeLanguage === code) {
      setActiveLanguage(null);
      setPendingImages([]);
    }
  }

  async function processUploadedImages() {
    if (pendingImages.length === 0 || !activeLanguage) return;

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      // TODO: Implement actual AI processing for translations from images
      // For now, simulate processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Clean up preview URLs
      for (const img of pendingImages) {
        URL.revokeObjectURL(img.previewUrl);
      }
      setPendingImages([]);

      // Mark this language as processed and move to next or finish
      const remainingUploadLanguages = selectedLanguages.filter(
        (l) => l.method === "upload" && l.code !== activeLanguage
      );

      if (remainingUploadLanguages.length > 0) {
        setActiveLanguage(remainingUploadLanguages[0].code);
      } else {
        // All uploads done, continue to next step
        await finishOnboarding();
      }
    } catch (error) {
      console.error("Failed to process images", error);
      setErrorMessage(copy.errorFallback);
    } finally {
      setIsProcessing(false);
    }
  }

  async function processAiTranslations() {
    const aiLanguages = selectedLanguages.filter((l) => l.method === "ai");
    if (aiLanguages.length === 0) return;

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      // TODO: Implement actual AI translation API call
      // For now, simulate processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await finishOnboarding();
    } catch (error) {
      console.error("Failed to translate", error);
      setErrorMessage(copy.errorFallback);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleUseSampleData() {
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      // TODO: Apply sample translations to the menu
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await finishOnboarding();
    } catch (error) {
      console.error("Failed to apply sample data", error);
      setErrorMessage(copy.errorFallback);
    } finally {
      setIsProcessing(false);
    }
  }

  async function finishOnboarding() {
    startTransition(() => {
      // Navigate to the QR onboarding step or dashboard
      router.replace(`/${locale}/dashboard/qr` as Route);
    });
  }

  async function handleSkip() {
    startTransition(() => {
      router.replace(`/${locale}/dashboard/qr` as Route);
    });
  }

  async function handleContinue() {
    if (choice === "upload") {
      const uploadLanguages = selectedLanguages.filter((l) => l.method === "upload");
      if (uploadLanguages.length > 0 && !activeLanguage) {
        setActiveLanguage(uploadLanguages[0].code);
        return;
      }
      if (pendingImages.length > 0) {
        await processUploadedImages();
        return;
      }
    }

    if (choice === "ai") {
      await processAiTranslations();
      return;
    }

    if (choice === "sample") {
      await handleUseSampleData();
      return;
    }
  }

  const canContinue =
    (choice === "upload" && selectedLanguages.some((l) => l.method === "upload")) ||
    (choice === "ai" && selectedLanguages.some((l) => l.method === "ai")) ||
    choice === "sample";

  return (
    <motion.div
      className="flex flex-col gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Progress indicator */}
      <motion.div 
        className="space-y-3"
        variants={itemVariants}
      >
        <div className="relative h-1 w-full rounded-full bg-slate-100 overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-violet-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: "80%" }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400">
          <span className="text-primary font-medium">Restaurant Details</span>
          <span className="text-primary font-medium">Design</span>
          <span className="text-primary font-medium">Menu</span>
          <span className="text-primary font-medium">Languages</span>
          <span>Enjoy</span>
        </div>
      </motion.div>

      {/* Title & Subtitle */}
      <motion.div 
        className="text-center space-y-3 mb-4"
        variants={itemVariants}
      >
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
          {copy.title}
        </h1>
        <p className="text-base text-slate-500 max-w-md mx-auto leading-relaxed">
          {copy.subtitle}
        </p>
      </motion.div>

      {/* Choice Screen */}
      {!choice && (
        <motion.div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" variants={itemVariants}>
          {/* Upload Option */}
          <motion.button
            type="button"
            onClick={() => setChoice("upload")}
            className="group relative flex flex-col items-center gap-4 rounded-2xl p-8 text-center transition-all duration-300 bg-gradient-to-br from-primary/5 to-violet-50 hover:from-primary/10 hover:to-violet-100/50 ring-1 ring-primary/20 hover:ring-primary/40"
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary/15">
              <UploadCloud className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-semibold text-slate-900">
                {copy.useUpload}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {copy.uploadSubtitle}
              </p>
            </div>
          </motion.button>

          {/* AI Translation Option */}
          <motion.button
            type="button"
            onClick={() => setChoice("ai")}
            className="group relative flex flex-col items-center gap-4 rounded-2xl p-8 text-center transition-all duration-300 bg-gradient-to-br from-violet-50 to-purple-50 hover:from-violet-100/50 hover:to-purple-100/50 ring-1 ring-violet-200/60 hover:ring-violet-300/60"
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-violet-100 text-violet-600 transition-colors duration-300 group-hover:bg-violet-200/80">
              <Sparkles className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-semibold text-slate-900">
                {copy.useAiTranslate}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {copy.aiTranslateSubtitle}
              </p>
            </div>
          </motion.button>

          {/* Sample Data Option */}
          <motion.button
            type="button"
            onClick={() => setChoice("sample")}
            className="group relative flex flex-col items-center gap-4 rounded-2xl p-8 text-center transition-all duration-300 bg-slate-50/50 hover:bg-slate-100/50 ring-1 ring-slate-200/60 hover:ring-slate-300/60 sm:col-span-2 lg:col-span-1"
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-200/60 text-slate-600 transition-colors duration-300 group-hover:bg-slate-200">
              <Globe className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-semibold text-slate-900">
                {copy.useSampleData}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {copy.sampleDataDescription}
              </p>
            </div>
          </motion.button>
        </motion.div>
      )}

      {/* Upload/AI Language Selection Screen */}
      {(choice === "upload" || choice === "ai") && !activeLanguage && (
        <motion.div
          className="flex w-full flex-col space-y-6"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Selected Languages */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">
              {copy.selectedLanguages}
            </h3>

            {selectedLanguages.length === 0 ? (
              <p className="text-sm text-slate-400 italic">{copy.noLanguagesSelected}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedLanguages.map((lang) => (
                  <motion.div
                    key={lang.code}
                    variants={languageCardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                    <button
                      type="button"
                      onClick={() => removeLanguage(lang.code)}
                      className="ml-1 rounded-full p-0.5 hover:bg-primary/20 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Add Language Button/Selector */}
          {showLanguageSelector ? (
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 rounded-xl bg-slate-50 ring-1 ring-slate-200"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {availableLanguages.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => addLanguage(lang, choice)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white hover:ring-1 hover:ring-primary/30 transition-all"
                >
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowLanguageSelector(false)}
                className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 transition-colors col-span-full mt-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </motion.div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowLanguageSelector(true)}
              disabled={availableLanguages.length === 0}
              className="w-full gap-2"
            >
              <Plus className="h-4 w-4" />
              {copy.addLanguage}
            </Button>
          )}

          {/* Continue/Skip Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              disabled={isProcessing || isPending}
              className="flex-1"
            >
              {isPending ? copy.redirecting : copy.skipButton}
            </Button>
            <Button
              type="button"
              onClick={handleContinue}
              disabled={!canContinue || isProcessing || isPending}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {choice === "ai" ? copy.translating : copy.analyzing}
                </>
              ) : (
                copy.continueButton
              )}
            </Button>
          </div>

          {errorMessage && (
            <motion.p
              className="text-sm font-semibold text-destructive"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {errorMessage}
            </motion.p>
          )}
        </motion.div>
      )}

      {/* Upload Screen for specific language */}
      {choice === "upload" && activeLanguage && (
        <motion.div
          className="flex w-full flex-col space-y-6"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Current language indicator */}
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <span>
              {selectedLanguages.find((l) => l.code === activeLanguage)?.flag}
            </span>
            <span>
              Uploading for:{" "}
              <span className="text-primary">
                {selectedLanguages.find((l) => l.code === activeLanguage)?.name}
              </span>
            </span>
          </div>

          {/* Image previews grid */}
          {pendingImages.length > 0 ? (
            <div className="w-full space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {pendingImages.map((img) => (
                  <div
                    key={img.id}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
                  >
                    <Image
                      src={img.previewUrl}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => removePendingImage(img.id)}
                      disabled={isProcessing}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-muted-foreground opacity-0 transition hover:bg-background hover:text-foreground group-hover:opacity-100 disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => !isProcessing && fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  disabled={isProcessing}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-xl border-2 border-dashed transition-colors",
                    isDragging
                      ? "border-primary bg-primary/10"
                      : "border-border bg-muted/50 hover:border-primary/50 hover:bg-primary/5",
                    isProcessing && "cursor-not-allowed opacity-50"
                  )}
                >
                  <Plus
                    className={cn(
                      "h-6 w-6 transition-colors",
                      isDragging ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                </button>
              </div>

              <Button
                onClick={processUploadedImages}
                disabled={isProcessing || pendingImages.length === 0}
                size="lg"
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {copy.analyzing}
                  </>
                ) : (
                  copy.continueButton
                )}
              </Button>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-colors",
                isDragging
                  ? "border-primary bg-primary/10"
                  : "border-border bg-muted/30 hover:border-primary/50 hover:bg-primary/5"
              )}
              onClick={() => !isProcessing && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={isProcessing}
              />
              <UploadCloud
                className={cn(
                  "mb-4 h-12 w-12 transition-colors",
                  isDragging ? "text-primary" : "text-muted-foreground"
                )}
              />
              <p className="mb-2 text-sm font-semibold text-foreground">
                {copy.dropHere}
              </p>
              <p className="text-xs text-muted-foreground">{copy.clickOrDrag}</p>
              <p className="mt-2 text-xs text-muted-foreground">{copy.fileTypes}</p>
            </div>
          )}

          {errorMessage && (
            <motion.p
              className="text-sm font-semibold text-destructive"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {errorMessage}
            </motion.p>
          )}

          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={isProcessing || isPending}
            className="w-full"
          >
            {isPending ? copy.redirecting : copy.skipButton}
          </Button>
        </motion.div>
      )}

      {/* Sample Data Screen */}
      {choice === "sample" && (
        <motion.div
          className="flex w-full flex-col space-y-6"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="rounded-xl bg-slate-50/50 p-6 text-center ring-1 ring-slate-200/60">
            <div className="flex justify-center gap-3 mb-4">
              {["🇬🇧", "🇪🇸", "🇫🇷"].map((flag) => (
                <motion.span
                  key={flag}
                  className="text-3xl"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {flag}
                </motion.span>
              ))}
            </div>
            <p className="text-slate-600 leading-relaxed">
              {copy.sampleDataDescription}
            </p>
          </div>

          <Button
            onClick={handleUseSampleData}
            disabled={isPending || isProcessing}
            size="lg"
            className="w-full"
          >
            {isProcessing || isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {copy.redirecting}
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                {copy.continueButton}
              </>
            )}
          </Button>

          {errorMessage && (
            <motion.p
              className="text-sm font-semibold text-destructive"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {errorMessage}
            </motion.p>
          )}

          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={isProcessing || isPending}
            className="w-full"
          >
            {isPending ? copy.redirecting : copy.skipButton}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
