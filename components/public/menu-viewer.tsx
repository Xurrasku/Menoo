"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import type { RestaurantMenuDetail } from "@/lib/menus/service";
import { MenuSelector } from "./menu-selector";

type MenuViewerProps = {
  menus: RestaurantMenuDetail[];
  restaurantName: string;
  defaultMenuId?: string;
};

function MenuSection({ menu }: { menu: RestaurantMenuDetail }) {
  return (
    <div className="space-y-5 sm:space-y-6">
      {menu.categories.length === 0 ? (
        <p className="text-xs text-slate-500 sm:text-sm">
          Todavía no hay categorías publicadas en este menú.
        </p>
      ) : (
        menu.categories.map((category) => (
          <div key={category.id} className="space-y-6 sm:space-y-7">
            <h2 className="border-b border-[#1a1a1a] pb-2 font-display text-base font-bold uppercase tracking-widest text-[#1a1a1a] sm:text-lg">
              {category.name}
            </h2>
            <CategoryDishes category={category} />
          </div>
        ))
      )}
    </div>
  );
}

function CategoryDishes({ category }: { category: RestaurantMenuDetail["categories"][number] }) {
  const visibleDishes = category.dishes.filter((dish) => dish.isVisible);

  if (visibleDishes.length === 0) {
    return (
      <p className="text-xs text-slate-400 sm:text-sm">
        Próximamente añadiremos platos en esta sección.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {visibleDishes.map((dish) => (
        <article key={dish.id} className="flex gap-4 pb-5 last:pb-0 sm:gap-5 sm:pb-6">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-baseline justify-between gap-4 sm:mb-1.5">
              <h3 className="font-display text-base font-bold leading-tight tracking-tight text-[#1a1a1a] sm:text-lg">
                {dish.name}
              </h3>
              <p className="flex-shrink-0 whitespace-nowrap font-display text-base font-bold text-[#1a1a1a] sm:text-lg">
                {formatPrice(dish.price, dish.currency)}
              </p>
            </div>
            {dish.description ? (
              <p className="mb-2 text-xs leading-relaxed text-[#666666] italic sm:mb-2.5 sm:text-sm">
                {dish.description}
              </p>
            ) : null}
            {dish.labels.length > 0 ? (
              <div className="mb-1 flex flex-wrap gap-1 sm:mb-1.5 sm:gap-1.5">
                {dish.labels.map((label) => (
                  <span
                    key={`${dish.id}-${label}`}
                    className="rounded-full bg-[rgba(139,92,246,0.1)] px-2 py-0.5 text-[10px] font-semibold text-[#8b5cf6] sm:px-3 sm:py-1 sm:text-xs"
                  >
                    {label}
                  </span>
                ))}
              </div>
            ) : null}
            {dish.allergens.length > 0 ? (
              <p className="mt-2 text-[10px] italic text-[#999999] sm:mt-2.5 sm:text-xs">
                Alérgenos: {dish.allergens.join(", ")}
              </p>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function formatPrice(amount: number, currency: string) {
  const normalizedCurrency = currency && currency.trim().length > 0 ? currency : "EUR";

  try {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${normalizedCurrency}`.trim();
  }
}

export function MenuViewer({ menus, restaurantName, defaultMenuId }: MenuViewerProps) {
  // Compute the default menu selection based on props
  const defaultMenu = useMemo((): RestaurantMenuDetail | null => {
    // If there's a default menu ID in URL, select it
    if (defaultMenuId) {
      const menu = menus.find((m) => m.id === defaultMenuId);
      if (menu) {
        return menu;
      }
    }

    // If only one menu, show it directly
    if (menus.length === 1) {
      return menus[0];
    }

    // If 2+ menus, show selector (null means show selector)
    return null;
  }, [menus, defaultMenuId]);

  const [selectedMenu, setSelectedMenu] = useState<RestaurantMenuDetail | null>(defaultMenu);
  const prevDefaultMenuRef = useRef<RestaurantMenuDetail | null>(defaultMenu);

  // Update selected menu when defaultMenu changes (but only if user hasn't manually selected)
  useEffect(() => {
    // Only update if defaultMenu actually changed
    if (defaultMenu !== prevDefaultMenuRef.current) {
      prevDefaultMenuRef.current = defaultMenu;
      // Schedule state update to avoid synchronous setState in effect
      queueMicrotask(() => {
        setSelectedMenu(defaultMenu);
      });
    }
  }, [defaultMenu]);

  // If no menus, show empty state
  if (menus.length === 0) {
    return (
      <div className="space-y-6 pb-8 sm:pb-10">
        <h1 className="mb-8 font-display text-[1.875rem] font-bold uppercase leading-tight tracking-wider text-[#1a1a1a] sm:mb-10 sm:text-[2.25rem]">
          {restaurantName}
        </h1>
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 p-6 text-center shadow-sm sm:rounded-3xl sm:p-10">
          <p className="text-base font-semibold text-slate-900 sm:text-lg">
            Aún no hay menús publicados
          </p>
          <p className="mt-2 text-xs text-slate-500 sm:text-sm">
            El equipo está preparando la carta. Vuelve a consultar este enlace en unos minutos.
          </p>
        </div>
      </div>
    );
  }

  // If 2+ menus and no selection, show menu selector
  if (menus.length >= 2 && !selectedMenu) {
    return (
      <MenuSelector
        menus={menus}
        restaurantName={restaurantName}
        onSelectMenu={setSelectedMenu}
      />
    );
  }

  // Show selected menu
  if (selectedMenu) {
    return (
      <div className="space-y-6 pb-8 sm:pb-10">
        {menus.length >= 2 && (
          <button
            onClick={() => setSelectedMenu(null)}
            className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900 sm:mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a menús
          </button>
        )}
        <h1 className="mb-8 font-display text-[1.875rem] font-bold uppercase leading-tight tracking-wider text-[#1a1a1a] sm:mb-10 sm:text-[2.25rem]">
          {restaurantName}
        </h1>
        <MenuSection menu={selectedMenu} />
      </div>
    );
  }

  return null;
}

