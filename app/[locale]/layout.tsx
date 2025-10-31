import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { type Locale, locales } from "@/i18n/routing";

type Props = {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Props) {
  const { locale } = await params;
  const normalizedLocale = locales.includes(locale as Locale)
    ? (locale as Locale)
    : null;

  if (!normalizedLocale) {
    notFound();
  }

  const messages = await getMessages({ locale: normalizedLocale });

  return (
    <NextIntlClientProvider locale={normalizedLocale} messages={messages} timeZone="Europe/Madrid">
      {children}
    </NextIntlClientProvider>
  );
}

