import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { cache } from "react";

import { buildPostAuthRedirect, isAuthDisabled } from "./config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type GetServerUserOptions = {
  /**
   * Route Handlers and Server Actions can persist Supabase sessions by writing
   * cookies. RSC contexts should keep this disabled to avoid Next.js warnings.
   */
  persistSession?: boolean;
};

function getLocalDevUser(): User {
  return {
    id: "local-dev-user",
    aud: "authenticated",
    role: "authenticated",
    email: "local@menoo.dev",
    email_confirmed_at: new Date(0).toISOString(),
    phone: "",
    confirmed_at: new Date(0).toISOString(),
    last_sign_in_at: new Date(0).toISOString(),
    app_metadata: {
      provider: "email",
      providers: ["email"],
    },
    user_metadata: {
      full_name: "Local Dev",
      name: "Local Dev",
    },
    identities: [],
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
    is_anonymous: false,
  } as User;
}

async function fetchServerUser(options: GetServerUserOptions = {}): Promise<User | null> {
  try {
    const supabase = await createSupabaseServerClient({
      persistSession: options.persistSession ?? false,
    });
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      if (error.message === "Auth session missing!" || error.name === "AuthSessionMissingError") {
        return null;
      }
      // Handle refresh token errors - treat as unauthenticated
      if (
        (error as { code?: string }).code === "refresh_token_not_found" ||
        error.message.includes("Refresh Token Not Found") ||
        error.message.includes("Invalid Refresh Token")
      ) {
        console.warn("Refresh token not found, treating as unauthenticated:", error.message);
        return null;
      }
      // Handle network/connection errors gracefully
      if (
        error.name === "AuthRetryableFetchError" ||
        error.message.includes("fetch failed") ||
        error.message.includes("ENOTFOUND") ||
        error.message.includes("ECONNREFUSED")
      ) {
        console.warn("Supabase connection error, treating as unauthenticated:", error.message);
        return null;
      }
      throw error;
    }

    return user;
  } catch (error) {
    // Handle any other errors (including network errors from client creation)
    if (error instanceof Error) {
      // Handle refresh token errors - treat as unauthenticated
      if (
        (error as { code?: string }).code === "refresh_token_not_found" ||
        error.message.includes("Refresh Token Not Found") ||
        error.message.includes("Invalid Refresh Token")
      ) {
        console.warn("Refresh token not found, treating as unauthenticated:", error.message);
        return null;
      }

      const isNetworkError =
        error.message.includes("fetch failed") ||
        error.message.includes("ENOTFOUND") ||
        error.message.includes("ECONNREFUSED") ||
        (error.cause instanceof Error &&
          (error.cause.message.includes("ENOTFOUND") || error.cause.message.includes("ECONNREFUSED")));

      if (isNetworkError) {
        console.warn("Supabase connection error, treating as unauthenticated:", error.message);
        return null;
      }
    }
    // Re-throw unexpected errors
    throw error;
  }
}

const getCachedServerUser = cache(async () => fetchServerUser());

export async function getServerUser(options: GetServerUserOptions = {}): Promise<User | null> {
  return fetchServerUser(options);
}

export async function requireUser(locale: string): Promise<User> {
  const user = await getCachedServerUser();

  if (user) {
    return user;
  }

  if (isAuthDisabled()) {
    return getLocalDevUser();
  }

  const headersList = await headers();
  const currentUrl = headersList.get("x-url");
  const fallbackRedirect = buildPostAuthRedirect({ locale });

  let redirectTarget = fallbackRedirect;

  if (currentUrl) {
    try {
      const { pathname } = new URL(currentUrl);
      if (pathname && pathname.length > 0) {
        redirectTarget = pathname;
      }
    } catch (error) {
      console.warn("Unable to parse current request URL for auth redirect", error);
    }
  }

  const params = new URLSearchParams();
  params.set("redirect_to", redirectTarget);

  redirect(`/${locale}/auth/sign-in?${params.toString()}`);
}


