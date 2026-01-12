import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/server";

type OnboardingLanguagesPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function OnboardingLanguagesPage({
  params,
}: OnboardingLanguagesPageProps) {
  const { locale } = await params;
  await requireUser(locale);

  // Languages step is currently disabled, redirect to enjoy page
  redirect(`/${locale}/dashboard/enjoy/onboarding`);
}
