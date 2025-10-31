"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

type PostHogProviderProps = {
  children: React.ReactNode;
};

export function PostHogProvider({ children }: PostHogProviderProps) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    const client = posthog as typeof posthog & { __loaded?: boolean };

    if (client.__loaded) {
      return;
    }

    client.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
      capture_pageview: true,
    });
    client.__loaded = true;
  }, []);

  return <>{children}</>;
}

