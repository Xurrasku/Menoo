import assert from "node:assert/strict";
import test from "node:test";

import { getBillingPagePath } from "../lib/billing/paths";

test("getBillingPagePath returns a localized billing route", () => {
  assert.equal(getBillingPagePath("es"), "/es/dashboard/billing");
});

test("getBillingPagePath falls back to default locale when input is invalid", () => {
  assert.equal(getBillingPagePath(""), "/en/dashboard/billing");
  assert.equal(getBillingPagePath("../../etc/passwd"), "/en/dashboard/billing");
});

