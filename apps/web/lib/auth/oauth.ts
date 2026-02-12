import type { SupabaseClient } from "@supabase/supabase-js";

import { buildPostAuthRedirect, getAppBaseUrl, isAuthDebugEnabled } from "./config";

type OAuthProviderId = "google";

type SignInWithOAuthProviderOptions = {
  supabase: SupabaseClient;
  provider: OAuthProviderId;
  locale: string;
  redirectDestination: string;
};

export async function signInWithOAuthProvider({
  supabase,
  provider,
  locale,
  redirectDestination,
}: SignInWithOAuthProviderOptions) {
  const postAuthRedirect = buildPostAuthRedirect({
    locale,
    destination: redirectDestination,
  });

  const appBaseUrl = getAppBaseUrl();
  const callbackUrl = new URL(
    `${appBaseUrl}/${locale}/auth/callback`,
  );
  callbackUrl.searchParams.set("redirect_to", postAuthRedirect);

  if (isAuthDebugEnabled()) {
    console.info("[auth-debug] signInWithOAuthProvider", {
      provider,
      locale,
      appBaseUrl,
      postAuthRedirect,
      callbackUrl: callbackUrl.toString(),
    });
  }

  return supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: callbackUrl.toString(),
      skipBrowserRedirect: false,
    },
  });
}














