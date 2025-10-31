"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MenuNameEditor } from "@/components/dashboard/menu-name-editor";
import { CategoryCard, type Dish as CategoryDish } from "@/components/dashboard/category-card";
import { cn } from "@/lib/utils";

export type MenuDetailMessages = {
  back: string;
  title: string;
  untitledCategory: string;
  emptyDescription: string;
  newDish: string;
  newCategory: string;
  collapse: string;
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

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "cat-aperitivos",
    name: "Aperitivos",
    description: "",
    dishes: [
      {
        id: "dish-caprese",
        name: "Ensalada caprese",
        description: "Una sencilla ensalada italiana hecha con tomate, mozzarella fresca y albahaca.",
        price: 12,
        currency: "€",
        thumbnail: "🥗",
        isVisible: true,
        labels: ["Vegetariano"],
        allergens: ["Leche"],
      },
      {
        id: "dish-gazpacho",
        name: "Gazpacho",
        description: "Sopa fría de tomate, pepino y pimiento.",
        price: 9,
        currency: "€",
        thumbnail: "🥣",
        isVisible: true,
        labels: ["Vegetariano"],
        allergens: [],
      },
      {
        id: "dish-onionrings",
        name: "Aros de cebolla",
        description: "Crujientes aros de cebolla rebozados.",
        price: 8,
        currency: "€",
        thumbnail: "🧅",
        isVisible: true,
        labels: [],
        allergens: ["Gluten"],
      },
    ],
  },
  {
    id: "cat-placeholder",
    name: "sii",
    description: "somos",
    dishes: [],
  },
];

export function NewMenuScreen({ locale, menu }: NewMenuScreenProps) {
  const [categories, setCategories] = useState<Category[]>(() =>
    DEFAULT_CATEGORIES.map((category) => ({ ...category, dishes: [...category.dishes] }))
  );

  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [isDishModalOpen, setDishModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
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
    <div className="flex flex-1 flex-col gap-8 pt-8">
      <Link
        href={`/${locale}/dashboard/menus`}
        className="flex w-full items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        {menu.back}
      </Link>

      <div className="mx-auto w-full max-w-4xl space-y-8">
        <div className="rounded-[32px] border border-slate-200/80 bg-white/95 p-12 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.45)]">
          <div className="flex items-center gap-4 pb-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <span className="text-xl" aria-hidden>
                Ψ
              </span>
            </span>
            <MenuNameEditor
              menuId="new-menu"
              initialValue={menu.title}
              className="flex-1"
              textClassName="text-3xl font-semibold text-slate-900"
              inputClassName="text-3xl font-semibold text-slate-900"
              buttonClassName="p-1 text-slate-400 hover:text-slate-900"
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
                      cat.id === category.id ? { ...cat, dishes: nextOrder } : cat
                    )
                  )
                }
                onAddDish={() => {
                  resetDishForm();
                  setActiveDishCategoryId(category.id);
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
                className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
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

      {isCategoryModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{menu.categoryModal.title}</h2>
              <button
                type="button"
                onClick={() => {
                  setCategoryModalOpen(false);
                  resetCategoryModal();
                }}
                className="p-2 text-slate-400 transition hover:text-slate-900"
                aria-label={menu.categoryModal.cancel}
              >
                ×
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block text-sm font-medium text-slate-600">
                {menu.categoryModal.nameLabel}
                <Input
                  value={categoryName}
                  onChange={(event) => setCategoryName(event.target.value)}
                  className="mt-2"
                />
              </label>

              <label className="block text-sm font-medium text-slate-600">
                {menu.categoryModal.descriptionLabel}
                <textarea
                  value={categoryDescription}
                  onChange={(event) => setCategoryDescription(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-primary focus:outline-none"
                  rows={4}
                />
              </label>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                onClick={() => {
                  setCategoryModalOpen(false);
                  resetCategoryModal();
                }}
              >
                {menu.categoryModal.cancel}
              </Button>
              <Button
                type="button"
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
                onClick={handleSaveCategory}
              >
                {menu.categoryModal.save}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isDishModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-8 shadow-2xl">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{menu.dishModal.title}</h2>
              <button
                type="button"
                onClick={() => {
                  setDishModalOpen(false);
                  resetDishForm();
                  setActiveDishCategoryId(null);
                }}
                className="p-2 text-slate-400 transition hover:text-slate-900"
                aria-label={menu.dishModal.cancel}
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid grid-cols-[minmax(0,1fr)_220px] gap-8">
              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-600">
                  {menu.dishModal.nameLabel}
                  <Input
                    value={dishForm.name}
                    onChange={(event) => setDishForm((prev) => ({ ...prev, name: event.target.value }))}
                    className="mt-2"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-600">
                  {menu.dishModal.descriptionLabel}
                  <textarea
                    value={dishForm.description}
                    onChange={(event) =>
                      setDishForm((prev) => ({ ...prev, description: event.target.value }))
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-primary focus:outline-none"
                    rows={4}
                  />
                </label>

                <div className="grid grid-cols-[minmax(0,1fr)_100px] items-end gap-4">
                  <label className="block text-sm font-medium text-slate-600">
                    {menu.dishModal.priceLabel}
                    <div className="mt-2 flex overflow-hidden rounded-2xl border border-slate-200">
                      <input
                        type="text"
                        value={dishForm.price}
                        onChange={(event) => setDishForm((prev) => ({ ...prev, price: event.target.value }))}
                        className="flex-1 bg-white px-4 py-2 text-sm text-slate-700 outline-none"
                      />
                      <div className="flex items-center gap-2 border-l border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
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
                  <p className="text-sm font-semibold text-slate-600">{menu.dishModal.labelsTitle}</p>
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
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-600">{menu.dishModal.allergensTitle}</p>
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
                              ? "border-rose-400 bg-rose-50 text-rose-500"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
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
                <div className="flex h-44 w-40 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 text-center text-sm text-slate-500">
                  <span className="mb-2 text-3xl" aria-hidden>
                    {dishForm.thumbnail}
                  </span>
                  <p className="font-semibold text-slate-600">{menu.dishModal.imageUpload}</p>
                  <p className="mt-1 px-6 text-xs text-slate-400">{menu.dishModal.imageHelper}</p>
                  <button
                    type="button"
                    className="mt-3 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                    onClick={() => setDishForm((prev) => ({ ...prev, thumbnail: "📸" }))}
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
                className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                onClick={() => {
                  setDishModalOpen(false);
                  resetDishModal();
                }}
              >
                {menu.dishModal.cancel}
              </Button>
              <Button
                type="button"
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
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
}
