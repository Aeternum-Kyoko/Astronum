import { describe, it, expect } from "vitest";
import { observancesForYear, findFestival } from "../festivals";
import { lunarMonthsBetween } from "../lunarCalendar";

const DELHI = { latitude: 28.6139, longitude: 77.209, timezone: "Asia/Kolkata" };

describe("observancesForYear — 2024, New Delhi", () => {
  const all = observancesForYear(2024, DELHI);
  const date = (slug: string) => all.find((o) => o.slug === slug)?.date;

  // Published dates for New Delhi, 2024.
  it.each([
    ["makar-sankranti", "2024-01-15"],
    ["vasant-panchami", "2024-02-14"],
    ["maha-shivaratri", "2024-03-08"],
    ["holika-dahan", "2024-03-24"],
    ["holi", "2024-03-25"],
    ["ugadi-gudi-padwa", "2024-04-09"],
    ["ram-navami", "2024-04-17"],
    ["hanuman-jayanti", "2024-04-23"],
    ["akshaya-tritiya", "2024-05-10"],
    ["guru-purnima", "2024-07-21"],
    ["raksha-bandhan", "2024-08-19"],
    ["janmashtami", "2024-08-26"],
    ["ganesh-chaturthi", "2024-09-07"],
    ["sharad-navratri", "2024-10-03"],
    ["dussehra", "2024-10-12"],
    ["karva-chauth", "2024-10-20"],
    ["dhanteras", "2024-10-29"],
    ["govardhan-puja", "2024-11-02"],
    ["bhai-dooj", "2024-11-03"],
    ["chhath-puja", "2024-11-07"],
    ["dev-uthani-ekadashi", "2024-11-12"],
    ["kartik-purnima", "2024-11-15"],
  ])("%s falls on %s", (slug, expected) => {
    expect(date(slug)).toBe(expected);
  });

  it("lists roughly two Ekadashis, one Purnima and one Amavasya a month, all inside the year", () => {
    const count = (c: string) => all.filter((o) => o.category === c).length;
    expect(count("Ekadashi")).toBeGreaterThanOrEqual(24);
    expect(count("Ekadashi")).toBeLessThanOrEqual(26);
    expect(count("Purnima")).toBeGreaterThanOrEqual(12);
    expect(count("Amavasya")).toBeGreaterThanOrEqual(12);
    expect(all.every((o) => o.date.startsWith("2024"))).toBe(true);
  });

  it("returns observances in date order", () => {
    const dates = all.map((o) => o.date);
    expect([...dates].sort()).toEqual(dates);
  });
});

describe("lunar months", () => {
  it("names months by the Sun's sign at the opening new Moon and flags 2026's Adhika Jyeshtha", () => {
    const months = lunarMonthsBetween(new Date("2026-03-01"), new Date("2026-08-01"));
    const names = months.map((m) => `${m.adhika ? "Adhika " : ""}${m.name}`);
    expect(names).toContain("Adhika Jyeshtha");
    const i = names.indexOf("Adhika Jyeshtha");
    expect(names[i + 1]).toBe("Jyeshtha");
    expect(names[i - 1]).toBe("Vaishakha");
  });

  it("keeps the Adhika month's Ekadashis under their special names", () => {
    const names = observancesForYear(2026, DELHI).filter((o) => o.month.startsWith("Adhika")).map((o) => o.name);
    expect(names).toContain("Padmini Ekadashi");
    expect(names).toContain("Parama Ekadashi");
  });
});

describe("findFestival", () => {
  it("finds a festival by slug and year, or returns null", () => {
    expect(findFestival(2025, "makar-sankranti", DELHI)?.date).toBe("2025-01-14");
    expect(findFestival(2025, "no-such-festival", DELHI)).toBeNull();
  });
});
