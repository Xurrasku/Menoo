import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { SignUpForm } from "@/components/forms/sign-up-form";

type SignUpPageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams?: Promise<{
    redirect_to?: string;
    error?: string;
  }>;
};

export default async function SignUpPage({ params, searchParams }: SignUpPageProps) {
  const { locale } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const redirectParam = resolvedSearchParams.redirect_to;
  const redirectTo = redirectParam && redirectParam.length > 0
    ? redirectParam
    : "/dashboard/restaurant";
  const initialError = resolvedSearchParams.error ?? null;
  const t = await getTranslations({ locale, namespace: "auth.signUp" });

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-10 shadow-xl">
        <div className="mb-8 space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <SignUpForm locale={locale} redirectTo={redirectTo} initialError={initialError} />

        <p className="mt-8 text-center text-sm text-muted-foreground">
          {t("cta")}{" "}
          <Link
            href={`/${locale}/auth/sign-in`}
            className="font-semibold text-primary hover:text-primary/80"
          >
            {t("ctaLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}


