import { describe, expect, it } from "vitest";
import { mobileNavigation, savedMobileChart } from "../mobileNavigation";

describe("mobile navigation", () => {
  it.each([
    ["/", "home"], ["/hi", "home"], ["/matching", "kundli"], ["/hi/kundali", "kundli"],
    ["/horoscope/aries/weekly", "horoscope"], ["/horoscope/personal", "horoscope"],
    ["/hi/festivals/2026", "panchang"], ["/muhurat", "panchang"],
    ["/learn/gemstones", "more"], ["/account", "more"], ["/history", "more"],
  ])("highlights the correct destination for %s", (path, tab) => {
    expect(mobileNavigation(path).tab).toBe(tab);
  });
  it("distinguishes root tabs from detail pages for the back control", () => {
    expect(mobileNavigation("/hi/panchang").root).toBe(true);
    expect(mobileNavigation("/horoscope/aries").root).toBe(false);
  });
  it("restores chart details only for the current language's chart route", () => {
    expect(savedMobileChart("/kundali?name=Preview&tab=dashas", "/kundali")).toBe("/kundali?name=Preview&tab=dashas");
    for (const url of ["https://example.com/kundali?a=1", "//example.com/kundali?a=1", "/hi/kundali?a=1", "/kundali-other?a=1", null]) {
      expect(savedMobileChart(url, "/kundali")).toBeNull();
    }
  });
});
