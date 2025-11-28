import { NextRequest, NextResponse } from "next/server";

import { recordMenuView } from "@/lib/analytics/service";
import { getRestaurantBySlug } from "@/lib/restaurants/service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { slug } = body;

    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const restaurant = await getRestaurantBySlug(slug);

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const headers = request.headers;
    const ipAddress = headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                      headers.get("x-real-ip") ||
                      null;
    const userAgent = headers.get("user-agent") || null;
    const referer = headers.get("referer") || null;

    await recordMenuView(restaurant.id, {
      ipAddress,
      userAgent,
      referer,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to record menu view", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}



