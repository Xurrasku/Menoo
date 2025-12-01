import { getTranslations } from "next-intl/server";

import {
  SETTINGS_SECTIONS,
  type SettingsSection,
} from "./sections";

type SettingsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

type SettingsTranslator = Awaited<ReturnType<typeof getTranslations>>;

export default async function SettingsPage({
  params,
}: SettingsPageProps) {
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

  const visibleSections = SETTINGS_SECTIONS.filter((section) =>
    ["appearance", "languages", "wifi", "social"].includes(section.id)
  );

  return (
    <section>
      <div className="rounded-3xl border border-dashed border-primary/20 bg-white p-[4%] shadow-xl shadow-slate-200/60 sm:p-10 overflow-hidden">
        <header className="flex flex-col gap-[2%] sm:gap-3">
          <h2 className="text-[4.5vw] font-bold text-slate-900 sm:text-3xl">
            {tNavigation("customize")}
          </h2>
          <p className="max-w-2xl text-[2.8vw] text-slate-500 sm:text-base">
            {tSettings("subtitle")}
          </p>
        </header>

        <div className="mt-[5%] grid grid-cols-1 gap-[2.5%] md:grid-cols-2 lg:grid-cols-3 sm:mt-10 sm:gap-4">
          {visibleSections.map((section) => (
            <SettingsSectionCard key={section.id} section={section} t={tSettings} />
          ))}
        </div>
      </div>
    </section>
  );
}

function SettingsSectionCard({
  section,
  t,
}: {
  section: SettingsSection;
  t: SettingsTranslator;
}) {
  const Icon = section.icon;

  return (
    <button
      type="button"
      className="group flex flex-col gap-[2.5%] rounded-2xl border border-slate-200 bg-slate-50/60 p-[3.5%] text-left transition hover:border-primary/40 hover:bg-white hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:gap-4 sm:p-6 w-full min-w-0 overflow-hidden"
    >
      <div className="flex h-[9vw] w-[9vw] flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-12 sm:w-12">
        <Icon className="h-[4.5vw] w-[4.5vw] sm:h-6 sm:w-6" />
      </div>
      <div className="flex flex-col gap-[1.2%] sm:gap-2 min-w-0 w-full">
        <div className="flex flex-wrap items-center gap-[2%] sm:gap-3">
          <h3 className="text-[3.2vw] font-semibold text-slate-900 sm:text-lg break-words">
            {t(section.titleKey)}
          </h3>
          {section.badgeKey ? (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-[2%] py-[0.6%] text-[2vw] font-medium text-primary flex-shrink-0 sm:px-3 sm:py-0.5 sm:text-xs">
              {t(section.badgeKey)}
            </span>
          ) : null}
        </div>
        <p className="text-[2.5vw] text-slate-500 sm:text-sm break-words">
          {t(section.descriptionKey)}
        </p>
      </div>
    </button>
  );
}


