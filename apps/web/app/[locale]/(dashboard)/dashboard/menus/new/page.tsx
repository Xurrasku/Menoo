import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";

import { NewMenuScreen } from "@/components/dashboard/new-menu-screen";
import { getMenuDetailMessages } from "@/lib/dashboard/menu-detail-messages";
import { requireUser } from "@/lib/auth/server";
import { getRestaurantByOwnerId } from "@/lib/restaurants/service";
import { listMenus } from "@/lib/menus/service";
import { db } from "@/lib/db";
import { visualAssets } from "@/db/schema";

type NewMenuPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function NewMenuPage({ params }: NewMenuPageProps) {
  const { locale } = await params;
  const menuMessages = await getMenuDetailMessages(locale);
  const user = await requireUser(locale);
  const restaurant = await getRestaurantByOwnerId(user.id);

  if (!restaurant) {
    redirect(`/${locale}/dashboard/restaurant`);
  }

  const menus = await listMenus(restaurant.id);

  const assets = db
    ? await db
        .select({
          id: visualAssets.id,
          imageDataUrl: visualAssets.imageDataUrl,
          originalFileName: visualAssets.originalFileName,
          createdAt: visualAssets.createdAt,
        })
        .from(visualAssets)
        .where(eq(visualAssets.restaurantId, restaurant.id))
        .orderBy(desc(visualAssets.createdAt))
        .limit(60)
    : [];

  const visualAssetPicks = assets.map((asset) => ({
    id: asset.id,
    imageDataUrl: asset.imageDataUrl,
    originalFileName: asset.originalFileName,
    createdAt: asset.createdAt.toISOString(),
  }));

  return (
    <NewMenuScreen
      locale={locale}
      menu={menuMessages}
      restaurantId={restaurant.id}
      hasExistingMenus={menus.length > 0}
      visualAssets={visualAssetPicks}
    />
  );
}
