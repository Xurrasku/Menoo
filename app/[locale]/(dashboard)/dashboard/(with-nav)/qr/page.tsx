import { redirect } from "next/navigation";

import { QrBuilder } from "@/components/dashboard/qr-builder";
import { requireUser } from "@/lib/auth/server";
import { getRestaurantByOwnerId } from "@/lib/restaurants/service";
import { buildMenuUrlFromSlug } from "@/lib/restaurants/domain";

type QrPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function QrPage({ params }: QrPageProps) {
  const { locale } = await params;
  const user = await requireUser(locale);
  const restaurant = await getRestaurantByOwnerId(user.id);

  if (!restaurant) {
    redirect(`/${locale}/dashboard/restaurant`);
  }

  const menuUrl = buildMenuUrlFromSlug(restaurant.slug);

  return (
    <section className="px-4 pb-12 sm:px-12">
      <div className="mx-auto max-w-6xl">
        <QrBuilder menuUrl={menuUrl} />
      </div>
    </section>
  );
}

