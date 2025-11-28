import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { cache } from "react";

import { requireUser } from "@/lib/auth/server";
import {
  type RestaurantSummary,
  getRestaurantByOwnerId,
} from "@/lib/restaurants/service";

type DashboardSession = {
  user: User;
  restaurant: RestaurantSummary;
};

type DashboardSessionDependencies = {
  requireUser: (locale: string) => Promise<User>;
  getRestaurantByOwnerId: (
    ownerUserId: string
  ) => Promise<RestaurantSummary | null>;
  redirect: typeof redirect;
};

export function createDashboardSessionLoader(
  deps: DashboardSessionDependencies
) {
  return async function loadDashboardSession(locale: string): Promise<DashboardSession> {
    const user = await deps.requireUser(locale);
    const restaurant = await deps.getRestaurantByOwnerId(user.id);

    if (!restaurant) {
      const restaurantSetupRoute =
        `/${locale}/dashboard/restaurant` as Parameters<
          typeof redirect
        >[0];
      deps.redirect(restaurantSetupRoute);
    }

    return { user, restaurant: restaurant! };
  };
}

const loadDashboardSession = createDashboardSessionLoader({
  requireUser,
  getRestaurantByOwnerId,
  redirect,
});

export const getDashboardSession = cache(loadDashboardSession);


