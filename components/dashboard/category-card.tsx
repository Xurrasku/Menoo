"use client";

import { useMemo, useState, type DragEvent } from "react";
import {
  ChevronDown,
  GripVertical,
  MoreHorizontal,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export type Dish = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  thumbnail?: string;
  isVisible: boolean;
  labels?: string[];
  allergens?: string[];
};

type CategoryCardProps = {
  title: string;
  emptyDescription: string;
  description?: string;
  collapseLabel?: string;
  className?: string;
  dishes: Dish[];
  onAddDish: () => void;
  onToggleDishVisibility: (dishId: string, next: boolean) => void;
  onDeleteDish: (dishId: string) => void;
  newDishLabel: string;
  onReorderDishes: (dishes: Dish[]) => void;
  onActionsClick?: () => void;
  onTitleClick?: () => void;
};

export function CategoryCard({
  title,
  emptyDescription,
  description,
  collapseLabel,
  className,
  dishes,
  onAddDish,
  onToggleDishVisibility,
  onDeleteDish,
  newDishLabel,
  onReorderDishes,
  onActionsClick,
  onTitleClick,
}: CategoryCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const hasDishes = useMemo(() => dishes.length > 0, [dishes.length]);

  const handleDragStart = (event: DragEvent<HTMLButtonElement>, dishId: string) => {
    setDraggedId(dishId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", dishId);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!draggedId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (dishId: string) => {
    if (!draggedId || draggedId === dishId) return;
    const originIndex = dishes.findIndex((dish) => dish.id === draggedId);
    const targetIndex = dishes.findIndex((dish) => dish.id === dishId);
    if (originIndex === -1 || targetIndex === -1 || originIndex === targetIndex) return;

    const nextOrder = [...dishes];
    const [movedDish] = nextOrder.splice(originIndex, 1);
    nextOrder.splice(targetIndex, 0, movedDish);
    onReorderDishes(nextOrder);
  };

  const handleDropZoneEnter = () => {
    if (!draggedId) return;
    const originIndex = dishes.findIndex((dish) => dish.id === draggedId);
    if (originIndex === -1 || originIndex === dishes.length - 1) return;

    const nextOrder = [...dishes];
    const [movedDish] = nextOrder.splice(originIndex, 1);
    nextOrder.push(movedDish);
    onReorderDishes(nextOrder);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={onTitleClick}
          className="flex-1 min-w-0 text-left"
        >
          <p className="truncate text-base font-semibold text-slate-900">{title}</p>
          {description && description.trim().length > 0 ? (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          ) : null}
        </button>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            className="flex h-8 w-8 items-center justify-center text-slate-400 transition hover:text-slate-900"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapseLabel ?? "Toggle category"}
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                collapsed ? "rotate-180" : "rotate-0"
              )}
            />
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="flex h-8 w-8 items-center justify-center text-slate-400 transition hover:text-slate-900"
            onClick={onActionsClick}
            aria-label="Category actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!collapsed ? (
        <div className="rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-sm">
          {hasDishes ? (
            <div className="space-y-4">
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/70">
                {dishes.map((dish) => (
                  <div
                    key={dish.id}
                    className={cn(
                      "grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-4 py-3 text-sm transition",
                      draggedId === dish.id ? "bg-slate-50" : "bg-white"
                    )}
                    onDragEnter={() => handleDragEnter(dish.id)}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                  >
                    <button
                      type="button"
                      className="flex h-6 w-6 items-center justify-center text-slate-300 hover:text-slate-500"
                      draggable
                      onDragStart={(event) => handleDragStart(event, dish.id)}
                      onDragEnd={handleDragEnd}
                      aria-label={`Reordenar ${dish.name}`}
                    >
                      <GripVertical className="h-4 w-4" aria-hidden />
                    </button>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {dish.name}
                      </p>
                      {dish.description ? (
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {dish.description}
                        </p>
                      ) : null}
                    </div>

                    <div className="text-sm font-semibold text-slate-700">
                      {dish.price.toFixed(2)} {dish.currency}
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={dish.isVisible}
                        onCheckedChange={(value) => onToggleDishVisibility(dish.id, value)}
                        aria-label={`Toggle visibility for ${dish.name}`}
                      />
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 text-base">
                        {dish.thumbnail ? dish.thumbnail : <UtensilsCrossed className="h-4 w-4 text-slate-400" />}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteDish(dish.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition hover:text-rose-500"
                      aria-label={`Delete ${dish.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-start">
                <Button
                  type="button"
                  onClick={onAddDish}
                  className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(79,70,229,0.65)] transition hover:bg-primary/90"
                >
                  + {newDishLabel}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex w-full flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-200/80 bg-slate-50/60 px-10 py-14 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UtensilsCrossed className="h-8 w-8" />
              </div>
              <p className="text-sm font-medium text-slate-500">{emptyDescription}</p>
              <Button
                type="button"
                onClick={onAddDish}
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(79,70,229,0.65)] transition hover:bg-primary/90"
              >
                + {newDishLabel}
              </Button>
            </div>
          )}
          {hasDishes ? (
            <div
              className="mt-3 h-4 rounded-2xl border border-dashed border-transparent"
              onDragEnter={handleDropZoneEnter}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

