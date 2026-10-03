import { describe, it, expect } from "vitest";
import { hasHindiVersion, localizeHref, switchLocaleHref } from "../i18n/locale";

describe("hasHindiVersion", () => {
  it("matches exactly the pages that exist in Hindi", () => {
    for (const p of ["/", "/horoscope", "/horoscope/leo", "/panchang", "/festivals", "/festivals/2026", "/festivals/2026/diwali", "/panchang?date=2024-01-01"]) {
      expect(hasHindiVersion(p)).toBe(true);
    }
    for (const p of ["/horoscope/leo/weekly", "/horoscope/personal", "/matching", "/learn/planets", "/panchangx"]) {
      expect(hasHindiVersion(p)).toBe(false);
    }
  });
});

describe("localized links", () => {
  it("prefixes Hindi pages only where a Hindi version exists", () => {
    expect(localizeHref("hi", "/horoscope/leo")).toBe("/hi/horoscope/leo");
    expect(localizeHref("hi", "/")).toBe("/hi");
    expect(localizeHref("hi", "/matching")).toBe("/matching");
    expect(localizeHref("en", "/horoscope")).toBe("/horoscope");
  });

  it("switches language to the matching page, or the Hindi home when there is none", () => {
    expect(switchLocaleHref("/horoscope/leo", "", "hi")).toBe("/hi/horoscope/leo");
    expect(switchLocaleHref("/hi/horoscope/leo", "", "en")).toBe("/horoscope/leo");
    expect(switchLocaleHref("/hi", "", "en")).toBe("/");
    expect(switchLocaleHref("/horoscope/leo/weekly", "", "hi")).toBe("/hi");
    expect(switchLocaleHref("/matching", "", "hi")).toBe("/hi");
  });
});
