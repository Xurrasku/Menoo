import assert from "node:assert/strict";
import test from "node:test";

import { createDashboardSessionLoader } from "../lib/dashboard/session";
import type { User } from "@supabase/supabase-js";
import type { RestaurantSummary } from "../lib/restaurants/service";

test("createDashboardSessionLoader returns the user and restaurant", async () => {
  const loader = createDashboardSessionLoader({
    requireUser: async () => ({ id: "user-1" } as User),
    getRestaurantByOwnerId: async () =>
      ({
        id: "restaurant-1",
        slug: "demo-slug",
        name: "Demo",
        cuisine: null,
        address: null,
        domain: "https://demo",
      } as RestaurantSummary),
    redirect: () => {
      throw new Error("redirect should not be called");
    },
  });

  const session = await loader("es");

  assert.equal(session.user.id, "user-1");
  assert.equal(session.restaurant.id, "restaurant-1");
});

test("createDashboardSessionLoader redirects when restaurant is missing", async () => {
  const redirectError = new Error("redirect");
  const loader = createDashboardSessionLoader({
    requireUser: async () => ({ id: "user-1" } as User),
    getRestaurantByOwnerId: async () => null,
    redirect: () => {
      throw redirectError;
    },
  });

  await assert.rejects(loader("es"), (error) => error === redirectError);
});


