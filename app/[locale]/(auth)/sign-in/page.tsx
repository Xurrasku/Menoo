import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { SignInForm } from "@/components/forms/sign-in-form";

type SignInPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function SignInPage({ params }: SignInPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.signIn" });

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-10 shadow-xl">
        <div className="mb-8 space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <SignInForm locale={locale} />

        <p className="mt-8 text-center text-sm text-muted-foreground">
          {t("cta")} {" "}
          <Link
            href={`/${locale}/auth/sign-up`}
            className="font-semibold text-primary hover:text-primary/80"
          >
            {t("ctaLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}

