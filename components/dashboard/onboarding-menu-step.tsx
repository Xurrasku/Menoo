"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { ArrowLeft, Loader2, Plus, Sparkles, UploadCloud, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AiMenuDraft } from "@/lib/menus/ai-import";

type PendingImage = {
  id: string;
  file: File;
  previewUrl: string;
};

type OnboardingMenuStepProps = {
  locale: string;
  copy: {
    title: string;
    subtitle: string;
    uploadTitle: string;
    uploadSubtitle: string;
    dropHere: string;
    clickOrDrag: string;
    fileTypes: string;
    analyzing: string;
    useYourData: string;
    useExampleData: string;
    continueButton: string;
    skipButton: string;
    redirecting: string;
    errorFallback: string;
  };
  restaurantId: string;
};

const logoVariants: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
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

function createExampleMenuData(createClientId: (prefix: string) => string) {
  return {
    name: "Our Menu",
    categories: [
      {
        id: createClientId("cat"),
        name: "Starters",
        description: "Delicious appetizers to start your meal",
        dishes: [
          {
            id: createClientId("dish"),
            name: "Caprese Salad",
            description: "Fresh mozzarella, tomatoes, and basil",
            price: 8.5,
            currency: "EUR",
            thumbnail: "",
            isVisible: true,
            labels: [],
            allergens: [],
          },
          {
            id: createClientId("dish"),
            name: "Garlic Bread",
            description: "Homemade bread with garlic butter",
            price: 4.5,
            currency: "EUR",
            thumbnail: "",
            isVisible: true,
            labels: [],
            allergens: ["Gluten"],
          },
        ],
      },
      {
        id: createClientId("cat"),
        name: "Main Courses",
        description: "Our chef's specialties",
        dishes: [
          {
            id: createClientId("dish"),
            name: "Grilled Salmon",
            description: "Fresh salmon with vegetables and herbs",
            price: 18.5,
            currency: "EUR",
            thumbnail: "",
            isVisible: true,
            labels: [],
            allergens: ["Fish"],
          },
          {
            id: createClientId("dish"),
            name: "Vegetarian Pasta",
            description: "Penne pasta with seasonal vegetables",
            price: 12.5,
            currency: "EUR",
            thumbnail: "",
            isVisible: true,
            labels: ["Vegetarian"],
            allergens: ["Gluten"],
          },
        ],
      },
    ],
  };
}

export function OnboardingMenuStep({ locale, copy, restaurantId }: OnboardingMenuStepProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [choice, setChoice] = useState<"upload" | "example" | null>(null);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [isAiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function createClientId(prefix: string) {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
  }

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          resolve(result);
          return;
        }
        if (result instanceof ArrayBuffer) {
          const bytes = new Uint8Array(result);
          let binary = "";
          for (let index = 0; index < bytes.byteLength; index += 1) {
            binary += String.fromCharCode(bytes[index]);
          }
          const base64 = btoa(binary);
          resolve(`data:${file.type || "application/octet-stream"};base64,${base64}`);
          return;
        }
        reject(new Error("Unsupported file content"));
      };
      reader.onerror = () => reject(reader.error ?? new Error("Unable to read file"));
      reader.readAsDataURL(file);
    });
  }

  function handleFileSelect(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    addPendingImages(Array.from(files));
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
      setAiError("Please drop image files");
      return;
    }

    addPendingImages(Array.from(files));
  }

  async function processAllImages() {
    if (pendingImages.length === 0) return;

    setAiError(null);
    setAiGenerating(true);

    try {
      const allCategories: Array<{
        id: string;
        name: string;
        description: string;
        dishes: Array<{
          id: string;
          name: string;
          description: string;
          price: number;
          currency: string;
          thumbnail: string;
          isVisible: boolean;
          labels: string[];
          allergens: string[];
        }>;
      }> = [];
      let menuName = "";

      for (const pendingImage of pendingImages) {
        const dataUrl = await fileToDataUrl(pendingImage.file);
        const response = await fetch("/api/ai/menu-from-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: dataUrl,
            mimeType: pendingImage.file.type || undefined,
          }),
        });

        const body = (await response.json().catch(() => null)) as
          | { data?: AiMenuDraft; error?: string }
          | null;

        if (!response.ok || !body?.data) {
          console.warn("Failed to process image:", pendingImage.file.name);
          continue;
        }

        if (body.data.name && !menuName) {
          menuName = body.data.name.trim();
        }

        for (const category of body.data.categories) {
          const existingCategory = allCategories.find((c) => c.name === category.name);
          if (existingCategory) {
            existingCategory.dishes.push(...category.dishes);
          } else {
            allCategories.push({
              id: createClientId("cat"),
              name: category.name,
              description: category.description || "",
              dishes: category.dishes.map((dish) => ({
                id: createClientId("dish"),
                name: dish.name,
                description: dish.description || "",
                price: dish.price,
                currency: dish.currency || "EUR",
                thumbnail: dish.thumbnail || "",
                isVisible: true,
                labels: dish.labels || [],
                allergens: dish.allergens || [],
              })),
            });
          }
        }
      }

      if (allCategories.length === 0) {
        setAiError("No menu content detected in the uploaded images.");
        setAiGenerating(false);
        return;
      }

      await saveMenu({
        name: menuName || "Our Menu",
        categories: allCategories,
      });
    } catch (error) {
      console.error("Failed to process images", error);
      setAiError(
        error instanceof Error && error.message
          ? error.message
          : "We couldn't process those photos. Try again."
      );
      setAiGenerating(false);
    }
  }

  async function saveMenu(menuData: {
    name: string;
    categories: Array<{
      id: string;
      name: string;
      description: string;
      dishes: Array<{
        id: string;
        name: string;
        description: string;
        price: number;
        currency: string;
        thumbnail: string;
        isVisible: boolean;
        labels: string[];
        allergens: string[];
      }>;
    }>;
  }) {
    setErrorMessage(null);
    setAiGenerating(true);

    try {
      const payload = {
        restaurantId,
        name: menuData.name,
        isDefault: true,
        categories: menuData.categories.map((category) => ({
          id: category.id,
          name: category.name,
          description: category.description,
          dishes: category.dishes.map((dish) => ({
            id: dish.id,
            name: dish.name,
            description: dish.description,
            price: dish.price,
            currency: dish.currency,
            thumbnail: dish.thumbnail,
            isVisible: dish.isVisible,
            labels: dish.labels,
            allergens: dish.allergens,
          })),
        })),
      };

      const response = await fetch("/api/menus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(error?.error || copy.errorFallback);
      }

      startTransition(() => {
        router.replace(`/${locale}/dashboard/enjoy/onboarding` as Route);
      });
    } catch (error) {
      console.error("Failed to save menu", error);
      setErrorMessage(
        error instanceof Error ? error.message : copy.errorFallback
      );
      setAiGenerating(false);
    }
  }

  async function handleUseExampleData() {
    const exampleData = createExampleMenuData(createClientId);
    await saveMenu(exampleData);
  }

  async function handleSkip() {
    await handleUseExampleData();
  }

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
            animate={{ width: "75%" }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400">
          <span className="text-primary font-medium">Restaurant Details</span>
          <span className="text-primary font-medium">Design</span>
          <span className="text-primary font-medium">Menu</span>
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
        <motion.div
          className="grid gap-4 sm:grid-cols-2"
          variants={itemVariants}
        >
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
                {copy.useYourData}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {copy.uploadSubtitle}
              </p>
            </div>
          </motion.button>

          <motion.button
            type="button"
            onClick={() => setChoice("example")}
            className="group relative flex flex-col items-center gap-4 rounded-2xl p-8 text-center transition-all duration-300 bg-slate-50/50 hover:bg-slate-100/50 ring-1 ring-slate-200/60 hover:ring-slate-300/60"
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-200/60 text-slate-600 transition-colors duration-300 group-hover:bg-slate-200">
              <Sparkles className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-semibold text-slate-900">
                {copy.useExampleData}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Start with a sample menu and customize it later.
              </p>
            </div>
          </motion.button>
        </motion.div>
      )}

      {/* Upload Screen */}
      {choice === "upload" && (
        <motion.div
          className="flex w-full flex-col space-y-6"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Image previews grid */}
          {pendingImages.length > 0 ? (
            <div className="w-full space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {pendingImages.map((img) => (
                  <div
                    key={img.id}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
                  >
                    <img
                      src={img.previewUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePendingImage(img.id)}
                      disabled={isAiGenerating}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-muted-foreground opacity-0 transition hover:bg-background hover:text-foreground group-hover:opacity-100 disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => !isAiGenerating && fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  disabled={isAiGenerating}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-xl border-2 border-dashed transition-colors",
                    isDragging
                      ? "border-primary bg-primary/10"
                      : "border-border bg-muted/50 hover:border-primary/50 hover:bg-primary/5",
                    isAiGenerating && "cursor-not-allowed opacity-50"
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
                onClick={processAllImages}
                disabled={isAiGenerating || pendingImages.length === 0}
                size="lg"
                className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary/90"
              >
                {isAiGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {copy.analyzing}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {copy.continueButton}
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isAiGenerating && fileInputRef.current?.click()}
              className={cn(
                "relative flex h-56 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-colors",
                isDragging
                  ? "border-primary bg-primary/10"
                  : "border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10",
                isAiGenerating && "cursor-not-allowed opacity-50"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={isAiGenerating}
              />
              <div className="flex flex-col items-center gap-3 p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <UploadCloud className="h-7 w-7" />
                </div>
                <div className="space-y-1 text-center">
                  <p className="text-sm font-semibold text-foreground">
                    {isDragging ? copy.dropHere : copy.clickOrDrag}
                  </p>
                  <p className="text-xs text-muted-foreground">{copy.fileTypes}</p>
                </div>
              </div>
            </div>
          )}

          {aiError && (
            <motion.div
              className="w-full rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {aiError}
            </motion.div>
          )}

          {errorMessage && (
            <motion.div
              className="w-full rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {errorMessage}
            </motion.div>
          )}

          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={isAiGenerating || isPending}
            className="w-full"
          >
            {isPending ? copy.redirecting : copy.skipButton}
          </Button>
        </motion.div>
      )}

      {/* Example Data Screen */}
      {choice === "example" && (
        <motion.div
          className="flex w-full flex-col space-y-6"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="rounded-xl bg-slate-50/50 p-6 text-center ring-1 ring-slate-200/60">
            <p className="text-slate-600 leading-relaxed">
              We&apos;ll create a sample menu with starters and main courses. You can customize everything later.
            </p>
          </div>

          <Button
            onClick={handleUseExampleData}
            disabled={isPending}
            size="lg"
            className="w-full"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {copy.redirecting}
              </>
            ) : (
              copy.continueButton
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
        </motion.div>
      )}
    </motion.div>
  );
}
