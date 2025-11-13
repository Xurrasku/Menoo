import assert from "node:assert/strict";
import test from "node:test";

import {
  DASHBOARD_EDGE_PADDING,
  DASHBOARD_NAV_HIGHLIGHT_TRANSITION,
} from "../lib/constants/layout";

test("dashboard edge padding matches fixed spacing", () => {
  assert.equal(DASHBOARD_EDGE_PADDING, "px-6");
});

test("dashboard nav highlight transition remains smooth", () => {
  assert.equal(DASHBOARD_NAV_HIGHLIGHT_TRANSITION, "duration-300 ease-out");
});

