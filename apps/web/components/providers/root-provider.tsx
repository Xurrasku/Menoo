"use client";

import type { ReactNode } from "react";

import { PostHogProvider } from "./posthog-provider";

type RootProviderProps = {
  children: ReactNode;
};

export function RootProvider({ children }: RootProviderProps) {
  return <PostHogProvider>{children}</PostHogProvider>;
}

