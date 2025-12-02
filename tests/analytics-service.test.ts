import assert from "node:assert/strict";
import test from "node:test";

import { getMenuViewStats, recordMenuView } from "../lib/analytics/service";

test("recordMenuView handles missing database gracefully", async () => {
  // Should not throw when db is not available
  await recordMenuView("test-restaurant-id");
  assert.ok(true, "recordMenuView completed without error");
});

test("getMenuViewStats returns zero stats when database is unavailable", async () => {
  const stats = await getMenuViewStats("test-restaurant-id");

  assert.equal(stats.totalViews, 0);
  assert.equal(stats.viewsToday, 0);
  assert.equal(stats.viewsThisWeek, 0);
  assert.equal(stats.viewsThisMonth, 0);
});

test("getMenuViewStats returns stats with correct structure", async () => {
  const stats = await getMenuViewStats("test-restaurant-id");

  assert.ok(typeof stats.totalViews === "number");
  assert.ok(typeof stats.viewsToday === "number");
  assert.ok(typeof stats.viewsThisWeek === "number");
  assert.ok(typeof stats.viewsThisMonth === "number");
  assert.ok(stats.totalViews >= 0);
  assert.ok(stats.viewsToday >= 0);
  assert.ok(stats.viewsThisWeek >= 0);
  assert.ok(stats.viewsThisMonth >= 0);
});









