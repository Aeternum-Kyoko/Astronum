import { find as findTimeZones } from "geo-tz";

export interface GeocodeResult {
  displayName: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export async function geocodePlace(query: string): Promise<GeocodeResult[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "5");
  url.searchParams.set("addressdetails", "0");

  const res = await fetch(url, {
    headers: {
      "User-Agent": "astronum/1.0 (astrology kundali generator)",
      Accept: "application/json",
    },
  });

  if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);

  const results: { display_name: string; lat: string; lon: string }[] = await res.json();

  return results.map((r) => {
    const latitude = parseFloat(r.lat);
    const longitude = parseFloat(r.lon);
    const zones = findTimeZones(latitude, longitude);
    return {
      displayName: r.display_name,
      latitude,
      longitude,
      timezone: zones[0] ?? "UTC",
    };
  });
}
