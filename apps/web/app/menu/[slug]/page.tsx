import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { getRestaurantMenus } from "@/lib/menus/service";
import { getRestaurantBySlug } from "@/lib/restaurants/service";
import { MenuViewTracker } from "@/components/analytics/menu-view-tracker";
import { MenuViewer } from "@/components/public/menu-viewer";
import { MobilePreviewWrapper } from "@/components/public/mobile-preview-wrapper";

// Force dynamic rendering to ensure menu always reflects latest database state
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  const selectedMenuId = resolvedSearchParams?.menu;

  // Restaurant must exist in database
  if (!restaurant) {
    notFound();
  }

  // Get menus from database
  let menus: Awaited<ReturnType<typeof getRestaurantMenus>> = [];
  try {
    menus = await getRestaurantMenus(restaurant.id);
  } catch (error) {
    console.error("Failed to load menus from DB", error);
  }

  // Must have at least one menu
  if (menus.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Menu not found</h1>
          <p className="mt-2 text-slate-600">This menu is not available yet.</p>
        </div>
      </div>
    );
  }

  // Check if any menu has HTML content to determine layout
  const hasHtmlMenu = menus.some((m) => m.htmlContent && m.htmlContent.trim().length > 0);

  return (
    <>
      <MenuViewTracker slug={slug} />
      <MobilePreviewWrapper hasHtmlMenu={hasHtmlMenu}>
        <div className={hasHtmlMenu 
          ? "min-h-full w-full bg-white" 
          : "flex min-h-full w-full flex-col bg-white"
        }>
          {/* Main Content */}
          <main className={hasHtmlMenu 
            ? "w-full" 
            : "flex-1 w-full px-[4%] pb-[4%] pt-[5%]"
          }>
            <MenuViewer
              menus={menus}
              restaurantName={restaurant.name}
              defaultMenuId={selectedMenuId}
            />
          </main>

          {/* Footer - only show for non-HTML menus */}
          {!hasHtmlMenu && (
            <footer className="mt-auto flex justify-end border-t border-[#e5e5e5] px-[4%] py-0">
              <Image
                src="/assets/logo.png"
                alt="Menoo"
                width={200}
                height={67}
                className="h-[10vw] w-auto max-h-16"
              />
            </footer>
          )}
        </div>
      </MobilePreviewWrapper>
    </>
  );
}



