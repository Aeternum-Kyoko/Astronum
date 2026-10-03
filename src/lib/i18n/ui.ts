import type { Locale } from "./locale";
import { UI_HI } from "./ui.hi";

/**
 * Interface strings. Every English UI string shown on a Hindi page is looked
 * up here; the test in __tests__/uiStrings.test.ts fails when a string used in
 * a component has no Hindi entry, so nothing silently stays in English.
 */
export function translate(locale: Locale, en: string): string {
  if (locale !== "hi") return en;
  return UI_HI[en] ?? en;
}

/** For prose with values in it: pick the English or Hindi template. */
export const pick = (locale: Locale) => (en: string, hi: string) => (locale === "hi" ? hi : en);

/** Dates in the reader's language. */
export function dateLocale(locale: Locale): string {
  return locale === "hi" ? "hi-IN" : "en-GB";
}
