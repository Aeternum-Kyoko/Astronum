/** Canonical origin for absolute URLs (sitemap, Open Graph, JSON-LD). Set NEXT_PUBLIC_SITE_URL in production. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const SITE_NAME = "Astronum";

export const SITE_DESCRIPTION =
  "Free Vedic kundli, kundli matching, daily Panchang and horoscopes — computed with real astronomy on the Lahiri ayanamsa, with a practising astrologer a click away.";

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
