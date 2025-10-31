import { getTranslations } from "next-intl/server";

type StatisticsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function StatisticsPage({
  params,
}: StatisticsPageProps) {
  const { locale } = await params;
  const tNavigation = await getTranslations({
    locale,
    namespace: "navigation",
  });

  return (
    <section className="rounded-3xl border border-dashed border-primary/20 bg-white p-12 text-center shadow-xl shadow-slate-200/60">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">
        {tNavigation("statistics")}
      </p>
      <h2 className="mt-4 text-3xl font-bold text-slate-900">
        Analítica en desenvolupament
      </h2>
      <p className="mt-4 text-base text-slate-500">
        Estem treballant per oferir mètriques d{"'"}impacte, vendes i rendiment
        en temps real.
      </p>
    </section>
  );
}

