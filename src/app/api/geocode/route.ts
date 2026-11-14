import { NextRequest, NextResponse } from "next/server";
import { geocodePlace } from "@/lib/geocode";
import { find } from "geo-tz/all";

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.has("lat") && req.nextUrl.searchParams.has("lon")) {
    const latitude = Number(req.nextUrl.searchParams.get("lat")), longitude = Number(req.nextUrl.searchParams.get("lon"));
    if (!req.nextUrl.searchParams.get("lat")?.trim() || !req.nextUrl.searchParams.get("lon")?.trim() || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return NextResponse.json({ error: "Coordinates are outside the Earth’s bounds." }, { status: 400 });
    try { return NextResponse.json({ timezone: find(latitude, longitude)[0] ?? null }); }
    catch { return NextResponse.json({ error: "Timezone unavailable; enter the recorded timezone manually." }, { status: 422 }); }
  }
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2 || q.length > 200) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await geocodePlace(q);
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Geocoding failed" },
      { status: 502 }
    );
  }
}
