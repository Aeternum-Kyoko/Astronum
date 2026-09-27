import { DateTime } from "luxon";

export interface PanchangLocation {
  place: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export const DEFAULT_PANCHANG_LOCATION: PanchangLocation = {
  place: "New Delhi, Delhi, India",
  latitude: 28.6139,
  longitude: 77.209,
  timezone: "Asia/Kolkata",
};

export function panchangHref(date: string, loc: PanchangLocation, basePath = "/panchang"): string {
  const q = new URLSearchParams({
    date,
    place: loc.place,
    lat: loc.latitude.toFixed(4),
    lon: loc.longitude.toFixed(4),
    tz: loc.timezone,
  });
  return `${basePath}?${q.toString()}`;
}

type RawParams = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Location and date from the page's search params; falls back to New Delhi and today there. */
export function parsePanchangParams(params: RawParams, now = new Date()): { date: string; location: PanchangLocation } {
  const lat = Number(one(params.lat));
  const lon = Number(one(params.lon));
  const tz = one(params.tz);
  const place = one(params.place)?.trim();
  const tzValid = !!tz && DateTime.now().setZone(tz).isValid;
  const location =
    place && tzValid && one(params.lat) && one(params.lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180
      ? { place, latitude: lat, longitude: lon, timezone: tz }
      : DEFAULT_PANCHANG_LOCATION;

  const raw = one(params.date);
  const parsed = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? DateTime.fromISO(raw, { zone: location.timezone }) : null;
  const date = parsed?.isValid ? raw! : DateTime.fromJSDate(now, { zone: location.timezone }).toISODate()!;
  return { date, location };
}
