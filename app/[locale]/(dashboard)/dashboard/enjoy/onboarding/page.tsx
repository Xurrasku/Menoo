import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { eq } from "drizzle-orm";

import { restaurants } from "@/db/schema";
import { OnboardingEnjoyStep } from "@/components/dashboard/onboarding-enjoy-step";
import { OnboardingLayout } from "@/components/layouts/onboarding-layout";
import { requireUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { buildMenuUrlFromSlug } from "@/lib/restaurants/domain";

type OnboardingEnjoyPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function OnboardingEnjoyPage({
  params,
}: OnboardingEnjoyPageProps) {
  const { locale } = await params;
  const user = await requireUser(locale);

  // Get user's restaurant
  if (!db) {
    redirect(`/${locale}/dashboard/restaurant?onboarding=true`);
  }

  let restaurantData: { slug: string; name: string } | null = null;
  try {
    const [userRestaurant] = await db
      .select({ 
        slug: restaurants.slug,
        name: restaurants.name,
      })
      .from(restaurants)
      .where(eq(restaurants.ownerUserId, user.id))
      .limit(1);

    if (!userRestaurant) {
      redirect(`/${locale}/dashboard/restaurant?onboarding=true`);
    }

    restaurantData = userRestaurant;
  } catch (error) {
    console.error("Failed to query restaurant", error);
    redirect(`/${locale}/dashboard/restaurant?onboarding=true`);
  }

  const menuUrl = buildMenuUrlFromSlug(restaurantData.slug);

  const t = await getTranslations({ locale, namespace: "onboarding.enjoyStep" });

  const copy = {
    title: t("title"),
    subtitle: t("subtitle"),
    description: t("description"),
    scanQr: t("scanQr"),
    menuUrl: t("menuUrl"),
    goToDashboard: t("goToDashboard"),
    back: t("back"),
  };

  return (
    <OnboardingLayout
      subtitle={t("headerSubtitle")}
    >
      <OnboardingEnjoyStep 
        locale={locale} 
        copy={copy} 
        menuUrl={menuUrl}
        restaurantName={restaurantData.name}
      />
    </OnboardingLayout>
  );
}
