import type { Location } from "@/lib/astrology/festivals";
import { DEFAULT_PANCHANG_LOCATION } from "@/lib/panchangUrl";

/** Festival pages are computed for New Delhi — the reference city most Indian almanacs use. */
export const FESTIVAL_LOCATION: Location & { place: string } = DEFAULT_PANCHANG_LOCATION;

export function parseYear(raw: string): number | null {
  if (!/^\d{4}$/.test(raw)) return null;
  const year = Number(raw);
  return year >= 1900 && year <= 2100 ? year : null;
}
