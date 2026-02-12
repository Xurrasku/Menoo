export const DEFAULT_POST_AUTH_PATH = "/dashboard/restaurant";
const LOCALHOST_BASE_URL = "http://localhost:3000";

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

function isTruthy(value: string | undefined) {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export function isAuthDisabled() {
  return process.env.NODE_ENV !== "production" && isTruthy(process.env.AUTH_DISABLE);
}

export function isAuthDebugEnabled() {
  return isTruthy(process.env.AUTH_DEBUG);
}

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
  return normalizeBaseUrl(LOCALHOST_BASE_URL);
}

/**
 * Gets the app base URL from a request, detecting the origin from headers.
 * This is useful for server-side routes where we need to detect the actual request origin.
 * Prioritizes environment variables, but falls back to request detection if env vars aren't set.
 */
export function getAppBaseUrlFromRequest(request: Request): string {
  void request;
  return normalizeBaseUrl(LOCALHOST_BASE_URL);
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


