import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";

import { defaultLocale, localePrefix, locales } from "@/i18n/config";

const localeMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix,
});

const RESERVED_SEGMENTS = new Set(["menu", "api", "dashboard", "auth", "_next", "_vercel"]);

export default function middleware(request: Parameters<typeof localeMiddleware>[0]) {
  const { pathname } = request.nextUrl;
  const segments = pathname.split("/").filter(Boolean);

  if (pathname.startsWith("/menu")) {
    return NextResponse.next();
  }

  if (
    segments.length === 1 &&
    !locales.includes(segments[0] as (typeof locales)[number]) &&
    !RESERVED_SEGMENTS.has(segments[0])
  ) {
    const url = request.nextUrl.clone();
    url.pathname = `/menu/${segments[0]}`;
    return NextResponse.rewrite(url);
  }

  return localeMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};

