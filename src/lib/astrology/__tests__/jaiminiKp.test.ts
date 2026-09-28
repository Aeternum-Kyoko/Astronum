import { describe, it, expect } from "vitest";
import { calculateKundali } from "../kundali";
import { kpLords, kpAnalysis } from "../kp";
import { yoginiDasha, firstYogini, YOGINIS } from "../yoginiDasha";
import { charaDasha, charaKarakas, rashiDrishti } from "../charaDasha";

const chart = calculateKundali({ name: "T", date: "1990-04-12", time: "06:45", latitude: 26.9124, longitude: 75.7873, timezone: "Asia/Kolkata", place: "Jaipur" });

describe("KP lords", () => {
  it("matches the standard KP sub table at the start of Aries", () => {
    expect(kpLords(0.5)).toMatchObject({ signLord: "Mars", starLord: "Ketu", subLord: "Ketu" });
    expect(kpLords(0.8)).toMatchObject({ starLord: "Ketu", subLord: "Venus" }); // 0°46'40" onwards
    expect(kpLords(3.1)).toMatchObject({ starLord: "Ketu", subLord: "Sun" }); // 3°00' onwards
    expect(kpLords(13.4)).toMatchObject({ starLord: "Venus", subLord: "Venus" }); // Bharani begins
  });
});

describe("kpAnalysis", () => {
  const kp = kpAnalysis(chart, new Date("2026-09-28T06:00:00Z"));
  it("puts Placidus cusps in zodiac order, with the 1st and 10th near the Lagna and MC", () => {
    const lons = kp.cusps.map((c) => c.longitude);
    for (let i = 0; i < 12; i++) {
      const gap = (lons[(i + 1) % 12] - lons[i] + 360) % 360;
      expect(gap).toBeGreaterThan(10);
      expect(gap).toBeLessThan(60);
    }
    expect(Math.abs(((lons[0] - chart.ascendant.siderealLongitude + 540) % 360) - 180)).toBeLessThan(0.2);
    expect(Math.abs(((lons[9] - chart.midheaven + 540) % 360) - 180)).toBeLessThan(0.2);
  });
  it("lists significators and seven ruling planets", () => {
    expect(kp.planets).toHaveLength(9);
    for (const p of kp.planets) expect(p.signifies.length).toBeGreaterThan(0);
    expect(kp.rulingPlanets.list).toHaveLength(7);
    expect(kp.promises.map((p) => p.event)).toContain("Marriage");
  });
});

describe("Yogini dasha", () => {
  it("starts from (nakshatra + 3) mod 8", () => {
    expect(YOGINIS[firstYogini(0)].name).toBe("Bhramari"); // Ashwini: 1+3 = 4
    expect(YOGINIS[firstYogini(4)].name).toBe("Sankata"); // Mrigashira: 5+3 = 8
    expect(YOGINIS[firstYogini(5)].name).toBe("Mangala"); // Ardra: 6+3 = 9 → 1
  });
  it("runs a 36-year cycle with sub-periods that tile each Yogini", () => {
    const moon = chart.planets.find((p) => p.planet === "Moon")!;
    const d = yoginiDasha(moon.siderealLongitude, new Date(chart.utcDate), 80);
    const full = d.slice(1, 9).reduce((a, p) => a + (p.end.getTime() - p.start.getTime()), 0) / (365.25 * 86400000);
    expect(full).toBeCloseTo(36, 3);
    const y = d[2];
    expect(y.subPeriods[0].yogini.name).toBe(y.yogini.name);
    expect(y.subPeriods[7].end.getTime()).toBeCloseTo(y.end.getTime(), -3);
  });
});

describe("Chara dasha", () => {
  it("ranks karakas by degree and aspects by sign modality", () => {
    const k = charaKarakas(chart);
    expect(k).toHaveLength(7);
    for (let i = 1; i < 7; i++) expect(k[i - 1].degree).toBeGreaterThanOrEqual(k[i].degree);
    expect(rashiDrishti(0).sort((a, b) => a - b)).toEqual([4, 7, 10]); // Aries sees Leo, Scorpio, Aquarius (not Taurus)
    expect(rashiDrishti(2).sort((a, b) => a - b)).toEqual([5, 8, 11]); // Gemini sees the other duals
  });
  it("starts from the Lagna and gives each sign 1–12 years, the second cycle completing 12", () => {
    const d = charaDasha(chart, 120);
    expect(d[0].signIndex).toBe(chart.ascendant.signIndex);
    for (const p of d) {
      expect(p.years).toBeGreaterThanOrEqual(1);
      expect(p.years).toBeLessThanOrEqual(12);
    }
    for (let i = 0; i < 12 && i + 12 < d.length; i++) expect(d[i].signIndex).toBe(d[i + 12].signIndex);
    for (let i = 0; i < 12 && i + 12 < d.length; i++) if (d[i].years !== 12) expect(d[i].years + d[i + 12].years).toBe(12);
  });
});
