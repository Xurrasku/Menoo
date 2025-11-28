"use client";

import { ChevronRight } from "lucide-react";
import type { RestaurantMenuDetail } from "@/lib/menus/service";

type MenuSelectorProps = {
  menus: RestaurantMenuDetail[];
  restaurantName: string;
  onSelectMenu: (menu: RestaurantMenuDetail) => void;
};

export function MenuSelector({ menus, restaurantName, onSelectMenu }: MenuSelectorProps) {
  const totalDishes = (menu: RestaurantMenuDetail) => {
    return menu.categories.reduce((sum, cat) => sum + cat.dishes.filter(d => d.isVisible).length, 0);
  };

  return (
    <div className="space-y-6 pb-8 sm:pb-10">
      <h1 className="mb-8 font-display text-[1.875rem] font-bold uppercase leading-tight tracking-wider text-[#1a1a1a] sm:mb-10 sm:text-[2.25rem]">
        {restaurantName}
      </h1>
      
      <div className="space-y-0">
        {menus.map((menu, index) => {
          const dishCount = totalDishes(menu);
          return (
            <div key={menu.id}>
              {index > 0 && (
                <div className="border-b border-[#e5e5e5] mb-5 sm:mb-6" />
              )}
              <button
                onClick={() => onSelectMenu(menu)}
                className="group w-full text-left transition"
              >
                <article className="flex gap-4 pb-5 sm:gap-5 sm:pb-6">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-baseline justify-between gap-4 sm:mb-1.5">
                    <h2 className="font-display text-base font-bold leading-tight tracking-tight text-[#1a1a1a] sm:text-lg group-hover:text-primary transition-colors">
                      {menu.name}
                    </h2>
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-[#999999] transition group-hover:text-primary sm:h-6 sm:w-6">
                      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  </div>
                  {menu.categories.length > 0 && (
                    <p className="mb-2 text-xs leading-relaxed text-[#666666] italic sm:mb-2.5 sm:text-sm">
                      {menu.categories.length} {menu.categories.length === 1 ? "categoría" : "categorías"}
                      {dishCount > 0 && (
                        <> · {dishCount} {dishCount === 1 ? "plato" : "platos"}</>
                      )}
                    </p>
                  )}
                  {menu.categories.length === 0 && (
                    <p className="mb-2 text-xs leading-relaxed text-[#666666] italic sm:mb-2.5 sm:text-sm">
                      Menú vacío
                    </p>
                  )}
                </div>
              </article>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

