export const DEFAULT_POST_AUTH_PATH = "/dashboard/restaurant";

export type AuthStrategy = "password" | "oauth";

export type AuthProviderConfig = {
  id: "google";
  strategy: AuthStrategy;
  labelKey: string;
};

export const AUTH_PROVIDERS: AuthProviderConfig[] = [
  {
    id: "google",
    strategy: "oauth",
    labelKey: "auth.providers.google",
  },
];

function normalizeBaseUrl(base: string) {
  return base.trim().replace(/\/+$/, "");
}

/**
 * Gets the public app base URL for OAuth callbacks.
 * Checks environment variables in order of priority:
 * 1. NEXT_PUBLIC_SITE_URL
 * 2. NEXT_PUBLIC_APP_URL
 * 3. NEXT_PUBLIC_VERCEL_URL (with https:// prefix)
 * 4. VERCEL_URL (with https:// prefix)
 * Falls back to https://menoo.app if none are set.
 */
export function getAppBaseUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : undefined,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ];

  for (const candidate of candidates) {
    if (candidate && candidate.trim().length > 0) {
      return normalizeBaseUrl(candidate);
    }
  }

  return normalizeBaseUrl("https://menoo.app");
}

type BuildPostAuthRedirectOptions = {
  locale: string;
  destination?: string;
};

export function buildPostAuthRedirect({
  locale,
  destination = DEFAULT_POST_AUTH_PATH,
}: BuildPostAuthRedirectOptions) {
  const normalizedDestination = destination.startsWith("/")
    ? destination
    : `/${destination}`;

  const localePrefix = `/${locale}`;

  if (normalizedDestination.startsWith(localePrefix)) {
    return normalizedDestination;
  }

  return `${localePrefix}${normalizedDestination}`;
}


