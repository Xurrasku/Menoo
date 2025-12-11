import { getTranslations } from "next-intl/server";
import { getDashboardSession } from "@/lib/dashboard/session";
import { listMenus } from "@/lib/menus/service";
import { AppearanceCustomizer } from "@/components/settings/appearance-customizer";

type AppearancePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AppearancePage({ params }: AppearancePageProps) {
  const { locale } = await params;
  const [tNavigation, tSettings] = await Promise.all([
    getTranslations({
      locale,
      namespace: "navigation",
    }),
    getTranslations({
      locale,
      namespace: "settings",
    }),
  ]);

  const { restaurant } = await getDashboardSession(locale);
  const menus = await listMenus(restaurant.id);

  return (
    <section>
      <div className="rounded-3xl border border-dashed border-primary/20 bg-white p-[4%] shadow-xl shadow-slate-200/60 sm:p-10 overflow-hidden">
        <header className="flex flex-col gap-[2%] sm:gap-3 mb-[5%] sm:mb-10">
          <h2 className="text-[4.5vw] font-bold text-slate-900 sm:text-3xl">
            {tSettings("sections.appearance.title")}
          </h2>
          <p className="max-w-2xl text-[2.8vw] text-slate-500 sm:text-base">
            {tSettings("sections.appearance.description")}
          </p>
        </header>

        <AppearanceCustomizer locale={locale} menus={menus} />
      </div>
    </section>
  );
}

