import { getTranslations } from "next-intl/server";
import { ChevronRight, Flame } from "lucide-react";

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

const PREVIEW_ITEMS: Array<{
  id: "caprese" | "gazpacho" | "onionRings";
  price: string;
  isSpicy?: boolean;
}> = [
  { id: "caprese", price: "12,00 €", isSpicy: true },
  { id: "gazpacho", price: "9,00 €" },
  { id: "onionRings", price: "8,00 €" },
];

export default async function SettingsPage({
  params,
}: SettingsPageProps) {
  const { locale } = await params;
  const tNavigation = await getTranslations({
    locale,
    namespace: "navigation",
  });
  const tSettings = await getTranslations({
    locale,
    namespace: "settings",
  });

  return (
    <section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="rounded-3xl border border-dashed border-primary/20 bg-white p-10 shadow-xl shadow-slate-200/60">
        <header className="flex flex-col gap-3">
          <h2 className="text-3xl font-bold text-slate-900">
            {tNavigation("settings")}
          </h2>
          <p className="max-w-2xl text-base text-slate-500">
            {tSettings("subtitle")}
          </p>
        </header>

        <div className="mt-10 space-y-4">
          {SETTINGS_SECTIONS.map((section) => (
            <SettingsSectionRow key={section.id} section={section} t={tSettings} />
          ))}
        </div>
      </div>

      <div className="hidden items-center justify-center lg:flex">
        <SettingsPreview t={tSettings} />
      </div>
    </section>
  );
}

function SettingsSectionRow({
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
      className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-6 text-left transition hover:border-primary/40 hover:bg-white hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <div>
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
          <p className="mt-1 text-sm text-slate-500">
            {t(section.descriptionKey)}
          </p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:text-primary" />
    </button>
  );
}

function SettingsPreview({ t }: { t: SettingsTranslator }) {
  const items = PREVIEW_ITEMS.map((item) => ({
    ...item,
    name: t(`preview.items.${item.id}.name`),
    description: t(`preview.items.${item.id}.description`),
  }));

  return (
    <div className="relative mx-auto w-full max-w-[320px] rounded-[38px] bg-slate-900/95 p-4 shadow-[0_40px_120px_rgba(15,23,42,0.45)]">
      <div className="flex h-full flex-col rounded-[30px] bg-white">
        <div className="relative overflow-hidden rounded-t-[30px]">
          <div className="h-32 bg-gradient-to-br from-emerald-500 via-lime-400 to-amber-400" />
          <div className="absolute inset-x-0 top-4 flex justify-center">
            <span className="rounded-full bg-black/50 px-4 py-1 text-xs font-medium text-white">
              {t("preview.time")}
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col px-6 pb-6 pt-5">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">
              {t("preview.restaurant")}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {t("preview.section")}
            </p>
          </div>

          <ul className="mt-5 space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {item.name}
                    </p>
                    {item.isSpicy ? (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                        <Flame className="h-3 w-3" />
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.description}
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {item.price}
                </span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="mt-6 w-full rounded-full bg-slate-900 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/60"
          >
            {t("preview.cta")}
          </button>
        </div>
      </div>
    </div>
  );
}

