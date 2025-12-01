import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { getRestaurantMenus } from "@/lib/menus/service";
import { getRestaurantBySlug } from "@/lib/restaurants/service";
import { MenuViewTracker } from "@/components/analytics/menu-view-tracker";
import { MenuViewer } from "@/components/public/menu-viewer";

type PublicMenuPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    menu?: string;
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

export default async function PublicMenuPage({ params, searchParams }: PublicMenuPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const slug = resolvedParams?.slug;

  if (!slug) {
    notFound();
  }

  const restaurant = await getRestaurantBySlug(slug);

  if (!restaurant) {
    notFound();
  }

  const menus = await getRestaurantMenus(restaurant.id);
  const selectedMenuId = resolvedSearchParams?.menu;

  return (
    <>
      <MenuViewTracker slug={slug} />
      <div className="flex min-h-screen w-full flex-col bg-white sm:bg-[#fafafa] sm:px-4 sm:py-6 lg:px-8 safe-area-inset">
        <div className="mx-auto flex w-full flex-1 flex-col sm:max-w-[420px]">
        {/* Main Content Card */}
        <div className="flex min-h-screen flex-1 flex-col w-full bg-white sm:bg-white sm:min-h-0">
          <main className="flex-1 w-full px-[4%] pb-[4%] pt-[5%] sm:px-8 sm:pb-8 sm:pt-10">
            <MenuViewer
              menus={menus}
              restaurantName={restaurant.name}
              defaultMenuId={selectedMenuId}
            />
          </main>

          {/* Footer */}
          <footer className="mt-auto flex justify-end border-t border-[#e5e5e5] px-[4%] py-0 sm:px-8 sm:py-0">
            <Image
              src="/assets/logo.png"
              alt="Menoo"
              width={200}
              height={67}
              className="h-[10vw] w-auto sm:h-20"
            />
          </footer>
        </div>
        </div>
      </div>
    </>
  );
}



