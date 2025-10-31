import { redirect } from "next/navigation";

import { defaultLocale } from "@/i18n/routing";

type Params = {
  params: Promise<{
    locale?: string;
  }>;
};

export default async function LocaleIndex({ params }: Params) {
  const { locale } = await params;
  const targetLocale = locale ?? defaultLocale;

  redirect(`/${targetLocale}/dashboard/menus`);
}

