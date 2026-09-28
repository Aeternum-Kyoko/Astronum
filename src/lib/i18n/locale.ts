export type Locale = "en" | "hi";

export const LOCALES: Locale[] = ["en", "hi"];

/**
 * Paths that have a Hindi version under /hi: the home page, daily horoscopes
 * (/horoscope and /horoscope/<sign>, not the weekly/monthly/yearly pages),
 * Panchang, and the festival calendar and festival pages.
 */
const HINDI_PATTERNS = [/^\/$/, /^\/horoscope(\/(?!personal$)[a-z]+)?$/, /^\/panchang$/, /^\/festivals(\/\d{4}(\/[a-z0-9-]+)?)?$/];

export function hasHindiVersion(path: string): boolean {
  const pathname = path.split("?")[0];
  return HINDI_PATTERNS.some((re) => re.test(pathname));
}

/** The link to use for `path` on a page in `locale`: Hindi pages link to Hindi versions where they exist. */
export function localizeHref(locale: Locale, path: string): string {
  if (locale !== "hi" || !hasHindiVersion(path)) return path;
  return path === "/" ? "/hi" : `/hi${path}`;
}

/** Where the language switcher should go from the current URL. */
export function switchLocaleHref(pathname: string, search: string, to: Locale): string {
  const isHindi = pathname === "/hi" || pathname.startsWith("/hi/");
  const base = isHindi ? pathname.slice(3) || "/" : pathname;
  if (to === "en") return `${base}${search}`;
  return hasHindiVersion(base) ? `${base === "/" ? "/hi" : `/hi${base}`}${search}` : "/hi";
}

/** hreflang alternates for a page that exists in both languages. */
export function languageAlternates(path: string) {
  return {
    canonical: path,
    languages: { "en-IN": path, "hi-IN": path === "/" ? "/hi" : `/hi${path}` },
  };
}
