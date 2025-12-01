import { NextResponse } from "next/server";

import { buildPostAuthRedirect, getAppBaseUrl } from "@/lib/auth/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const redirectToParam = requestUrl.searchParams.get("redirect_to");
  const redirectTarget = redirectToParam && redirectToParam.length > 0
    ? redirectToParam
    : buildPostAuthRedirect({ locale });

  // Use public app base URL instead of request.url to ensure redirects go to public domain
  const appBaseUrl = getAppBaseUrl();

  if (errorDescription) {
    const params = new URLSearchParams({
      error: errorDescription,
      redirect_to: redirectTarget,
    });

    return NextResponse.redirect(
      new URL(`/${locale}/auth/sign-in?${params.toString()}`, appBaseUrl),
    );
  }

  if (!code) {
    const params = new URLSearchParams({
      error: "Missing authorization code.",
      redirect_to: redirectTarget,
    });

    return NextResponse.redirect(
      new URL(`/${locale}/auth/sign-in?${params.toString()}`, appBaseUrl),
    );
  }

  try {
    const supabase = await createSupabaseServerClient({ persistSession: true });
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      // Handle network/connection errors gracefully
      const isNetworkError =
        error.name === "AuthRetryableFetchError" ||
        error.message.includes("fetch failed") ||
        error.message.includes("ENOTFOUND") ||
        error.message.includes("ECONNREFUSED");

      const errorMessage = isNetworkError
        ? "Unable to connect to authentication service. Please try again later."
        : error.message;

      const params = new URLSearchParams({
        error: errorMessage,
        redirect_to: redirectTarget,
      });

      return NextResponse.redirect(
        new URL(`/${locale}/auth/sign-in?${params.toString()}`, appBaseUrl),
      );
    }

    return NextResponse.redirect(new URL(redirectTarget, appBaseUrl));
  } catch (error) {
    // Handle any other errors (including network errors from client creation)
    const isNetworkError =
      error instanceof Error &&
      (error.message.includes("fetch failed") ||
        error.message.includes("ENOTFOUND") ||
        error.message.includes("ECONNREFUSED") ||
        (error.cause instanceof Error &&
          (error.cause.message.includes("ENOTFOUND") || error.cause.message.includes("ECONNREFUSED"))));

    const errorMessage = isNetworkError
      ? "Unable to connect to authentication service. Please try again later."
      : error instanceof Error
        ? error.message
        : "An unexpected error occurred.";

    const params = new URLSearchParams({
      error: errorMessage,
      redirect_to: redirectTarget,
    });

    return NextResponse.redirect(
      new URL(`/${locale}/auth/sign-in?${params.toString()}`, appBaseUrl),
    );
  }
}


