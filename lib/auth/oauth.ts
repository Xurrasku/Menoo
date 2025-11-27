import type { SupabaseClient } from "@supabase/supabase-js";

import { buildPostAuthRedirect } from "./config";

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

  const callbackUrl = new URL(
    `${window.location.origin}/${locale}/auth/callback`,
  );
  callbackUrl.searchParams.set("redirect_to", postAuthRedirect);

  return supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: callbackUrl.toString(),
      skipBrowserRedirect: false,
    },
  });
}








