import { describe, it, expect } from "vitest";
import { calculateKundali } from "../kundali";
import { monthlyForecast, personalYear } from "../monthlyForecast";
import { planetDiagnosis } from "../planetDiagnosis";
import { periodsAt } from "../dashaTree";
import { siderealLongitude } from "../ephemeris";

const chart = calculateKundali({ name: "T", date: "1990-04-12", time: "06:45", latitude: 26.9124, longitude: 75.7873, timezone: "Asia/Kolkata", place: "Jaipur" });
const f = monthlyForecast(chart, new Date("2026-08-05T00:00:00Z"));

describe("monthlyForecast", () => {
  it("covers twelve consecutive months from the current one, each with six life areas", () => {
    expect(f.months.map((m) => m.month)).toEqual(["2026-08", "2026-09", "2026-10", "2026-11", "2026-12", "2027-01", "2027-02", "2027-03", "2027-04", "2027-05", "2027-06", "2027-07"]);
    for (const m of f.months) expect(m.areas.map((a) => a.key)).toEqual(["career", "money", "love", "health", "home", "growth"]);
  });

  it("scores every area as the sum of its listed reasons", () => {
    for (const m of f.months)
      for (const a of m.areas) {
        const raw = Math.round(50 + a.reasons.reduce((s, r) => s + r.points, 0));
        expect(a.score).toBe(Math.max(8, Math.min(95, raw)));
      }
  });

  it("uses the dasha running at mid-month", () => {
    for (const m of f.months) {
      const [md, ad] = periodsAt(chart.dashas, new Date(`${m.month}-15T00:00:00Z`), 2);
      expect(m.dasha.maha).toBe(md.lord);
      expect(m.dasha.antar).toBe(ad.lord);
      expect(m.dasha.pratyantars.length).toBeGreaterThan(0);
    }
  });

  it("lists the August 2026 solar and lunar eclipses", () => {
    const aug = f.months[0].keyDates.map((k) => `${k.date} ${k.text}`);
    expect(aug.some((t) => t.startsWith("2026-08-12") && /Solar eclipse/.test(t))).toBe(true);
    expect(aug.some((t) => t.startsWith("2026-08-28") && /Lunar eclipse/.test(t))).toBe(true);
  });

  it("dates sign changes to the day", () => {
    for (const m of f.months)
      for (const k of m.keyDates.filter((k) => /^Sun enters/.test(k.text))) {
        // The change happens within that day at the birth place (IST).
        const dayStart = Math.floor(siderealLongitude("Sun", new Date(`${k.date}T00:00:00+05:30`)) / 30);
        const dayEnd = Math.floor(siderealLongitude("Sun", new Date(`${k.date}T23:59:59+05:30`)) / 30);
        expect(dayEnd).not.toBe(dayStart);
      }
  });

  it("marks Chandrashtama only while the Moon is in the 8th from the natal Moon", () => {
    const moon = chart.planets.find((p) => p.planet === "Moon")!;
    for (const c of f.months[1].chandrashtama) {
      // Dates are days at the birth place (IST); some moment of each listed span has the Moon there.
      const from = new Date(`${c.start}T00:00:00+05:30`).getTime();
      const to = new Date(`${c.end}T23:59:00+05:30`).getTime();
      const signs = new Set<number>();
      for (let t = from; t <= to; t += 3 * 3600_000) signs.add(Math.floor(siderealLongitude("Moon", new Date(t)) / 30));
      expect(signs.has((moon.signIndex + 7) % 12)).toBe(true);
    }
  });

  it("never lets Rahu and Ketu block each other by vedha", () => {
    for (const m of f.months) for (const t of m.transits) if (t.planet === "Rahu" || t.planet === "Ketu") expect(["Rahu", "Ketu"]).not.toContain(t.vedhaBy);
  });

  it("summarises the best months", () => {
    expect(f.summary.trend).toHaveLength(12);
    expect(f.months.map((m) => m.label)).toContain(f.summary.bestMonth);
  });
});

describe("personalYear", () => {
  it("adds the birth day, birth month and reduced calendar year", () => {
    expect(personalYear("1990-04-12", 2026)).toBe(8); // 12 + 4 + (2+0+2+6=10→1) = 17 → 8
  });
});

describe("planetDiagnosis", () => {
  it("grades all nine planets from their listed factors", () => {
    const d = planetDiagnosis(chart);
    expect(d.map((x) => x.planet)).toEqual(["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"]);
    for (const x of d) expect(x.score).toBe(Math.max(0, Math.min(100, Math.round(50 + x.factors.reduce((a, y) => a + y.points, 0)))));
    expect(d.find((x) => x.planet === "Mars")!.factors.some((y) => /Exalted in the Rasi/.test(y.label))).toBe(true);
  });
});
