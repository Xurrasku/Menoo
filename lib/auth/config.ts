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


