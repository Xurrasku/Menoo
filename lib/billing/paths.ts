const DEFAULT_LOCALE = "en";

function sanitizeLocale(locale: string | undefined | null) {
  if (!locale) return DEFAULT_LOCALE;

  const cleaned = locale.replace(/[^a-zA-Z-]/g, "").trim();

  if (!cleaned) {
    return DEFAULT_LOCALE;
  }

  const isValid = /^[a-zA-Z]{2}(?:-[a-zA-Z]{2})?$/.test(cleaned);

  if (!isValid) {
    return DEFAULT_LOCALE;
  }

  return cleaned;
}

export function getBillingPagePath(locale: string) {
  const sanitizedLocale = sanitizeLocale(locale);

  return `/${sanitizedLocale}/dashboard/billing`;
}

export function getBillingPageUrl(baseUrl: string, locale: string) {
  const normalizedBaseUrl = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;

  return `${normalizedBaseUrl}${getBillingPagePath(locale)}`;
}


