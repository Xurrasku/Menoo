"use client";

import { useEffect } from "react";

type MenuViewTrackerProps = {
  slug: string;
};

export function MenuViewTracker({ slug }: MenuViewTrackerProps) {
  useEffect(() => {
    // Track page view
    const trackView = async () => {
      try {
        await fetch("/api/analytics/menu-view", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ slug }),
        });
      } catch (error) {
        // Silently fail - analytics shouldn't break the page
        console.error("Failed to track menu view", error);
      }
    };

    trackView();
  }, [slug]);

  return null;
}



