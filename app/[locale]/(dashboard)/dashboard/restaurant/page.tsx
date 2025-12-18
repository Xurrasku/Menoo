import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { eq } from "drizzle-orm";

import { restaurants } from "@/db/schema";
import { RestaurantSetupForm } from "@/components/dashboard/restaurant-setup-form";
import { OnboardingForm } from "@/components/dashboard/onboarding-form";
import { OnboardingLayout } from "@/components/layouts/onboarding-layout";
import { requireUser } from "@/lib/auth/server";
import { db } from "@/lib/db";

type RestaurantSetupPageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    test?: string;
    onboarding?: string;
  }>;
};

export default async function RestaurantSetupPage({
  params,
  searchParams,
}: RestaurantSetupPageProps) {
  const { locale } = await params;
  const { test, onboarding } = await searchParams;
  const user = await requireUser(locale);

  // Check if test mode or onboarding mode is enabled
  const useOnboarding = test === "true" || onboarding === "true";

  // Only check for existing restaurant if NOT in test/onboarding mode
  // In test mode, we want to show onboarding even if restaurant exists
  if (db && !useOnboarding) {
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

  if (useOnboarding) {
    const t = await getTranslations({ locale, namespace: "onboarding" });

    const copy = {
      title: t("title"),
      subtitle: t("subtitle"),
      step1Title: t("step1Title"),
      step1Subtitle: t("step1Subtitle"),
      step2Title: t("step2Title"),
      step2Subtitle: t("step2Subtitle"),
      nameLabel: t("nameLabel"),
      namePlaceholder: t("namePlaceholder"),
      urlLabel: t("urlLabel"),
      urlPlaceholder: t("urlPlaceholder"),
      urlHelper: t("urlHelper", { defaultValue: "" }),
      checkingAvailability: t("checkingAvailability"),
      urlAvailable: t("urlAvailable"),
      urlUnavailable: t("urlUnavailable"),
      sizeLabel: t("sizeLabel"),
      sizePlaceholder: t("sizePlaceholder"),
      sizeSmall: t("sizeSmall"),
      sizeMedium: t("sizeMedium"),
      sizeLarge: t("sizeLarge"),
      sizeMaxi: t("sizeMaxi"),
      referralLabel: t("referralLabel"),
      referralPlaceholder: t("referralPlaceholder"),
      referralGoogle: t("referralGoogle"),
      referralSocial: t("referralSocial"),
      referralFriend: t("referralFriend"),
      referralOtherRestaurant: t("referralOtherRestaurant"),
      referralOther: t("referralOther"),
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
      submitCta: t("submitCta"),
      redirecting: t("redirecting"),
      success: t("success"),
      errorFallback: t("errorFallback"),
    } satisfies Parameters<typeof OnboardingForm>[0]["copy"];

    return (
      <OnboardingLayout
        subtitle={t("headerSubtitle")}
        showTestBanner={test === "true" || onboarding === "true"}
      >
        <OnboardingForm locale={locale} copy={copy} />
      </OnboardingLayout>
    );
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
    <OnboardingLayout
      subtitle={t("subtitle")}
    >
      <RestaurantSetupForm locale={locale} copy={copy} />
    </OnboardingLayout>
  );
}

