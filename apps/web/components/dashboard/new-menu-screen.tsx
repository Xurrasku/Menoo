"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, FileEdit, Loader2, Plus, Sparkles, UploadCloud, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MenuNameEditor } from "@/components/dashboard/menu-name-editor";
import { CategoryCard, type Dish as CategoryDish } from "@/components/dashboard/category-card";
import { cn } from "@/lib/utils";
import type { MenuDetailData } from "@/lib/menus/service";
import type { AiMenuDraft } from "@/lib/menus/ai-import";

export type MenuDetailMessages = {
  back: string;
  title: string;
  untitledCategory: string;
  emptyDescription: string;
  newDish: string;
  newCategory: string;
  collapse: string;
  save: string;
  saving: string;
  saveError: string;
  aiUploader: {
    title: string;
    subtitle: string;
    dropHere: string;
    clickOrDrag: string;
    fileTypes: string;
    analyzing: string;
    createManually: string;
    process: string;
  };
  categoryModal: {
    title: string;
    nameLabel: string;
    descriptionLabel: string;
    save: string;
    cancel: string;
  };
  dishModal: {
    title: string;
    nameLabel: string;
    descriptionLabel: string;
    priceLabel: string;
    priceHint: string;
    imageUpload: string;
    imageHelper: string;
    labelsTitle: string;
    allergensTitle: string;
    save: string;
    cancel: string;
  };
};

type Dish = CategoryDish & {
  labels: string[];
  allergens: string[];
};

type Category = {
  id: string;
  name: string;
  description: string;
  dishes: Dish[];
};

type DishFormState = {
  name: string;
  description: string;
  price: string;
  currency: string;
  thumbnail: string;
  labels: string[];
  allergens: string[];
};

type PendingImage = {
  id: string;
  file: File;
  previewUrl: string;
};

type VisualAssetPick = {
  id: string;
  imageDataUrl: string;
  originalFileName: string | null;
  createdAt: string;
};

type NewMenuScreenProps = {
  locale: string;
  menu: MenuDetailMessages;
  restaurantId: string;
  initialMenu?: MenuDetailData | null;
  hasExistingMenus?: boolean;
  visualAssets?: VisualAssetPick[];
};

const LABEL_OPTIONS: Record<string, string[]> = {
  es: ["Picante", "Sin gluten", "Sin lácteos", "Vegano", "Vegetariano"],
  en: ["Spicy", "Gluten free", "Dairy free", "Vegan", "Vegetarian"],
  ca: ["Picant", "Sense gluten", "Sense lactis", "Vegà", "Vegetarià"],
};

const ALLERGEN_OPTIONS: Record<string, string[]> = {
  es: [
    "Altramuces",
    "Apio",
    "Cacahuetes",
    "Crustáceos",
    "Dióxido de azufre y sulfitos",
    "Frutos de cáscara",
    "Gluten",
    "Huevos",
    "Leche",
    "Moluscos",
    "Mostaza",
    "Pescado",
    "Sésamo",
    "Soja",
  ],
  en: [
    "Lupin",
    "Celery",
    "Peanuts",
    "Crustaceans",
    "Sulphur dioxide",
    "Tree nuts",
    "Gluten",
    "Eggs",
    "Milk",
    "Molluscs",
    "Mustard",
    "Fish",
    "Sesame",
    "Soy",
  ],
  ca: [
    "Tramussos",
    "Api",
    "Cacauets",
    "Crustacis",
    "Diòxid de sofre i sulfits",
    "Fruits de closca",
    "Gluten",
    "Ous",
    "Llet",
    "Mol·luscs",
    "Mostassa",
    "Peix",
    "Sèsam",
    "Soja",
  ],
};

const DEFAULT_CATEGORIES: Category[] = [];

export function NewMenuScreen({
  locale,
  menu,
  restaurantId,
  initialMenu,
  visualAssets = [],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  hasExistingMenus: _hasExistingMenus,
}: NewMenuScreenProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [menuTitle, setMenuTitle] = useState(() => initialMenu?.name ?? menu.title);
  const [hasEditedTitle, setHasEditedTitle] = useState(false);
  const [categories, setCategories] = useState<Category[]>(() => {
    if (initialMenu) {
      return initialMenu.categories.map((category) => ({
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
          labels: [...dish.labels],
          allergens: [...dish.allergens],
        })),
      }));
    }

    return DEFAULT_CATEGORIES.map((category) => ({ ...category, dishes: [...category.dishes] }));
  });
  const [isSaving, setIsSaving] = useState(false);
  const [creationMode, setCreationMode] = useState<"ai" | "manual" | null>(
    initialMenu ? "manual" : "ai"
  );
  const [isAiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);

  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [isDishModalOpen, setDishModalOpen] = useState(false);
  const [isDishGalleryOpen, setDishGalleryOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingDishId, setEditingDishId] = useState<string | null>(null);
  const [activeDishCategoryId, setActiveDishCategoryId] = useState<string | null>(null);

  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");

  const [dishForm, setDishForm] = useState<DishFormState>({
    name: "",
    description: "",
    price: "",
    currency: "€",
    thumbnail: "🍽️",
    labels: [],
    allergens: [],
  });

  const dishThumbnailIsImage = dishForm.thumbnail.startsWith("data:image") || dishForm.thumbnail.startsWith("http");

  const labelOptions = useMemo(() => LABEL_OPTIONS[locale] ?? LABEL_OPTIONS.es, [locale]);
  const allergenOptions = useMemo(() => ALLERGEN_OPTIONS[locale] ?? ALLERGEN_OPTIONS.es, [locale]);
  const showChoiceScreen = creationMode === null && !initialMenu;
  const showAiUploader = creationMode === "ai" && !initialMenu && categories.length === 0;
  const showManualEditor = creationMode === "manual" || !!initialMenu || (creationMode === "ai" && categories.length > 0);

  const resetCategoryModal = () => {
    setCategoryName("");
    setCategoryDescription("");
    setEditingCategoryId(null);
  };

  const resetDishForm = () => {
    setDishForm({
      name: "",
      description: "",
      price: "",
      currency: "€",
      thumbnail: "🍽️",
      labels: [],
      allergens: [],
    });
    setEditingDishId(null);
  };

  const handleSaveCategory = () => {
    if (editingCategoryId) {
      setCategories((prev) =>
        prev.map((category) =>
          category.id === editingCategoryId
            ? {
                ...category,
                name: categoryName.trim() || menu.untitledCategory,
                description: categoryDescription.trim(),
              }
            : category
        )
      );
    } else {
      const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `cat-${Date.now()}`;
      setCategories((prev) => [
        ...prev,
        {
          id,
          name: categoryName.trim() || menu.untitledCategory,
          description: categoryDescription.trim(),
          dishes: [],
        },
      ]);
    }
    setCategoryModalOpen(false);
    resetCategoryModal();
  };

  const handleSaveDish = () => {
    if (!activeDishCategoryId) return;
    const priceValue = parseFloat(dishForm.price.replace(",", ".")) || 0;
    
    if (editingDishId) {
      // Update existing dish
      setCategories((prev) =>
        prev.map((category) =>
          category.id === activeDishCategoryId
            ? {
                ...category,
                dishes: category.dishes.map((dish) =>
                  dish.id === editingDishId
                    ? {
                        ...dish,
                        name: dishForm.name.trim() || menu.dishModal.nameLabel,
                        description: dishForm.description.trim(),
                        price: priceValue,
                        currency: dishForm.currency,
                        thumbnail: dishForm.thumbnail,
                        labels: [...dishForm.labels],
                        allergens: [...dishForm.allergens],
                      }
                    : dish
                ),
              }
            : category
        )
      );
    } else {
      // Create new dish
      const newDish: Dish = {
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `dish-${Date.now()}`,
        name: dishForm.name.trim() || menu.dishModal.nameLabel,
        description: dishForm.description.trim(),
        price: priceValue,
        currency: dishForm.currency,
        thumbnail: dishForm.thumbnail,
        isVisible: true,
        labels: [...dishForm.labels],
        allergens: [...dishForm.allergens],
      };

      setCategories((prev) =>
        prev.map((category) =>
          category.id === activeDishCategoryId
            ? { ...category, dishes: [...category.dishes, newDish] }
            : category
        )
      );
    }

    resetDishForm();
    setDishModalOpen(false);
    setActiveDishCategoryId(null);
  };

  const toggleLabel = (label: string) => {
    setDishForm((prev) => ({
      ...prev,
      labels: prev.labels.includes(label)
        ? prev.labels.filter((value) => value !== label)
        : [...prev.labels, label],
    }));
  };

  const toggleAllergen = (allergen: string) => {
    setDishForm((prev) => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter((value) => value !== allergen)
        : [...prev.allergens, allergen],
    }));
  };

  function addPendingImages(files: FileList | File[]) {
    const newImages: PendingImage[] = [];
    for (const file of Array.from(files)) {
      if (file.type.startsWith("image/")) {
        newImages.push({
          id: createClientId("img"),
          file,
          previewUrl: URL.createObjectURL(file),
        });
      }
    }
    if (newImages.length > 0) {
      setPendingImages((prev) => [...prev, ...newImages]);
      setAiError(null);
    }
  }

  function removePendingImage(imageId: string) {
    setPendingImages((prev) => {
      const image = prev.find((img) => img.id === imageId);
      if (image) {
        URL.revokeObjectURL(image.previewUrl);
      }
      return prev.filter((img) => img.id !== imageId);
    });
  }

  function handleAiFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    event.target.value = "";
    if (!files || files.length === 0) return;
    addPendingImages(files);
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

    addPendingImages(files);
  }

  async function processAllImages() {
    if (pendingImages.length === 0) return;
    
    setAiError(null);
    setAiGenerating(true);
    
    try {
      const allCategories: Category[] = [];
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
          allCategories.push({
            id: createClientId("category"),
            name: category.name?.trim() || menu.untitledCategory,
            description: category.description?.trim() ?? "",
            dishes: category.dishes.map((dish) => ({
              id: createClientId("dish"),
              name: dish.name?.trim() || menu.dishModal.nameLabel,
              description: dish.description?.trim() ?? "",
              price: typeof dish.price === "number" && Number.isFinite(dish.price) ? dish.price : 0,
              currency: dish.currency?.trim() || "€",
              thumbnail: "🍽️",
              isVisible: true,
              labels: [],
              allergens: [],
            })),
          });
        }
      }

      if (allCategories.length === 0) {
        setAiError("We couldn't find any dishes in those photos.");
        return;
      }

      if (menuName && !hasEditedTitle) {
        setMenuTitle(menuName);
      }

      setCategories(allCategories);
      
      // Clean up preview URLs
      for (const img of pendingImages) {
        URL.revokeObjectURL(img.previewUrl);
      }
      setPendingImages([]);
      
      setCreationMode("manual");
    } catch (error) {
      console.error("AI menu import failed", error);
      setAiError(
        error instanceof Error && error.message
          ? error.message
          : "We couldn't process those photos. Try again.",
      );
    } finally {
      setAiGenerating(false);
    }
  }

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

  return (
    <div className="flex flex-1 flex-col gap-8">
      <Link
        href={`/${locale}/dashboard/menus`}
        className="flex w-full items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {menu.back}
      </Link>

      {showChoiceScreen ? (
        <div className="mx-auto w-full max-w-4xl">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-foreground">Create a new menu</h1>
            <p className="mt-2 text-muted-foreground">Choose how you&apos;d like to create your menu</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setCreationMode("ai")}
              className="group flex flex-col items-center gap-4 rounded-3xl border-2 border-primary/30 bg-primary/5 p-8 text-left transition hover:border-primary/60 hover:bg-primary/10"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary/20">
                <Sparkles className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">Generate from image</h3>
                <p className="text-sm text-muted-foreground">
                  Upload a photo of your menu and we&apos;ll automatically extract all categories and dishes using AI.
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setCreationMode("manual")}
              className="group flex flex-col items-center gap-4 rounded-3xl border-2 border-border bg-card p-8 text-left transition hover:border-primary/30 hover:bg-muted/50"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-foreground transition group-hover:bg-muted/80">
                <FileEdit className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">Create manually</h3>
                <p className="text-sm text-muted-foreground">
                  Start from scratch and add your categories and dishes one by one.
                </p>
              </div>
            </button>
          </div>
        </div>
      ) : null}

      {showAiUploader ? (
        <div className="mx-auto flex w-full max-w-lg flex-col items-center space-y-6">
          <div className="space-y-3 text-center">
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {menu.aiUploader.title}
            </h1>
            <p className="text-base text-muted-foreground">
              {menu.aiUploader.subtitle}
            </p>
          </div>

          {/* Image previews grid */}
          {pendingImages.length > 0 ? (
            <div className="w-full space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {pendingImages.map((img) => (
                  <div key={img.id} className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
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
                {/* Add more button - supports drag & drop */}
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
                  <Plus className={cn("h-6 w-6 transition-colors", isDragging ? "text-primary" : "text-muted-foreground")} />
                </button>
              </div>

              {/* Process button */}
              <Button
                type="button"
                onClick={() => void processAllImages()}
                disabled={isAiGenerating || pendingImages.length === 0}
                className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary/90"
              >
                {isAiGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {menu.aiUploader.analyzing}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {menu.aiUploader.process}
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
              <div className="flex flex-col items-center gap-3 p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <UploadCloud className="h-7 w-7" />
                </div>
                <div className="space-y-1 text-center">
                  <p className="text-sm font-semibold text-foreground">
                    {isDragging ? menu.aiUploader.dropHere : menu.aiUploader.clickOrDrag}
                  </p>
                  <p className="text-xs text-muted-foreground">{menu.aiUploader.fileTypes}</p>
                </div>
              </div>
            </div>
          )}

          {aiError ? (
            <div className="w-full rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {aiError}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setCreationMode("manual")}
            disabled={isAiGenerating}
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground disabled:opacity-50"
          >
            <span>{menu.aiUploader.createManually}</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleAiFileChange}
          />
        </div>
      ) : null}

      {showManualEditor ? (
        <div className="mx-auto w-full max-w-4xl space-y-8">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="pb-6">
            <MenuNameEditor
              menuId={initialMenu?.id ?? "new-menu"}
              initialValue={menuTitle}
              className="flex-1"
              textClassName="text-2xl font-semibold text-foreground"
              inputClassName="text-2xl font-semibold text-foreground"
              buttonClassName="p-1 text-muted-foreground hover:text-foreground"
              onChange={(_menuId, value) => {
                setMenuTitle(value);
                setHasEditedTitle(true);
              }}
            />
          </div>

          <div className="space-y-10">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                title={category.name}
                description={category.description}
                emptyDescription={menu.emptyDescription}
                collapseLabel={menu.collapse}
                dishes={category.dishes}
                newDishLabel={menu.newDish}
                onReorderDishes={(nextOrder) =>
                  setCategories((prev) =>
                    prev.map((cat) =>
                      cat.id === category.id
                        ? {
                            ...cat,
                            dishes: nextOrder.map((dish) => ({
                              ...dish,
                              labels: dish.labels ?? [],
                              allergens: dish.allergens ?? [],
                            })),
                          }
                        : cat
                    )
                  )
                }
                onAddDish={() => {
                  resetDishForm();
                  setActiveDishCategoryId(category.id);
                  setDishModalOpen(true);
                }}
                onEditDish={(dish) => {
                  setEditingDishId(dish.id);
                  setActiveDishCategoryId(category.id);
                  setDishForm({
                    name: dish.name,
                    description: dish.description,
                    price: dish.price.toString(),
                    currency: dish.currency,
                    thumbnail: dish.thumbnail || "🍽️",
                    labels: dish.labels || [],
                    allergens: dish.allergens || [],
                  });
                  setDishModalOpen(true);
                }}
                onToggleDishVisibility={(dishId, next) =>
                  setCategories((prev) =>
                    prev.map((cat) =>
                      cat.id === category.id
                        ? {
                            ...cat,
                            dishes: cat.dishes.map((dish) =>
                              dish.id === dishId ? { ...dish, isVisible: next } : dish
                            ),
                          }
                        : cat
                    )
                  )
                }
                onDeleteDish={(dishId) =>
                  setCategories((prev) =>
                    prev.map((cat) =>
                      cat.id === category.id
                        ? { ...cat, dishes: cat.dishes.filter((dish) => dish.id !== dishId) }
                        : cat
                    )
                  )
                }
                onTitleClick={() => {
                  setEditingCategoryId(category.id);
                  setCategoryName(category.name);
                  setCategoryDescription(category.description);
                  setCategoryModalOpen(true);
                }}
                onActionsClick={() => {
                  setEditingCategoryId(category.id);
                  setCategoryName(category.name);
                  setCategoryDescription(category.description);
                  setCategoryModalOpen(true);
                }}
              />
            ))}

            <div className="flex justify-start">
              <Button
                type="button"
                variant="ghost"
                className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted"
                onClick={() => {
                  resetCategoryModal();
                  setCategoryModalOpen(true);
                }}
              >
                {menu.newCategory}
              </Button>
            </div>
          </div>
        </div>
      </div>
      ) : null}

      {showManualEditor ? (
        <div className="sticky bottom-8 z-40 flex justify-end">
        <Button
          type="button"
          className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary/90"
          disabled={isSaving}
          onClick={() => {
            if (isSaving) return;
            void handleSaveMenu();
          }}
        >
          {isSaving ? menu.saving : menu.save}
        </Button>
      </div>
      ) : null}

      {showManualEditor && errorMessage ? (
        <div className="mx-auto w-full max-w-4xl rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {errorMessage}
        </div>
      ) : null}

      {isCategoryModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl border border-border bg-card p-8 shadow-2xl">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold text-foreground">{menu.categoryModal.title}</h2>
              <button
                type="button"
                onClick={() => {
                  setCategoryModalOpen(false);
                  resetCategoryModal();
                }}
                className="p-2 text-muted-foreground transition hover:text-foreground"
                aria-label={menu.categoryModal.cancel}
              >
                ×
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block text-sm font-medium text-foreground">
                {menu.categoryModal.nameLabel}
                <Input
                  value={categoryName}
                  onChange={(event) => setCategoryName(event.target.value)}
                  className="mt-2"
                />
              </label>

              <label className="block text-sm font-medium text-foreground">
                {menu.categoryModal.descriptionLabel}
                <textarea
                  value={categoryDescription}
                  onChange={(event) => setCategoryDescription(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-input bg-muted px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none"
                  rows={4}
                />
              </label>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted"
                onClick={() => {
                  setCategoryModalOpen(false);
                  resetCategoryModal();
                }}
              >
                {menu.categoryModal.cancel}
              </Button>
              <Button
                type="button"
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
                onClick={handleSaveCategory}
              >
                {menu.categoryModal.save}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isDishModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-3xl border border-border bg-card p-8 shadow-2xl">
            {isDishGalleryOpen ? (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="w-full max-w-4xl rounded-3xl border border-border bg-card p-6 shadow-2xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Selecciona una imagen</h3>
                      <p className="text-sm text-muted-foreground">Desde tu galería de Visuales</p>
                    </div>
                    <Button type="button" variant="ghost" className="rounded-full" onClick={() => setDishGalleryOpen(false)}>
                      Cerrar
                    </Button>
                  </div>

                  {visualAssets.length === 0 ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
                      No hay imágenes todavía. Ve a Personalizar → Visuales y genera algunas.
                    </div>
                  ) : (
                    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {visualAssets.map((asset) => (
                        <button
                          key={asset.id}
                          type="button"
                          className="group rounded-2xl border border-border bg-muted/20 p-2 text-left transition hover:border-primary/40 hover:bg-muted/40"
                          onClick={() => {
                            setDishForm((prev) => ({ ...prev, thumbnail: asset.imageDataUrl }));
                            setDishGalleryOpen(false);
                          }}
                        >
                          <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={asset.imageDataUrl} alt="" className="h-full w-full object-cover" />
                          </div>
                          <p className="mt-2 truncate text-xs font-medium text-foreground">
                            {asset.originalFileName ?? "Imagen"}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">{new Date(asset.createdAt).toLocaleString()}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {editingDishId
                  ? menu.dishModal.title
                      .replace(/^New /i, "Edit ")
                      .replace(/^Nuevo /i, "Editar ")
                      .replace(/^Nou /i, "Edita ")
                  : menu.dishModal.title}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setDishModalOpen(false);
                  resetDishForm();
                  setActiveDishCategoryId(null);
                }}
                className="p-2 text-muted-foreground transition hover:text-foreground"
                aria-label={menu.dishModal.cancel}
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid grid-cols-[minmax(0,1fr)_220px] gap-8">
              <div className="space-y-4">
                <label className="block text-sm font-medium text-foreground">
                  {menu.dishModal.nameLabel}
                  <Input
                    value={dishForm.name}
                    onChange={(event) => setDishForm((prev) => ({ ...prev, name: event.target.value }))}
                    className="mt-2"
                  />
                </label>

                <label className="block text-sm font-medium text-foreground">
                  {menu.dishModal.descriptionLabel}
                  <textarea
                    value={dishForm.description}
                    onChange={(event) =>
                      setDishForm((prev) => ({ ...prev, description: event.target.value }))
                    }
                    className="mt-2 w-full rounded-2xl border border-input bg-muted px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none"
                    rows={4}
                  />
                </label>

                <div className="grid grid-cols-[minmax(0,1fr)_100px] items-end gap-4">
                  <label className="block text-sm font-medium text-foreground">
                    {menu.dishModal.priceLabel}
                    <div className="mt-2 flex overflow-hidden rounded-2xl border border-input">
                      <input
                        type="text"
                        value={dishForm.price}
                        onChange={(event) => setDishForm((prev) => ({ ...prev, price: event.target.value }))}
                        className="flex-1 bg-background px-4 py-2 text-sm text-foreground outline-none"
                      />
                      <div className="flex items-center gap-2 border-l border-input bg-muted px-3 text-sm text-muted-foreground">
                        {dishForm.currency}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="mt-1 text-xs font-semibold text-primary transition hover:text-primary/80"
                    >
                      {menu.dishModal.priceHint}
                    </button>
                  </label>
                </div>

                <div className="space-y-[2%] sm:space-y-3">
                  <p className="text-[2.8vw] font-semibold text-foreground sm:text-sm">{menu.dishModal.labelsTitle}</p>
                  <div className="flex flex-wrap gap-x-[4%] gap-y-[9%] sm:gap-x-3 sm:gap-y-4">
                    {labelOptions.map((label) => {
                      const isSelected = dishForm.labels.includes(label);
                      return (
                        <button
                          type="button"
                          key={label}
                          onClick={() => toggleLabel(label)}
                          className={cn(
                            "rounded-full border px-[2.5%] py-[0.8%] text-[2.2vw] font-medium transition whitespace-nowrap sm:px-4 sm:py-1 sm:text-xs",
                            isSelected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:bg-muted"
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-[2%] sm:space-y-3 mt-[6%] sm:mt-[4%]">
                  <p className="text-[2.8vw] font-semibold text-foreground sm:text-sm">{menu.dishModal.allergensTitle}</p>
                  <div className="flex flex-wrap gap-x-[4%] gap-y-[9%] sm:gap-x-3 sm:gap-y-4">
                    {allergenOptions.map((allergen) => {
                      const isSelected = dishForm.allergens.includes(allergen);
                      return (
                        <button
                          type="button"
                          key={allergen}
                          onClick={() => toggleAllergen(allergen)}
                          className={cn(
                            "rounded-full border px-[2.5%] py-[0.8%] text-[2.2vw] font-medium transition whitespace-nowrap sm:px-4 sm:py-1 sm:text-xs",
                            isSelected
                              ? "border-destructive/50 bg-destructive/10 text-destructive"
                              : "border-border bg-background text-muted-foreground hover:border-destructive/50 hover:bg-muted"
                          )}
                        >
                          {allergen}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-start gap-4">
                <div className="flex h-44 w-40 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-muted/50 text-center text-sm text-muted-foreground">
                  <div className="mb-3 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-border bg-background">
                    {dishThumbnailIsImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={dishForm.thumbnail} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-3xl" aria-hidden>
                        {dishForm.thumbnail}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-foreground">{menu.dishModal.imageUpload}</p>
                  <p className="mt-1 px-6 text-xs text-muted-foreground">{menu.dishModal.imageHelper}</p>

                  <div className="mt-3 flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => setDishGalleryOpen(true)}
                    >
                      Elegir de Visuales
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="rounded-full text-muted-foreground"
                      onClick={() => setDishForm((prev) => ({ ...prev, thumbnail: "🍽️" }))}
                    >
                      Quitar
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted"
                onClick={() => {
                  setDishModalOpen(false);
                  resetDishForm();
                }}
              >
                {menu.dishModal.cancel}
              </Button>
              <Button
                type="button"
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
                onClick={handleSaveDish}
              >
                {menu.dishModal.save}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  async function handleSaveMenu() {
    setErrorMessage(null);
    setIsSaving(true);

    try {
      // Use PUT for editing, POST for creating
      const isEditing = !!initialMenu;
      const payload = isEditing
        ? {
            name: menuTitle.trim() || menu.title,
            categories: categories.map((category) => ({
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
          }
        : {
            restaurantId,
            name: menuTitle.trim() || menu.title,
            categories: categories.map((category) => ({
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

      const url = isEditing ? `/api/menus/${initialMenu.id}` : "/api/menus";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(error?.error ?? response.statusText);
      }

      router.push(`/${locale}/dashboard/menus`);
      setIsSaving(false);
    } catch (error) {
      console.error("Failed to save menu", error);
      setErrorMessage(
        error instanceof Error && error.message
          ? error.message
          : menu.saveError
      );
      setIsSaving(false);
    }
  }
}
