/**
 * Birth details <-> URL query string, so a chart can be opened from the home
 * page form or shared as a link (/kundali?name=…&date=…&time=…&place=…&lat=…&lon=…&tz=…).
 */

export interface BirthParams {
  name: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  place: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

/** `prefix` namespaces the keys so two people fit in one URL (matching uses "b" and "g"). */
export function toBirthQuery(p: BirthParams, prefix = ""): string {
  const entries = {
    name: p.name,
    date: p.date,
    time: p.time,
    place: p.place,
    lat: p.latitude.toFixed(4),
    lon: p.longitude.toFixed(4),
    tz: p.timezone,
  };
  return new URLSearchParams(Object.entries(entries).map(([k, v]) => [prefix + k, v])).toString();
}

/** Returns null unless every field is present and well-formed. */
export function fromBirthQuery(q: URLSearchParams, prefix = ""): BirthParams | null {
  const get = (key: string) => q.get(prefix + key);
  const name = get("name")?.trim() ?? "";
  const date = get("date") ?? "";
  const time = get("time") ?? "";
  const place = get("place")?.trim() ?? "";
  const timezone = get("tz") ?? "";
  const latitude = Number(get("lat"));
  const longitude = Number(get("lon"));

  if (!name || !place || !timezone) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  if (!get("lat") || !get("lon")) return null;
  if (!Number.isFinite(latitude) || Math.abs(latitude) > 90) return null;
  if (!Number.isFinite(longitude) || Math.abs(longitude) > 180) return null;

  return { name, date, time, place, latitude, longitude, timezone };
}
