import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { cache } from "react";

import { buildPostAuthRedirect } from "./config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type GetServerUserOptions = {
  /**
   * Route Handlers and Server Actions can persist Supabase sessions by writing
   * cookies. RSC contexts should keep this disabled to avoid Next.js warnings.
   */
  persistSession?: boolean;
};

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


