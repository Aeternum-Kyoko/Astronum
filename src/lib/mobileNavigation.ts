import { KUNDLI_LINKS, PRIMARY_NAV, isGroup, isActivePath } from "./nav";

export type MobileTab = "home" | "kundli" | "horoscope" | "panchang" | "more";

export function mobileNavigation(pathname: string) {
  const path = pathname.replace(/^\/hi(?=\/|$)/, "") || "/";
  const first = `/${path.split("/")[1]}`;
  let tab: MobileTab = "more";
  if (path === "/") tab = "home";
  else if (isActivePath(path, "/horoscope")) tab = "horoscope";
  else if (["/panchang", "/festivals", "/muhurat"].includes(first)) tab = "panchang";
  else if (KUNDLI_LINKS.some(item => !item.href.startsWith("/learn") && isActivePath(path, item.href))) tab = "kundli";
  const items = PRIMARY_NAV.flatMap(item => isGroup(item) ? item.items : [item]);
  const item = items.filter(item => isActivePath(path, item.href)).sort((a, b) => b.href.length - a.href.length)[0];
  const title = path === "/" ? "Astronum" : item?.label ?? (first === "/account" ? "My charts" : first === "/login" ? "Sign in" : "Astronum");
  const titleHi = path === "/" ? "Astronum" : item?.labelHi ?? (first === "/account" ? "मेरी कुंडलियाँ" : first === "/login" ? "साइन इन" : title);
  const root = ["/", "/kundali", "/horoscope", "/panchang"].includes(path);
  return { path, tab, title, titleHi, root };
}

/** Restore only an in-app chart URL in the current language. */
export function savedMobileChart(saved: string | null, href: string): string | null {
  return saved?.startsWith(`${href}?`) ? saved : null;
}
