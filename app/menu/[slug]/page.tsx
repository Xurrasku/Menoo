import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getRestaurantMenus, type RestaurantMenuDetail } from "@/lib/menus/service";
import { getRestaurantBySlug } from "@/lib/restaurants/service";

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
    <div className="min-h-screen bg-[#e7e7e7] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[420px] flex-col">
        {/* Hero Image Section */}
        <header className="relative h-[220px] overflow-hidden rounded-t-[28px] sm:h-[240px]">
          <Image
            src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80"
            alt={`${restaurant.name} - Carta digital`}
            fill
            className="object-cover"
            priority
            unoptimized
          />
        </header>

        {/* Main Content Card */}
        <div className="flex flex-1 flex-col rounded-b-[28px] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
          <main className="flex-1 px-[22px] pb-[18px] pt-6">
            <h1 className="mb-5 text-[1.65rem] font-semibold lowercase leading-tight tracking-[0.01em] text-[#1f1f1f]">
              {restaurant.name}
            </h1>

            {menus.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-10 text-center shadow-sm">
                <p className="text-lg font-semibold text-slate-900">
                  Aún no hay menús publicados
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  El equipo está preparando la carta. Vuelve a consultar este enlace en unos minutos.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {menus.map((menu) => (
                  <MenuSection key={menu.id} menu={menu} />
                ))}
              </div>
            )}
          </main>

          {/* Footer */}
          <footer className="flex items-center gap-2.5 border-t border-[rgba(15,23,42,0.06)] px-6 pb-6 pt-5">
            <div className="flex items-center gap-2.5 text-sm font-medium text-[#6b21a8]">
              <span
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-[#6b21a8]"
                aria-hidden="true"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white">
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
  );
}

function MenuSection({ menu }: { menu: RestaurantMenuDetail }) {
  return (
    <div className="space-y-6">
      {menu.categories.length === 0 ? (
        <p className="text-sm text-slate-500">
          Todavía no hay categorías publicadas en este menú.
        </p>
      ) : (
        menu.categories.map((category) => (
          <div key={category.id} className="space-y-4">
            <h2 className="text-[1.1rem] font-semibold text-[#1f1f1f]">{category.name}</h2>
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
    return <p className="text-sm text-slate-400">Próximamente añadiremos platos en esta sección.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {visibleDishes.map((dish) => (
        <article key={dish.id} className="flex gap-3.5 border-b border-[rgba(15,23,42,0.08)] pb-4 last:border-b-0">
          <DishThumbnail thumbnail={dish.thumbnail} name={dish.name} />
          <div className="min-w-0 flex-1">
            <h3 className="mb-1 text-[1.04rem] font-semibold text-[#1f1f1f]">{dish.name}</h3>
            {dish.description ? (
              <p className="mb-2 text-sm leading-[1.4] text-[#5d6368]">{dish.description}</p>
            ) : null}
            {dish.labels.length > 0 ? (
              <div className="mb-1.5 flex flex-wrap gap-1.5">
                {dish.labels.map((label) => (
                  <span
                    key={`${dish.id}-${label}`}
                    className="rounded-full bg-[rgba(139,92,246,0.1)] px-3 py-1 text-xs font-semibold text-[#8b5cf6]"
                  >
                    {label}
                  </span>
                ))}
              </div>
            ) : null}
            {dish.allergens.length > 0 ? (
              <p className="text-xs font-medium text-[#ef4444]">
                Alérgenos: {dish.allergens.join(", ")}
              </p>
            ) : null}
          </div>
          <div className="flex-shrink-0">
            <p className="mt-1 whitespace-nowrap text-base font-semibold text-[#1f1f1f]">
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
      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl border border-[rgba(15,23,42,0.06)] bg-[#f1f5f9]">
        <Image
          src={thumbnail}
          alt={name}
          width={56}
          height={56}
          className="h-full w-full object-cover"
          loading="lazy"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-[rgba(15,23,42,0.06)] bg-[#f1f5f9] text-2xl">
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


