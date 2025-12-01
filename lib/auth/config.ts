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

/**
 * Gets the app base URL from a request, detecting the origin from headers.
 * This is useful for server-side routes where we need to detect the actual request origin.
 * Prioritizes environment variables, but falls back to request detection if env vars aren't set.
 */
export function getAppBaseUrlFromRequest(request: Request): string {
  // First try environment variables
  const envBaseUrl = getAppBaseUrl();
  
  // If we got a non-default value from env vars, use it (even if request is localhost)
  // This ensures we redirect to public domain even if callback came to localhost
  if (envBaseUrl !== "https://menoo.app") {
    return envBaseUrl;
  }

  // Otherwise, try to detect from request headers
  // This handles cases where env vars aren't set but we can detect the actual domain
  try {
    const url = new URL(request.url);
    const host = request.headers.get("x-forwarded-host") || 
                 request.headers.get("host") || 
                 url.host;
    
    if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
      // Only use detected host if it's not localhost
      // Use https for non-localhost domains
      const detectedUrl = `https://${host}`;
      return normalizeBaseUrl(detectedUrl);
    }
  } catch (error) {
    // If detection fails, fall back to env-based URL
    console.warn("Failed to detect base URL from request headers:", error);
  }

  return envBaseUrl;
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


