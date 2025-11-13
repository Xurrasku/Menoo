import assert from "node:assert/strict";
import test from "node:test";

import { AUTH_PROVIDERS, buildPostAuthRedirect } from "../lib/auth/config";

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


