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
  onEditDish?: (dish: Dish) => void;
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
  onEditDish,
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
          <p className="truncate text-base font-semibold text-foreground">{title}</p>
          {description && description.trim().length > 0 ? (
            <p className="mt-1 text-sm italic text-muted-foreground">{description}</p>
          ) : null}
        </button>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            className="flex h-8 w-8 items-center justify-center text-muted-foreground transition hover:text-foreground"
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
            className="flex h-8 w-8 items-center justify-center text-muted-foreground transition hover:text-foreground"
            onClick={onActionsClick}
            aria-label="Category actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!collapsed ? (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          {hasDishes ? (
            <div className="space-y-4">
              <div className="divide-y divide-border rounded-2xl border border-border">
                {dishes.map((dish) => (
                  <div
                    key={dish.id}
                    className={cn(
                      "grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-4 py-3 text-sm transition",
                      draggedId === dish.id ? "bg-muted/50" : "bg-background",
                      onEditDish && "cursor-pointer hover:bg-muted/50"
                    )}
                    onDragEnter={() => handleDragEnter(dish.id)}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    onClick={(e) => {
                      // Don't trigger edit if clicking on interactive elements
                      const target = e.target as HTMLElement;
                      if (
                        target.closest("button") ||
                        target.closest('[role="switch"]') ||
                        target.closest("label")
                      ) {
                        return;
                      }
                      onEditDish?.(dish);
                    }}
                  >
                    <button
                      type="button"
                      className="flex h-6 w-6 items-center justify-center text-muted-foreground/50 hover:text-muted-foreground"
                      draggable
                      onDragStart={(event) => handleDragStart(event, dish.id)}
                      onDragEnd={handleDragEnd}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Reordenar ${dish.name}`}
                    >
                      <GripVertical className="h-4 w-4" aria-hidden />
                    </button>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {dish.name}
                      </p>
                      {dish.description ? (
                        <p className="mt-0.5 truncate text-xs italic text-muted-foreground">
                          {dish.description}
                        </p>
                      ) : null}
                    </div>

                    <div className="text-sm font-semibold text-foreground">
                      {dish.price.toFixed(2)} {dish.currency}
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={dish.isVisible}
                        onCheckedChange={(value) => onToggleDishVisibility(dish.id, value)}
                        aria-label={`Toggle visibility for ${dish.name}`}
                      />
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted text-base">
                        {dish.thumbnail ? dish.thumbnail : <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDish(dish.id);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground/50 transition hover:text-destructive"
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
                  className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary/90"
                >
                  + {newDishLabel}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex w-full flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-muted/30 px-10 py-14 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UtensilsCrossed className="h-8 w-8" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">{emptyDescription}</p>
              <Button
                type="button"
                onClick={onAddDish}
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary/90"
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

