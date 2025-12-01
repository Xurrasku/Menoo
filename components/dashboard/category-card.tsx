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
    <div className={cn("space-y-[3%] sm:space-y-4", className)}>
      <div className="flex items-start justify-between gap-[2.5%] sm:gap-3">
        <button
          type="button"
          onClick={onTitleClick}
          className="flex-1 min-w-0 text-left"
        >
          <p className="truncate text-[3.5vw] font-semibold text-foreground sm:text-base">{title}</p>
          {description && description.trim().length > 0 ? (
            <p className="mt-[1%] text-[2.8vw] italic text-muted-foreground sm:mt-1 sm:text-sm">{description}</p>
          ) : null}
        </button>

        <div className="flex items-center gap-[1%] sm:gap-1">
          <Button
            type="button"
            variant="ghost"
            className="flex h-[6.5vw] w-[6.5vw] items-center justify-center text-muted-foreground transition hover:text-foreground sm:h-8 sm:w-8"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapseLabel ?? "Toggle category"}
          >
            <ChevronDown
              className={cn(
                "h-[3.5vw] w-[3.5vw] transition-transform sm:h-4 sm:w-4",
                collapsed ? "rotate-180" : "rotate-0"
              )}
            />
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="flex h-[6.5vw] w-[6.5vw] items-center justify-center text-muted-foreground transition hover:text-foreground sm:h-8 sm:w-8"
            onClick={onActionsClick}
            aria-label="Category actions"
          >
            <MoreHorizontal className="h-[3.5vw] w-[3.5vw] sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>

      {!collapsed ? (
        <div className="rounded-3xl border border-border bg-card p-[4%] shadow-sm sm:p-6">
          {hasDishes ? (
            <div className="space-y-[3%] sm:space-y-4">
              <div className="divide-y divide-border rounded-2xl border border-border">
                {dishes.map((dish) => (
                  <div
                    key={dish.id}
                    className={cn(
                      "grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-[3%] px-[3%] py-[2.5%] text-[2.8vw] transition sm:gap-4 sm:px-4 sm:py-3 sm:text-sm",
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
                      className="flex h-[5vw] w-[5vw] items-center justify-center text-muted-foreground/50 hover:text-muted-foreground sm:h-6 sm:w-6"
                      draggable
                      onDragStart={(event) => handleDragStart(event, dish.id)}
                      onDragEnd={handleDragEnd}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Reordenar ${dish.name}`}
                    >
                      <GripVertical className="h-[3.5vw] w-[3.5vw] sm:h-4 sm:w-4" aria-hidden />
                    </button>

                    <div className="min-w-0">
                      <p className="truncate text-[2.8vw] font-semibold text-foreground sm:text-sm">
                        {dish.name}
                      </p>
                      {dish.description ? (
                        <p className="mt-[0.5%] truncate text-[2.2vw] italic text-muted-foreground sm:mt-0.5 sm:text-xs">
                          {dish.description}
                        </p>
                      ) : null}
                    </div>

                    <div className="text-[2.8vw] font-semibold text-foreground sm:text-sm">
                      {dish.price.toFixed(2)} {dish.currency}
                    </div>

                    <div className="flex items-center gap-[1.5%] sm:gap-2" onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={dish.isVisible}
                        onCheckedChange={(value) => onToggleDishVisibility(dish.id, value)}
                        aria-label={`Toggle visibility for ${dish.name}`}
                      />
                      <div className="flex h-[8vw] w-[8vw] items-center justify-center overflow-hidden rounded-xl border border-border bg-muted text-base sm:h-10 sm:w-10">
                        {dish.thumbnail ? dish.thumbnail : <UtensilsCrossed className="h-[3.5vw] w-[3.5vw] text-muted-foreground sm:h-4 sm:w-4" />}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDish(dish.id);
                      }}
                      className="flex h-[6.5vw] w-[6.5vw] items-center justify-center rounded-full text-muted-foreground/50 transition hover:text-destructive sm:h-8 sm:w-8"
                      aria-label={`Delete ${dish.name}`}
                    >
                      <Trash2 className="h-[3.5vw] w-[3.5vw] sm:h-4 sm:w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-start">
                <Button
                  type="button"
                  onClick={onAddDish}
                  className="rounded-full bg-primary px-[4%] py-[1.5%] text-[2.8vw] font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary/90 sm:px-5 sm:py-2 sm:text-sm"
                >
                  + {newDishLabel}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex w-full flex-col items-center gap-[3%] rounded-2xl border border-dashed border-border bg-muted/30 px-[6%] py-[9%] text-center sm:gap-4 sm:px-10 sm:py-14">
              <div className="flex h-[12vw] w-[12vw] items-center justify-center rounded-full bg-primary/10 text-primary sm:h-16 sm:w-16">
                <UtensilsCrossed className="h-[6vw] w-[6vw] sm:h-8 sm:w-8" />
              </div>
              <p className="text-[2.8vw] font-medium text-muted-foreground sm:text-sm">{emptyDescription}</p>
              <Button
                type="button"
                onClick={onAddDish}
                className="rounded-full bg-primary px-[4%] py-[1.5%] text-[2.8vw] font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary/90 sm:px-5 sm:py-2 sm:text-sm"
              >
                + {newDishLabel}
              </Button>
            </div>
          )}
          {hasDishes ? (
            <div
              className="mt-[2.5%] h-[3vw] rounded-2xl border border-dashed border-transparent sm:mt-3 sm:h-4"
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

