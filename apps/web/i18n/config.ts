export const locales = ["ca", "es", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "es";
export const localePrefix = "always" as const;

const config = {
  locales,
  defaultLocale,
  localePrefix,
};

export default config;

