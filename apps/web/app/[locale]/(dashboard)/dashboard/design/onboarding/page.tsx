import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { eq } from "drizzle-orm";

import { restaurants } from "@/db/schema";
import { OnboardingDesignStep } from "@/components/dashboard/onboarding-design-step";
import { OnboardingLayout } from "@/components/layouts/onboarding-layout";
import { requireUser } from "@/lib/auth/server";
import { db } from "@/lib/db";

type OnboardingDesignPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function OnboardingDesignPage({
  params,
}: OnboardingDesignPageProps) {
  const { locale } = await params;
  const user = await requireUser(locale);

  // Get user's restaurant
  if (!db) {
    redirect(`/${locale}/dashboard/restaurant?onboarding=true`);
  }

  let restaurantId: string;
  try {
    const [userRestaurant] = await db
      .select({ id: restaurants.id })
      .from(restaurants)
      .where(eq(restaurants.ownerUserId, user.id))
      .limit(1);

    if (!userRestaurant) {
      redirect(`/${locale}/dashboard/restaurant?onboarding=true`);
    }

    restaurantId = userRestaurant.id;
  } catch (error) {
    console.error("Failed to query restaurant", error);
    redirect(`/${locale}/dashboard/restaurant?onboarding=true`);
  }

  const t = await getTranslations({ locale, namespace: "onboarding" });

  const copy = {
    designUrlLabel: t("designUrlLabel"),
    designUrlPlaceholder: t("designUrlPlaceholder"),
    designUrlHelper: t("designUrlHelper"),
    designDescriptionLabel: t("designDescriptionLabel"),
    designDescriptionPlaceholder: t("designDescriptionPlaceholder"),
    designValidationError: t("designValidationError"),
    designInvalidUrl: t("designInvalidUrl"),
    nextButton: t("nextButton"),
    backButton: t("backButton"),
    skipButton: t("skipButton"),
    redirecting: t("redirecting"),
    errorFallback: t("errorFallback"),
  };

  return (
    <OnboardingLayout
      subtitle={t("headerSubtitle")}
      currentStep={2}
      totalSteps={4}
      stepLabels={["Restaurant", "Design", "Menu", "Enjoy"]}
    >
      <OnboardingDesignStep locale={locale} copy={copy} restaurantId={restaurantId} />
    </OnboardingLayout>
  );
}

