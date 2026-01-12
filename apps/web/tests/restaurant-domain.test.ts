import assert from "node:assert/strict";
import test from "node:test";

import { buildMenuDomain, buildMenuUrlFromSlug } from "../lib/restaurants/domain";

test("buildMenuDomain slugifies restaurant name", () => {
  const previousBase = process.env.NEXT_PUBLIC_MENU_DOMAIN_BASE;
  process.env.NEXT_PUBLIC_MENU_DOMAIN_BASE = "https://menus.menoo.app";

  try {
    const result = buildMenuDomain("Restaurante El Niño");

    assert.equal(result.slug, "restaurante-el-nino");
    assert.equal(result.url, "https://menus.menoo.app/menu/restaurante-el-nino");
  } finally {
    if (previousBase === undefined) {
      delete process.env.NEXT_PUBLIC_MENU_DOMAIN_BASE;
    } else {
      process.env.NEXT_PUBLIC_MENU_DOMAIN_BASE = previousBase;
    }
  }
});

test("buildMenuDomain rejects empty names", () => {
  assert.throws(() => buildMenuDomain("   "), /restaurant name/i);
});

test("buildMenuUrlFromSlug normalizes slashes", () => {
  const previousBase = process.env.NEXT_PUBLIC_MENU_DOMAIN_BASE;
  process.env.NEXT_PUBLIC_MENU_DOMAIN_BASE = "https://menus.menoo.app/base/";

  try {
    const result = buildMenuUrlFromSlug(" /featured-menu// ");
    assert.equal(result, "https://menus.menoo.app/base/menu/featured-menu");
  } finally {
    if (previousBase === undefined) {
      delete process.env.NEXT_PUBLIC_MENU_DOMAIN_BASE;
    } else {
      process.env.NEXT_PUBLIC_MENU_DOMAIN_BASE = previousBase;
    }
  }
});

test("buildMenuUrlFromSlug rejects empty slugs", () => {
  assert.throws(() => buildMenuUrlFromSlug("   "), /slug/i);
});

test("buildMenuUrlFromSlug uses Vercel preview domain when provided", () => {
  const previousOverrides = {
    customBase: process.env.NEXT_PUBLIC_MENU_DOMAIN_BASE,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    publicVercel: process.env.NEXT_PUBLIC_VERCEL_URL,
    serverVercel: process.env.VERCEL_URL,
  };

  delete process.env.NEXT_PUBLIC_MENU_DOMAIN_BASE;
  delete process.env.NEXT_PUBLIC_SITE_URL;
  delete process.env.NEXT_PUBLIC_APP_URL;
  process.env.NEXT_PUBLIC_VERCEL_URL = "preview-deployment.vercel.app";
  delete process.env.VERCEL_URL;

  try {
    const result = buildMenuUrlFromSlug(" tasting-room ");
    assert.equal(result, "https://preview-deployment.vercel.app/menu/tasting-room");
  } finally {
    if (previousOverrides.customBase === undefined) {
      delete process.env.NEXT_PUBLIC_MENU_DOMAIN_BASE;
    } else {
      process.env.NEXT_PUBLIC_MENU_DOMAIN_BASE = previousOverrides.customBase;
    }

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

test("buildMenuUrlFromSlug prefers NEXT_PUBLIC_SITE_URL when available", () => {
  const previousOverrides = {
    customBase: process.env.NEXT_PUBLIC_MENU_DOMAIN_BASE,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
  };

  delete process.env.NEXT_PUBLIC_MENU_DOMAIN_BASE;
  process.env.NEXT_PUBLIC_SITE_URL = "https://custom-preview.menoo.app";
  delete process.env.NEXT_PUBLIC_APP_URL;

  try {
    const result = buildMenuUrlFromSlug(" tasting-room ");
    assert.equal(result, "https://custom-preview.menoo.app/menu/tasting-room");
  } finally {
    if (previousOverrides.customBase === undefined) {
      delete process.env.NEXT_PUBLIC_MENU_DOMAIN_BASE;
    } else {
      process.env.NEXT_PUBLIC_MENU_DOMAIN_BASE = previousOverrides.customBase;
    }

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
  }
});





