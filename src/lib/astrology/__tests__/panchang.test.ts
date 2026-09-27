import { describe, it, expect } from "vitest";
import { computeDailyPanchang, findChange } from "../panchang";

// New Delhi, Thursday 11 January 2024 — a new Moon at 11:57 UTC (17:27 IST).
const DELHI = { lat: 28.6139, lon: 77.209, tz: "Asia/Kolkata" };
const p = computeDailyPanchang("2024-01-11", DELHI.lat, DELHI.lon, DELHI.tz);

const minutesApart = (a: Date, iso: string) => Math.abs(a.getTime() - new Date(iso).getTime()) / 60000;

describe("computeDailyPanchang — New Delhi, 11 Jan 2024", () => {
  it("finds sunrise and sunset to within a couple of minutes of published tables (07:15 / 17:42 IST)", () => {
    expect(minutesApart(p.sunrise, "2024-01-11T07:15:00+05:30")).toBeLessThan(2);
    expect(minutesApart(p.sunset, "2024-01-11T17:42:00+05:30")).toBeLessThan(2);
    expect(p.nextSunrise.getTime()).toBeGreaterThan(p.sunset.getTime());
  });

  it("names the weekday by the local date", () => {
    expect(p.vara).toEqual({ name: "Thursday", sanskrit: "Guruvara" });
  });

  it("reads Amavasya at sunrise, ending at the moment of the new Moon", () => {
    expect(p.tithi.name).toBe("Krishna Amavasya");
    expect(p.tithi.paksha).toBe("Krishna");
    expect(p.tithi.next).toBe("Shukla Pratipada");
    expect(minutesApart(p.tithi.endsAt!, "2024-01-11T11:57:00Z")).toBeLessThan(5);
  });

  it("ends the last karana (Naga) with the tithi", () => {
    expect(p.karana.name).toBe("Naga");
    expect(p.karana.next).toBe("Kimstughna");
    expect(minutesApart(p.karana.endsAt!, p.tithi.endsAt!.toISOString())).toBeLessThan(1);
  });

  it("places Rahu Kaal in the 6th eighth of a Thursday and Abhijit around local noon", () => {
    const eighth = (p.sunset.getTime() - p.sunrise.getTime()) / 8;
    expect(p.rahuKaal.start.getTime()).toBeCloseTo(p.sunrise.getTime() + 5 * eighth, -3);
    expect(p.gulikaKaal.start.getTime()).toBeCloseTo(p.sunrise.getTime() + 2 * eighth, -3);
    expect(p.yamaganda.start.getTime()).toBeCloseTo(p.sunrise.getTime(), -3);
    const noon = (p.sunrise.getTime() + p.sunset.getTime()) / 2;
    expect((p.abhijit.start.getTime() + p.abhijit.end.getTime()) / 2).toBeCloseTo(noon, -3);
  });

  it("follows the Thursday Choghadiya sequences and tiles day and night exactly", () => {
    expect(p.choghadiya.day.map((c) => c.name)).toEqual(["Shubh", "Rog", "Udveg", "Char", "Labh", "Amrit", "Kaal", "Shubh"]);
    expect(p.choghadiya.night.map((c) => c.name)).toEqual(["Amrit", "Char", "Rog", "Kaal", "Labh", "Udveg", "Shubh", "Amrit"]);
    expect(p.choghadiya.day[0].start).toEqual(p.sunrise);
    expect(p.choghadiya.day[7].end.getTime()).toBeCloseTo(p.sunset.getTime(), -1);
    expect(p.choghadiya.night[7].end.getTime()).toBeCloseTo(p.nextSunrise.getTime(), -1);
  });

  it("starts a Sunday's day Choghadiya with Udveg and ends Rahu Kaal at sunset", () => {
    const sunday = computeDailyPanchang("2024-01-14", DELHI.lat, DELHI.lon, DELHI.tz);
    expect(sunday.vara.name).toBe("Sunday");
    expect(sunday.choghadiya.day[0].name).toBe("Udveg");
    expect(sunday.rahuKaal.end.getTime()).toBeCloseTo(sunday.sunset.getTime(), -3);
  });

  it("refuses dates where the Sun never sets", () => {
    expect(() => computeDailyPanchang("2024-06-21", 78.2, 15.6, "Arctic/Longyearbyen")).toThrow(/does not rise and set/);
  });
});

describe("findChange", () => {
  it("finds a step change to within a minute", () => {
    const from = new Date("2024-01-01T00:00:00Z");
    const at = new Date("2024-01-01T05:17:30Z");
    const t = findChange((d) => (d < at ? 0 : 1), from)!;
    expect(Math.abs(t.getTime() - at.getTime())).toBeLessThan(60_000);
    expect(t.getTime()).toBeGreaterThanOrEqual(at.getTime());
  });

  it("returns null when nothing changes inside the window", () => {
    expect(findChange(() => 3, new Date(), 5)).toBeNull();
  });
});
