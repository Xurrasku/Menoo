import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { getRestaurantMenus, type RestaurantMenuDetail } from "@/lib/menus/service";
import { getRestaurantBySlug } from "@/lib/restaurants/service";
import { MenuViewTracker } from "@/components/analytics/menu-view-tracker";

type PublicMenuPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: PublicMenuPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;

  if (!slug) {
    return {
      title: "Menú no disponible | Menoo",
      description: "Esta carta todavía no está publicada.",
    };
  }

  const restaurant = await getRestaurantBySlug(slug);

  if (!restaurant) {
    return {
      title: "Menú no disponible | Menoo",
      description: "Esta carta todavía no está publicada.",
    };
  }

  return {
    title: `${restaurant.name} · Carta digital`,
    description:
      restaurant.cuisine ??
      `Consulta la carta del restaurante ${restaurant.name} con Menoo.`,
  };
}

export default async function PublicMenuPage({ params }: PublicMenuPageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;

  if (!slug) {
    notFound();
  }

  const restaurant = await getRestaurantBySlug(slug);

  if (!restaurant) {
    notFound();
  }

  const menus = await getRestaurantMenus(restaurant.id);

  return (
    <>
      <MenuViewTracker slug={slug} />
      <div className="min-h-screen w-full bg-white sm:bg-[#fafafa] sm:px-4 sm:py-6 lg:px-8 safe-area-inset">
        <div className="mx-auto flex w-full flex-col sm:max-w-[420px]">
        {/* Main Content Card */}
        <div className="flex flex-1 flex-col w-full bg-white sm:bg-white">
          <main className="flex-1 w-full px-6 pb-6 pt-8 sm:px-8 sm:pb-8 sm:pt-10">
            <h1 className="mb-8 font-display text-[1.875rem] font-bold uppercase leading-tight tracking-wider text-[#1a1a1a] sm:mb-10 sm:text-[2.25rem]">
              {restaurant.name}
            </h1>

            {menus.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 p-6 text-center shadow-sm sm:rounded-3xl sm:p-10">
                <p className="text-base font-semibold text-slate-900 sm:text-lg">
                  Aún no hay menús publicados
                </p>
                <p className="mt-2 text-xs text-slate-500 sm:text-sm">
                  El equipo está preparando la carta. Vuelve a consultar este enlace en unos minutos.
                </p>
              </div>
            ) : (
              <div className="space-y-5 sm:space-y-6">
                {menus.map((menu) => (
                  <MenuSection key={menu.id} menu={menu} />
                ))}
              </div>
            )}
          </main>

          {/* Footer */}
          <footer className="flex justify-end border-t border-[#e5e5e5] px-6 sm:px-8">
            <Image
              src="/assets/logo.png"
              alt="Menoo"
              width={200}
              height={67}
              className="h-16 w-auto sm:h-20"
            />
          </footer>
        </div>
        </div>
      </div>
    </>
  );
}

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
            <h2 className="border-b border-[#1a1a1a] pb-2 font-display text-base font-bold uppercase tracking-widest text-[#1a1a1a] sm:text-lg">{category.name}</h2>
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
    return <p className="text-xs text-slate-400 sm:text-sm">Próximamente añadiremos platos en esta sección.</p>;
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {visibleDishes.map((dish) => (
        <article key={dish.id} className="flex gap-4 pb-5 last:pb-0 sm:gap-5 sm:pb-6">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-baseline justify-between gap-4 sm:mb-1.5">
              <h3 className="font-display text-base font-bold leading-tight tracking-tight text-[#1a1a1a] sm:text-lg">{dish.name}</h3>
              <p className="flex-shrink-0 whitespace-nowrap font-display text-base font-bold text-[#1a1a1a] sm:text-lg">
                {formatPrice(dish.price, dish.currency)}
              </p>
            </div>
            {dish.description ? (
              <p className="mb-2 text-xs leading-relaxed text-[#666666] italic sm:mb-2.5 sm:text-sm">{dish.description}</p>
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


function isImageUrl(value: string) {
  return /^https?:\/\//i.test(value);
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


