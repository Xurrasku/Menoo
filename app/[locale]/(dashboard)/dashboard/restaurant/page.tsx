import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { eq } from "drizzle-orm";

import { restaurants } from "@/db/schema";
import { RestaurantSetupForm } from "@/components/dashboard/restaurant-setup-form";
import { requireUser } from "@/lib/auth/server";
import { db } from "@/lib/db";

type RestaurantSetupPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function RestaurantSetupPage({ params }: RestaurantSetupPageProps) {
  const { locale } = await params;
  const user = await requireUser(locale);

  if (db) {
    try {
      const [existingRestaurant] = await db
        .select({ id: restaurants.id })
        .from(restaurants)
        .where(eq(restaurants.ownerUserId, user.id))
        .limit(1);

      if (existingRestaurant) {
        redirect(`/${locale}/dashboard/menus`);
      }
    } catch (error) {
      // Re-throw redirect errors - they're expected behavior, not actual errors
      if (
        error instanceof Error &&
        (error.message === "NEXT_REDIRECT" ||
          (error as { digest?: string }).digest?.startsWith("NEXT_REDIRECT"))
      ) {
        throw error;
      }
      console.error("Failed to query restaurants", error);
    }
  }

  const t = await getTranslations({ locale, namespace: "restaurantOnboarding" });

  const copy = {
    title: t("title"),
    subtitle: t("subtitle"),
    nameLabel: t("nameLabel"),
    namePlaceholder: t("namePlaceholder"),
    cuisineLabel: t("cuisineLabel"),
    addressLabel: t("addressLabel"),
    submitCta: t("submitCta"),
    domainPreviewLabel: t("domainPreviewLabel"),
    redirecting: t("redirecting"),
    success: t("success"),
    errorFallback: t("errorFallback"),
  } satisfies Parameters<typeof RestaurantSetupForm>[0]["copy"];

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-16">
      <div className="w-full max-w-2xl space-y-10 rounded-3xl border border-slate-200 bg-white p-12 shadow-2xl shadow-slate-200/60">
        <div className="space-y-3 text-center">
          <h1 className="text-3xl font-semibold text-slate-900">{copy.title}</h1>
          <p className="text-sm text-slate-500">{copy.subtitle}</p>
        </div>

        <RestaurantSetupForm locale={locale} copy={copy} />
      </div>
    </div>
  );
}

