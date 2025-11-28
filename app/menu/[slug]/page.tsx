import Image from "next/image";
import type { Metadata } from "next";
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
      <div className="min-h-screen bg-[#e7e7e7] px-3 py-4 sm:px-4 sm:py-6 lg:px-8 safe-area-inset">
        <div className="mx-auto flex w-full max-w-[420px] flex-col">
        {/* Hero Image Section */}
        <header className="relative h-[200px] overflow-hidden rounded-t-[24px] sm:h-[220px] sm:rounded-t-[28px]">
          <Image
            src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80"
            alt={`${restaurant.name} - Carta digital`}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 640px) 100vw, 420px"
            quality={85}
          />
        </header>

        {/* Main Content Card */}
        <div className="flex flex-1 flex-col rounded-b-[24px] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.12)] sm:rounded-b-[28px]">
          <main className="flex-1 px-4 pb-4 pt-5 sm:px-[22px] sm:pb-[18px] sm:pt-6">
            <h1 className="mb-4 text-[1.5rem] font-semibold lowercase leading-tight tracking-[0.01em] text-[#1f1f1f] sm:mb-5 sm:text-[1.65rem]">
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
          <footer className="flex items-center gap-2 border-t border-[rgba(15,23,42,0.06)] px-4 pb-4 pt-4 sm:gap-2.5 sm:px-6 sm:pb-6 sm:pt-5">
            <div className="flex items-center gap-2 text-xs font-medium text-[#6b21a8] sm:gap-2.5 sm:text-sm">
              <span
                className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-[#6b21a8] sm:h-6 sm:w-6"
                aria-hidden="true"
              >
                <svg viewBox="0 0 24 24" className="h-3 w-3 fill-white sm:h-4 sm:w-4">
                  <circle cx="10" cy="10" r="3" />
                  <circle cx="14" cy="10" r="3" />
                  <circle cx="10" cy="14" r="3" />
                  <circle cx="14" cy="14" r="3" />
                </svg>
              </span>
              Hecho con Menoo
            </div>
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
          <div key={category.id} className="space-y-3 sm:space-y-4">
            <h2 className="text-base font-semibold text-[#1f1f1f] sm:text-[1.1rem]">{category.name}</h2>
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
        <article key={dish.id} className="flex gap-3 border-b border-[rgba(15,23,42,0.08)] pb-3 last:border-b-0 sm:gap-3.5 sm:pb-4">
          <DishThumbnail thumbnail={dish.thumbnail} name={dish.name} />
          <div className="min-w-0 flex-1">
            <h3 className="mb-0.5 text-sm font-semibold leading-tight text-[#1f1f1f] sm:mb-1 sm:text-[1.04rem]">{dish.name}</h3>
            {dish.description ? (
              <p className="mb-1.5 text-xs leading-[1.4] text-[#5d6368] sm:mb-2 sm:text-sm">{dish.description}</p>
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
              <p className="text-[10px] font-medium leading-tight text-[#ef4444] sm:text-xs">
                Alérgenos: {dish.allergens.join(", ")}
              </p>
            ) : null}
          </div>
          <div className="flex-shrink-0">
            <p className="mt-0.5 whitespace-nowrap text-sm font-semibold text-[#1f1f1f] sm:mt-1 sm:text-base">
              {formatPrice(dish.price, dish.currency)}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}

function DishThumbnail({ thumbnail, name }: { thumbnail: string; name: string }) {
  if (thumbnail && isImageUrl(thumbnail)) {
    return (
      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-[rgba(15,23,42,0.06)] bg-[#f1f5f9] sm:h-14 sm:w-14 sm:rounded-2xl">
        <Image
          src={thumbnail}
          alt={name}
          width={56}
          height={56}
          className="h-full w-full object-cover"
          loading="lazy"
          sizes="48px"
          quality={75}
        />
      </div>
    );
  }

  return (
    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-[rgba(15,23,42,0.06)] bg-[#f1f5f9] text-xl sm:h-14 sm:w-14 sm:rounded-2xl sm:text-2xl">
      {thumbnail || "🍽️"}
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


