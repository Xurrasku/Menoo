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

  return (
    <section>
      <div className="rounded-3xl border border-dashed border-primary/20 bg-white p-10 shadow-xl shadow-slate-200/60">
        <header className="flex flex-col gap-3">
          <h2 className="text-3xl font-bold text-slate-900">
            {tNavigation("customize")}
          </h2>
          <p className="max-w-2xl text-base text-slate-500">
            {tSettings("subtitle")}
          </p>
        </header>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SETTINGS_SECTIONS.map((section) => (
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
      className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-6 text-left transition hover:border-primary/40 hover:bg-white hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-lg font-semibold text-slate-900">
            {t(section.titleKey)}
          </h3>
          {section.badgeKey ? (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
              {t(section.badgeKey)}
            </span>
          ) : null}
        </div>
        <p className="text-sm text-slate-500">
          {t(section.descriptionKey)}
        </p>
      </div>
    </button>
  );
}


