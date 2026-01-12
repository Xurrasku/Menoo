import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Check, Sparkles } from "lucide-react";

import { UpgradePlanButton } from "@/components/dashboard/upgrade-plan-button";

type BillingPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function BillingPage({ params }: BillingPageProps) {
  const { locale } = await params;
  const tBilling = await getTranslations({
    locale,
    namespace: "billing",
  });

  const features = [
    tBilling("pro.features.menus"),
    tBilling("pro.features.analytics"),
    tBilling("pro.features.qr"),
    tBilling("pro.features.support"),
  ];

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-10">
      <header className="flex flex-col gap-3">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          <Sparkles className="h-4 w-4" />
          {tBilling("pro.name")}
        </span>
        <h1 className="text-4xl font-bold text-slate-900">
          {tBilling("page.title")}
        </h1>
        <p className="max-w-2xl text-base text-slate-500">
          {tBilling("page.subtitle")}
        </p>
      </header>

      <div className="rounded-3xl border border-primary/20 bg-white p-10 shadow-xl shadow-primary/10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <h2 className="text-4xl font-bold text-slate-900">
              {tBilling("pro.price")}
            </h2>
            <p className="text-sm text-slate-500">
              {tBilling("pro.description")}
            </p>
          </div>
          <UpgradePlanButton
            locale={locale}
            label={tBilling("pro.cta")}
            loadingLabel={tBilling("pro.loading")}
            priceLabel={tBilling("pro.price")}
            errorLabel={tBilling("pro.error")}
            returnPath="/dashboard/billing"
            fullWidth
            align="stacked"
            className="w-full justify-between rounded-2xl bg-primary px-6 py-4 text-base font-semibold text-white shadow-lg shadow-primary/30 transition hover:bg-primary/90 md:w-auto"
          />
        </div>

        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 rounded-2xl bg-primary/5 p-4 text-sm text-slate-700">
              <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Check className="h-3.5 w-3.5" />
              </span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500">
        <span>{tBilling("page.finePrint")}</span>
        <Link
          href={`/${locale}/dashboard/settings`}
          className="font-semibold text-primary hover:text-primary/80"
        >
          {tBilling("page.backToSettings")}
        </Link>
      </footer>
    </section>
  );
}

