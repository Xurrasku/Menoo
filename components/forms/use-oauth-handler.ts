"use client";

import { useCallback, useState } from "react";

import { signInWithOAuthProvider } from "@/lib/auth/oauth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type OAuthProviderId = "google";

type UseOAuthHandlerOptions = {
  locale: string;
  redirectTo: string;
  onError: (message: string | null) => void;
  fallbackErrorMessage: string;
};

type UseOAuthHandlerResult = {
  isOAuthLoading: boolean;
  activeProvider: OAuthProviderId | null;
  handleOAuthSignIn: (provider: OAuthProviderId) => Promise<void>;
};

export function useOAuthHandler({
  locale,
  redirectTo,
  onError,
  fallbackErrorMessage,
}: UseOAuthHandlerOptions): UseOAuthHandlerResult {
  const authDebugEnabled =
    process.env.NEXT_PUBLIC_AUTH_DEBUG?.toLowerCase() === "1" ||
    process.env.NEXT_PUBLIC_AUTH_DEBUG?.toLowerCase() === "true";
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [activeProvider, setActiveProvider] = useState<OAuthProviderId | null>(null);

  const handleOAuthSignIn = useCallback(
    async (provider: OAuthProviderId) => {
      const supabase = createSupabaseBrowserClient();

      setIsOAuthLoading(true);
      setActiveProvider(provider);
      onError(null);

      try {
        if (authDebugEnabled) {
          console.info("[auth-debug] handleOAuthSignIn:start", {
            provider,
            locale,
            redirectTo,
            origin: window.location.origin,
          });
        }

        const { data, error } = await signInWithOAuthProvider({
          supabase,
          provider,
          locale,
          redirectDestination: redirectTo,
        });

        if (authDebugEnabled) {
          console.info("[auth-debug] handleOAuthSignIn:response", {
            error: error?.message ?? null,
            dataUrl: data?.url ?? null,
          });
        }

        if (error) {
          onError(error.message);
          setIsOAuthLoading(false);
          setActiveProvider(null);
          return;
        }

        if (data?.url) {
          if (authDebugEnabled) {
            console.info("[auth-debug] handleOAuthSignIn:window.location.assign", {
              target: data.url,
            });
          }
          window.location.assign(data.url);
          return;
        }

        setIsOAuthLoading(false);
        setActiveProvider(null);
        onError(fallbackErrorMessage);
      } catch (error) {
        setIsOAuthLoading(false);
        setActiveProvider(null);
        onError(error instanceof Error ? error.message : fallbackErrorMessage);
      }
    },
    [authDebugEnabled, fallbackErrorMessage, locale, onError, redirectTo],
  );

  return {
    isOAuthLoading,
    activeProvider,
    handleOAuthSignIn,
  };
}


