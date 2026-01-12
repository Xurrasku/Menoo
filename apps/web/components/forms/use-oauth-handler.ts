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
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [activeProvider, setActiveProvider] = useState<OAuthProviderId | null>(null);

  const handleOAuthSignIn = useCallback(
    async (provider: OAuthProviderId) => {
      const supabase = createSupabaseBrowserClient();

      setIsOAuthLoading(true);
      setActiveProvider(provider);
      onError(null);

      try {
        const { data, error } = await signInWithOAuthProvider({
          supabase,
          provider,
          locale,
          redirectDestination: redirectTo,
        });

        if (error) {
          onError(error.message);
          setIsOAuthLoading(false);
          setActiveProvider(null);
          return;
        }

        if (data?.url) {
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
    [fallbackErrorMessage, locale, onError, redirectTo],
  );

  return {
    isOAuthLoading,
    activeProvider,
    handleOAuthSignIn,
  };
}


