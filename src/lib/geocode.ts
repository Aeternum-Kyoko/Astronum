import { find as findTimeZones } from "geo-tz/all";

export interface GeocodeResult {
  displayName: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export async function geocodePlace(query: string): Promise<GeocodeResult[]> {
  // Photon explicitly supports search-as-you-type; the public Nominatim API does not.
  const url = new URL(process.env.PHOTON_SEARCH_URL || "https://photon.komoot.io/api/");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "5");
  url.searchParams.set("lang", "en");

  const res = await fetch(url, {
    signal: AbortSignal.timeout(12000),
    next: { revalidate: 86400 },
    headers: {
      "User-Agent": "astronum/1.0 (astrology kundali generator)",
      Accept: "application/json",
    },
  });

  if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);

  const data: { features?: { geometry: { coordinates: number[] }; properties: Record<string,string> }[] } = await res.json();
  const seen = new Set<string>();
  return (data.features ?? []).filter(r => {
    const [lon,lat]=r.geometry.coordinates;
    const key=`${lat}:${lon}`;
    if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180||seen.has(key))return false;
    seen.add(key);return true;
  }).map((r) => {
    const [longitude, latitude] = r.geometry.coordinates;
    const p=r.properties;
    const displayName=[...new Set([p.name,p.city,p.county,p.state,p.country].filter(Boolean))].join(", ");
    const zones = findTimeZones(latitude, longitude);
    return {
      displayName: (displayName || `${latitude}, ${longitude}`).slice(0, 200),
      latitude,
      longitude,
      timezone: zones[0] ?? "",
    };
  });
}
