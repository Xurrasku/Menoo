import assert from "node:assert/strict";
import test from "node:test";

import { AUTH_PROVIDERS, buildPostAuthRedirect, getAppBaseUrl } from "../lib/auth/config";

test("google provider is registered", () => {
  const googleProvider = AUTH_PROVIDERS.find((provider) => provider.id === "google");

  assert.ok(googleProvider, "Expected google provider to be registered");
  assert.equal(googleProvider?.strategy, "oauth");
});

test("buildPostAuthRedirect prefixes locale and base path", () => {
  const redirect = buildPostAuthRedirect({ locale: "ca" });

  assert.equal(redirect, "/ca/dashboard/restaurant");
});

test("buildPostAuthRedirect preserves destination already scoped to locale", () => {
  const redirect = buildPostAuthRedirect({
    locale: "ca",
    destination: "/ca/dashboard/settings",
  });

  assert.equal(redirect, "/ca/dashboard/settings");
});

test("getAppBaseUrl prefers NEXT_PUBLIC_SITE_URL", () => {
  const previousOverrides = {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    publicVercel: process.env.NEXT_PUBLIC_VERCEL_URL,
    serverVercel: process.env.VERCEL_URL,
  };

  process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";
  delete process.env.NEXT_PUBLIC_APP_URL;
  delete process.env.NEXT_PUBLIC_VERCEL_URL;
  delete process.env.VERCEL_URL;

  try {
    const result = getAppBaseUrl();
    assert.equal(result, "https://example.com");
  } finally {
    if (previousOverrides.siteUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = previousOverrides.siteUrl;
    }

    if (previousOverrides.appUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = previousOverrides.appUrl;
    }

    if (previousOverrides.publicVercel === undefined) {
      delete process.env.NEXT_PUBLIC_VERCEL_URL;
    } else {
      process.env.NEXT_PUBLIC_VERCEL_URL = previousOverrides.publicVercel;
    }

    if (previousOverrides.serverVercel === undefined) {
      delete process.env.VERCEL_URL;
    } else {
      process.env.VERCEL_URL = previousOverrides.serverVercel;
    }
  }
});

test("getAppBaseUrl falls back to NEXT_PUBLIC_APP_URL when NEXT_PUBLIC_SITE_URL is not set", () => {
  const previousOverrides = {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    publicVercel: process.env.NEXT_PUBLIC_VERCEL_URL,
    serverVercel: process.env.VERCEL_URL,
  };

  delete process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";
  delete process.env.NEXT_PUBLIC_VERCEL_URL;
  delete process.env.VERCEL_URL;

  try {
    const result = getAppBaseUrl();
    assert.equal(result, "https://app.example.com");
  } finally {
    if (previousOverrides.siteUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = previousOverrides.siteUrl;
    }

    if (previousOverrides.appUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = previousOverrides.appUrl;
    }

    if (previousOverrides.publicVercel === undefined) {
      delete process.env.NEXT_PUBLIC_VERCEL_URL;
    } else {
      process.env.NEXT_PUBLIC_VERCEL_URL = previousOverrides.publicVercel;
    }

    if (previousOverrides.serverVercel === undefined) {
      delete process.env.VERCEL_URL;
    } else {
      process.env.VERCEL_URL = previousOverrides.serverVercel;
    }
  }
});

test("getAppBaseUrl falls back to default when no env vars are set", () => {
  const previousOverrides = {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    publicVercel: process.env.NEXT_PUBLIC_VERCEL_URL,
    serverVercel: process.env.VERCEL_URL,
  };

  delete process.env.NEXT_PUBLIC_SITE_URL;
  delete process.env.NEXT_PUBLIC_APP_URL;
  delete process.env.NEXT_PUBLIC_VERCEL_URL;
  delete process.env.VERCEL_URL;

  try {
    const result = getAppBaseUrl();
    assert.equal(result, "https://menoo.app");
  } finally {
    if (previousOverrides.siteUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = previousOverrides.siteUrl;
    }

    if (previousOverrides.appUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = previousOverrides.appUrl;
    }

    if (previousOverrides.publicVercel === undefined) {
      delete process.env.NEXT_PUBLIC_VERCEL_URL;
    } else {
      process.env.NEXT_PUBLIC_VERCEL_URL = previousOverrides.publicVercel;
    }

    if (previousOverrides.serverVercel === undefined) {
      delete process.env.VERCEL_URL;
    } else {
      process.env.VERCEL_URL = previousOverrides.serverVercel;
    }
  }
});

test("getAppBaseUrl normalizes trailing slashes", () => {
  const previousOverrides = {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    publicVercel: process.env.NEXT_PUBLIC_VERCEL_URL,
    serverVercel: process.env.VERCEL_URL,
  };

  process.env.NEXT_PUBLIC_SITE_URL = "https://example.com/";
  delete process.env.NEXT_PUBLIC_APP_URL;
  delete process.env.NEXT_PUBLIC_VERCEL_URL;
  delete process.env.VERCEL_URL;

  try {
    const result = getAppBaseUrl();
    assert.equal(result, "https://example.com");
  } finally {
    if (previousOverrides.siteUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = previousOverrides.siteUrl;
    }

    if (previousOverrides.appUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = previousOverrides.appUrl;
    }

    if (previousOverrides.publicVercel === undefined) {
      delete process.env.NEXT_PUBLIC_VERCEL_URL;
    } else {
      process.env.NEXT_PUBLIC_VERCEL_URL = previousOverrides.publicVercel;
    }

    if (previousOverrides.serverVercel === undefined) {
      delete process.env.VERCEL_URL;
    } else {
      process.env.VERCEL_URL = previousOverrides.serverVercel;
    }
  }
});


