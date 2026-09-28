import { describe, it, expect } from "vitest";
import { calculateKundali } from "../kundali";
import { houseReadings } from "../houseReadings";
import { careerAnalysis } from "../careerAnalysis";
import { lifeTimeline } from "../lifeTimeline";

const chart = calculateKundali({ name: "T", date: "1990-04-12", time: "06:45", latitude: 26.9124, longitude: 75.7873, timezone: "Asia/Kolkata", place: "Jaipur" });
const now = new Date("2026-09-28T00:00:00Z");

describe("houseReadings", () => {
  const houses = houseReadings(chart, now);
  it("reads all twelve houses with their lord, occupants and aspects", () => {
    expect(houses).toHaveLength(12);
    for (const h of houses) {
      const hl = chart.houseLords.find((x) => x.house === h.house)!;
      expect(h.lord).toBe(hl.lord);
      expect(h.lordText).toContain(h.lord);
      expect(h.occupants.map((o) => o.planet).sort()).toEqual(chart.planets.filter((p) => p.house === h.house).map((p) => p.planet).sort());
      expect(h.sav).toBe(chart.ashtakavarga.sarva[(chart.ascendant.signIndex + h.house - 1) % 12]);
      for (const o of h.occupants) expect(o.text.length).toBeGreaterThan(10);
    }
  });
  it("never lists a planet as aspecting the house it sits in", () => {
    for (const h of houses) for (const a of h.aspects) expect(chart.planets.find((p) => p.planet === a.planet)!.house).not.toBe(h.house);
  });
});

describe("careerAnalysis", () => {
  const c = careerAnalysis(chart, now);
  it("finds the 10th lord, Amatyakaraka and ranked fields", () => {
    expect(c.tenth.lord).toBe(chart.houseLords.find((h) => h.house === 10)!.lord);
    const degrees = chart.planets.filter((p) => p.planet !== "Rahu" && p.planet !== "Ketu").sort((a, b) => b.degreeInSign - a.degreeInSign);
    expect(c.atmakaraka).toBe(degrees[0].planet);
    expect(c.amatyakaraka).toBe(degrees[1].planet);
    expect(c.fields.length).toBeGreaterThan(0);
    expect(c.influences[0].weight).toBeGreaterThanOrEqual(c.influences[c.influences.length - 1].weight);
    expect(["Job", "Business", "Either"]).toContain(c.mode.verdict);
    for (const p of c.periods) expect(p.end.getTime()).toBeGreaterThan(now.getTime());
  });
});

describe("lifeTimeline", () => {
  const t = lifeTimeline(chart);
  it("covers life from birth to 90 in order", () => {
    expect(t.mahas[0].ageStart).toBe(0);
    expect(t.mahas[t.mahas.length - 1].ageEnd).toBeGreaterThan(85);
    for (const m of t.mahas) for (const a of m.antars) expect(a.ageEnd).toBeGreaterThan(a.ageStart - 1e-9);
  });
  it("only suggests events at plausible ages", () => {
    for (const m of t.mahas)
      for (const a of m.antars)
        for (const th of a.themes) {
          const mid = (a.ageStart + a.ageEnd) / 2;
          if (th.kind === "marriage") expect(mid).toBeGreaterThanOrEqual(20);
          if (th.kind === "education") expect(mid).toBeLessThanOrEqual(27);
          if (th.kind === "children") expect(mid).toBeGreaterThanOrEqual(22);
          expect(th.why.length).toBeGreaterThan(0);
        }
  });
  it("finds the first Saturn return around 29 and Jupiter returns about every 12 years", () => {
    const sat = t.milestones.find((m) => m.label === "Saturn return 1")!;
    expect(sat.age).toBeGreaterThan(26);
    expect(sat.age).toBeLessThan(31);
    const jup = t.milestones.filter((m) => m.label.startsWith("Jupiter return"));
    expect(jup[0].age).toBeGreaterThan(10);
    expect(jup[0].age).toBeLessThan(13);
    expect(jup[1].age - jup[0].age).toBeGreaterThan(10);
  });
});
