"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MenuNameEditor } from "@/components/dashboard/menu-name-editor";
import { CategoryCard, type Dish as CategoryDish } from "@/components/dashboard/category-card";
import { cn } from "@/lib/utils";
import type { MenuDetailData } from "@/lib/menus/service";

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

type NewMenuScreenProps = {
  locale: string;
  menu: MenuDetailMessages;
  restaurantId: string;
  initialMenu?: MenuDetailData | null;
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

export function NewMenuScreen({ locale, menu, restaurantId, initialMenu }: NewMenuScreenProps) {
  const router = useRouter();
  const [menuTitle, setMenuTitle] = useState(() => initialMenu?.name ?? menu.title);
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [isDishModalOpen, setDishModalOpen] = useState(false);
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

  const labelOptions = useMemo(() => LABEL_OPTIONS[locale] ?? LABEL_OPTIONS.es, [locale]);
  const allergenOptions = useMemo(() => ALLERGEN_OPTIONS[locale] ?? ALLERGEN_OPTIONS.es, [locale]);

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

  return (
    <div className="flex flex-1 flex-col gap-8">
      <Link
        href={`/${locale}/dashboard/menus`}
        className="flex w-full items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {menu.back}
      </Link>

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
              onChange={(_menuId, value) => setMenuTitle(value)}
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

      {errorMessage ? (
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

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">{menu.dishModal.labelsTitle}</p>
                  <div className="flex flex-wrap gap-2">
                    {labelOptions.map((label) => {
                      const isSelected = dishForm.labels.includes(label);
                      return (
                        <button
                          type="button"
                          key={label}
                          onClick={() => toggleLabel(label)}
                          className={cn(
                            "rounded-full border px-4 py-1 text-xs font-medium transition",
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

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">{menu.dishModal.allergensTitle}</p>
                  <div className="flex flex-wrap gap-2">
                    {allergenOptions.map((allergen) => {
                      const isSelected = dishForm.allergens.includes(allergen);
                      return (
                        <button
                          type="button"
                          key={allergen}
                          onClick={() => toggleAllergen(allergen)}
                          className={cn(
                            "rounded-full border px-4 py-1 text-xs font-medium transition",
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
                <div className="flex h-44 w-40 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-muted/50 text-center text-sm text-muted-foreground opacity-60">
                  <span className="mb-2 text-3xl" aria-hidden>
                    {dishForm.thumbnail}
                  </span>
                  <p className="font-semibold text-foreground">{menu.dishModal.imageUpload}</p>
                  <p className="mt-1 px-6 text-xs text-muted-foreground">{menu.dishModal.imageHelper}</p>
                  <button
                    type="button"
                    disabled
                    className="mt-3 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground cursor-not-allowed"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    {menu.dishModal.imageUpload}
                  </button>
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
