import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { eq } from "drizzle-orm";

import { restaurants } from "@/db/schema";
import { OnboardingMenuStep } from "@/components/dashboard/onboarding-menu-step";
import { OnboardingLayout } from "@/components/layouts/onboarding-layout";
import { requireUser } from "@/lib/auth/server";
import { db } from "@/lib/db";

type OnboardingMenuPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function OnboardingMenuPage({
  params,
}: OnboardingMenuPageProps) {
  const { locale } = await params;
  const user = await requireUser(locale);

  // Get user's restaurant
  if (!db) {
    redirect(`/${locale}/dashboard/restaurant?onboarding=true`);
  }

  let restaurantId: string;
  let restaurantSlug: string | undefined;
  try {
    const [userRestaurant] = await db
      .select({ 
        id: restaurants.id,
        slug: restaurants.slug,
      })
      .from(restaurants)
      .where(eq(restaurants.ownerUserId, user.id))
      .limit(1);

    if (!userRestaurant) {
      redirect(`/${locale}/dashboard/restaurant?onboarding=true`);
    }

    restaurantId = userRestaurant.id;
    restaurantSlug = userRestaurant.slug || undefined;
  } catch (error) {
    console.error("Failed to query restaurant", error);
    // In test mode, allow continuing with undefined slug
    if (!db) {
      restaurantId = "test-restaurant-id";
      restaurantSlug = undefined;
    } else {
      redirect(`/${locale}/dashboard/restaurant?onboarding=true`);
    }
  }

  const t = await getTranslations({ locale, namespace: "onboarding.menuStep" });
  const tOnboarding = await getTranslations({ locale, namespace: "onboarding" });

  const copy = {
    title: t("title"),
    subtitle: t("subtitle"),
    uploadTitle: t("uploadTitle"),
    uploadSubtitle: t("uploadSubtitle"),
    dropHere: t("dropHere"),
    clickOrDrag: t("clickOrDrag"),
    fileTypes: t("fileTypes"),
    analyzing: t("analyzing"),
    useYourData: t("useYourData"),
    useExampleData: t("useExampleData"),
    continueButton: t("continueButton"),
    backButton: tOnboarding("backButton"),
    skipButton: t("skipButton"),
    redirecting: t("redirecting"),
    errorFallback: t("errorFallback"),
  };

  return (
    <OnboardingLayout
      subtitle={t("headerSubtitle")}
      currentStep={3}
      totalSteps={4}
      stepLabels={["Restaurant", "Design", "Menu", "Enjoy"]}
    >
      <OnboardingMenuStep 
        locale={locale} 
        copy={copy} 
        restaurantId={restaurantId}
        restaurantSlug={restaurantSlug}
      />
    </OnboardingLayout>
  );
}
