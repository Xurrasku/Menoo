import { QrBuilder } from "@/components/dashboard/qr-builder";

type QrPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function QrPage({ params }: QrPageProps) {
  const { locale } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://menoo.app";
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const menuUrl = `${normalizedBaseUrl}/${locale}/menu/demo`;

  return (
    <section className="px-4 pb-12 sm:px-12">
      <div className="mx-auto max-w-6xl">
        <QrBuilder menuUrl={menuUrl} />
      </div>
    </section>
  );
}

