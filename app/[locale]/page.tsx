import { redirect } from "next/navigation";

import { defaultLocale } from "@/i18n/routing";
import { getServerUser } from "@/lib/auth/server";

type Params = {
  params: Promise<{
    locale?: string;
  }>;
};

export default async function LocaleIndex({ params }: Params) {
  const { locale } = await params;
  const targetLocale = locale ?? defaultLocale;

  // Check if user is authenticated
  const user = await getServerUser();

  if (user) {
    // User is logged in, redirect to dashboard
    redirect(`/${targetLocale}/dashboard/restaurant`);
  } else {
    // User is not logged in, redirect to landing page
    redirect(`/${targetLocale}/landing`);
  }
}

