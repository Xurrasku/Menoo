import { getRequestConfig } from "next-intl/server";

import { defaultLocale, locales, type Locale } from "./config";

export default getRequestConfig(async ({ locale }) => {
  const currentLocale = locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale;

  return {
    locale: currentLocale,
    messages: (await import(`../messages/${currentLocale}.json`)).default,
  };
});

