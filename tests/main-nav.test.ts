import assert from "node:assert/strict";
import test from "node:test";

import { DASHBOARD_NAV_ICONS } from "../components/dashboard/main-nav";

test("DASHBOARD_NAV_ICONS contains all required nav icons", () => {
  const requiredIcons = ["Utensils", "Wand2", "BarChart3", "QrCode"] as const;

  for (const iconName of requiredIcons) {
    assert.ok(
      iconName in DASHBOARD_NAV_ICONS,
      `Missing icon: ${iconName}`
    );
    const icon = DASHBOARD_NAV_ICONS[iconName as keyof typeof DASHBOARD_NAV_ICONS];
    // Lucide icons are React forwardRef components (objects with render function)
    assert.ok(
      icon && typeof icon === "object" && "render" in icon,
      `${iconName} should be a valid React component`
    );
  }
});

test("DASHBOARD_NAV_ICONS only contains necessary icons for bundle optimization", () => {
  const allowedIcons = ["Utensils", "Wand2", "BarChart3", "QrCode"];
  const iconKeys = Object.keys(DASHBOARD_NAV_ICONS);

  assert.deepEqual(
    iconKeys.sort(),
    allowedIcons.sort(),
    "Icon map should only contain necessary icons to minimize bundle size"
  );
});
