import { NextResponse } from "next/server";

import {
  buildPostAuthRedirect,
  getAppBaseUrlFromRequest,
  isAuthDebugEnabled,
} from "@/lib/auth/config";
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
  const redirectTarget =
    process.env.NODE_ENV !== "production"
      ? `/${locale}/dashboard/settings`
      : redirectToParam && redirectToParam.length > 0
        ? redirectToParam
        : buildPostAuthRedirect({ locale });

  // Use public app base URL, detecting from request headers if env vars aren't set
  // This ensures redirects go to the correct domain even after 2FA confirmation
  const appBaseUrl = getAppBaseUrlFromRequest(request);

  if (isAuthDebugEnabled()) {
    console.info("[auth-debug] callback:entry", {
      requestUrl: requestUrl.toString(),
      locale,
      hasCode: Boolean(code),
      errorDescription,
      redirectToParam,
      redirectTarget,
      appBaseUrl,
    });
  }

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

    const nextUrl = new URL(redirectTarget, appBaseUrl);
    if (isAuthDebugEnabled()) {
      console.info("[auth-debug] callback:success-redirect", {
        target: nextUrl.toString(),
      });
    }
    return NextResponse.redirect(nextUrl);
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


