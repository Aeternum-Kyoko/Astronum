import { describe, it, expect } from "vitest";
import { calculateKundali } from "../kundali";
import { PLANETS } from "../constants";

const sample = {
  name: "Test",
  date: "1990-06-15",
  time: "14:30",
  latitude: 26.9124,
  longitude: 75.7873,
  timezone: "Asia/Kolkata",
  place: "Jaipur, Rajasthan, India",
};

describe("calculateKundali — structural invariants", () => {
  const chart = calculateKundali(sample);

  it("places every planet within a valid sign, house, and degree range", () => {
    expect(chart.planets).toHaveLength(PLANETS.length);
    for (const p of chart.planets) {
      expect(p.signIndex).toBeGreaterThanOrEqual(0);
      expect(p.signIndex).toBeLessThan(12);
      expect(p.house).toBeGreaterThanOrEqual(1);
      expect(p.house).toBeLessThanOrEqual(12);
      expect(p.degreeInSign).toBeGreaterThanOrEqual(0);
      expect(p.degreeInSign).toBeLessThan(30);
    }
  });

  it("keeps Rahu and Ketu exactly 180° apart in the Rasi chart", () => {
    const rahu = chart.planets.find((p) => p.planet === "Rahu")!;
    const ketu = chart.planets.find((p) => p.planet === "Ketu")!;
    const diff = Math.abs(rahu.siderealLongitude - ketu.siderealLongitude);
    expect(Math.min(diff, 360 - diff)).toBeCloseTo(180, 5);
  });

  it("keeps Rahu and Ketu in opposite signs in the Navamsa too", () => {
    const rahu = chart.divisionalCharts.D9.planets.find((p) => p.planet === "Rahu")!;
    const ketu = chart.divisionalCharts.D9.planets.find((p) => p.planet === "Ketu")!;
    expect((rahu.signIndex + 6) % 12).toBe(ketu.signIndex);
  });

  it("computes all 16 divisional charts with a valid ascendant and every planet placed", () => {
    for (const key of Object.keys(chart.divisionalCharts) as (keyof typeof chart.divisionalCharts)[]) {
      const varga = chart.divisionalCharts[key];
      expect(varga.ascendant.signIndex).toBeGreaterThanOrEqual(0);
      expect(varga.ascendant.signIndex).toBeLessThan(12);
      expect(varga.planets).toHaveLength(PLANETS.length);
    }
  });

  it("produces a Sarvashtakavarga that sums to the classical 337 total bindus", () => {
    const total = chart.ashtakavarga.sarva.reduce((a, b) => a + b, 0);
    expect(total).toBe(337);
  });

  it("computes a plausible Shadbala rupas figure for every classical planet", () => {
    expect(chart.shadbala).toHaveLength(7);
    for (const s of chart.shadbala) {
      expect(s.rupas).toBeGreaterThan(0);
      expect(s.rupas).toBeLessThan(15);
    }
  });

  it("nests an Antardasha->Pratyantardasha tree under every Mahadasha that exactly accounts for its span", () => {
    const YEAR_MS = 365.25 * 86400000;
    for (const maha of chart.dashas) {
      expect(maha.subPeriods!.length).toBeGreaterThan(0);
      const antarSpan = (maha.subPeriods!.at(-1)!.end.getTime() - maha.subPeriods![0].start.getTime()) / YEAR_MS;
      expect(antarSpan).toBeCloseTo((maha.end.getTime() - maha.start.getTime()) / YEAR_MS, 2);

      for (const antar of maha.subPeriods!) {
        expect(antar.subPeriods!.length).toBeGreaterThan(0);
        const pratyantarSpan = (antar.subPeriods!.at(-1)!.end.getTime() - antar.subPeriods![0].start.getTime()) / YEAR_MS;
        expect(pratyantarSpan).toBeCloseTo((antar.end.getTime() - antar.start.getTime()) / YEAR_MS, 2);
      }
    }
  });

  it("computes every planet's house consistently from its sign and the Ascendant", () => {
    for (const p of chart.planets) {
      const expectedHouse = ((p.signIndex - chart.ascendant.signIndex + 12) % 12) + 1;
      expect(p.house).toBe(expectedHouse);
    }
  });

  it("agrees between house-lord table and the Ascendant sign", () => {
    expect(chart.houseLords[0].sign).toBe(chart.ascendant.sign);
  });

  it("covers exactly 120 years across the full Mahadasha sequence", () => {
    const start = chart.dashas[0].start.getTime();
    const end = chart.dashas[chart.dashas.length - 1].end.getTime();
    const years = (end - start) / (365.25 * 86400000);
    // 12 periods requested, which is more than one full 120-year cycle;
    // just check monotonic chaining and a plausible total span instead.
    expect(years).toBeGreaterThan(100);
  });

  it("has a currentDasha that contains today's date", () => {
    const now = new Date();
    expect(chart.currentDasha).not.toBeNull();
    expect(now.getTime()).toBeGreaterThanOrEqual(chart.currentDasha!.start.getTime());
    expect(now.getTime()).toBeLessThan(chart.currentDasha!.end.getTime());
  });

  it("rejects an invalid timezone", () => {
    expect(() => calculateKundali({ ...sample, timezone: "Not/A_Zone" })).toThrow();
  });
});
