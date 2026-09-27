import { describe, it, expect } from "vitest";
import { calculateKundali } from "../kundali";
import { analyzeYogas } from "../yogaAnalysis";
import { SIGNS } from "../constants";

const base = { name: "T", latitude: 26.9124, longitude: 75.7873, timezone: "Asia/Kolkata", place: "Jaipur" };
const chart = calculateKundali({ ...base, date: "1990-04-12", time: "06:45" });
const now = new Date("2026-09-27T00:00:00Z");

/** A chart for each Lagna: scan one day hour by hour. */
function chartFor(lagna: string) {
  for (let h = 0; h < 24; h++) {
    for (const m of ["00", "30"]) {
      const c = calculateKundali({ ...base, date: "2000-01-15", time: `${String(h).padStart(2, "0")}:${m}` });
      if (c.ascendant.sign === lagna) return c;
    }
  }
  throw new Error(lagna);
}

describe("analyzeYogas", () => {
  it("names the classical Yogakaraka for each Lagna", () => {
    const expected: Record<string, string | null> = {
      Aries: null, Taurus: "Saturn", Gemini: null, Cancer: "Mars", Leo: "Mars", Virgo: null,
      Libra: "Saturn", Scorpio: null, Sagittarius: null, Capricorn: "Venus", Aquarius: "Venus", Pisces: null,
    };
    for (const sign of SIGNS) expect(analyzeYogas(chartFor(sign), now).yogakaraka, sign).toBe(expected[sign]);
  });

  it("classifies functional benefics and malefics by lordship", () => {
    const aries = analyzeYogas(chartFor("Aries"), now).functional;
    expect(aries.benefics).toEqual(expect.arrayContaining(["Mars", "Sun", "Jupiter"]));
    expect(aries.malefics).toEqual(expect.arrayContaining(["Mercury", "Saturn"]));
  });

  it("only reports Raj Yogas between a kendra lord and a trikona lord", () => {
    const a = analyzeYogas(chart, now);
    const lordOf = (h: number) => chart.houseLords.find((l) => l.house === h)!.lord;
    const kendra = new Set([1, 4, 7, 10].map(lordOf));
    const trikona = new Set([1, 5, 9].map(lordOf));
    for (const f of a.findings.filter((f) => f.category === "raja" && !f.id.endsWith("Rahu") && !f.id.endsWith("Ketu"))) {
      const [x, y] = f.planets;
      expect((kendra.has(x) && trikona.has(y)) || (kendra.has(y) && trikona.has(x))).toBe(true);
      expect(f.reasons.length).toBeGreaterThan(0);
    }
  });

  it("gives every finding a formation and future activation windows", () => {
    for (const f of analyzeYogas(chart, now).findings) {
      expect(f.formation.length).toBeGreaterThan(10);
      for (const w of f.activation) expect(w.end.getTime()).toBeGreaterThan(now.getTime());
      if (f.category === "arishta") expect(["Mitigated", "Moderate"]).toContain(f.strength);
    }
  });

  it("finds some yogas across a spread of charts", () => {
    const cats = new Set<string>();
    for (let h = 0; h < 24; h += 3) analyzeYogas(calculateKundali({ ...base, date: "1985-06-10", time: `${String(h).padStart(2, "0")}:00` }), now).findings.forEach((f) => cats.add(f.category));
    expect([...cats]).toEqual(expect.arrayContaining(["raja", "dhana", "arishta"]));
  });
});
