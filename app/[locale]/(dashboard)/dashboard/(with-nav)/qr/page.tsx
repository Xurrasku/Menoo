import { QrBuilder } from "@/components/dashboard/qr-builder";
import { buildMenuUrlFromSlug } from "@/lib/restaurants/domain";
import { getDashboardSession } from "@/lib/dashboard/session";

type QrPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function QrPage({ params }: QrPageProps) {
  const { locale } = await params;
  const { restaurant } = await getDashboardSession(locale);
  const menuUrl = buildMenuUrlFromSlug(restaurant.slug);

  return (
    <section className="px-[3%] pb-[8%] sm:px-12 sm:pb-12">
      <div className="mx-auto max-w-6xl">
        <QrBuilder menuUrl={menuUrl} />
      </div>
    </section>
  );
}

