import { describe, it, expect } from "vitest";
import { calculateKundali } from "../kundali";
import { computeRemedies, PLANET_REMEDIES } from "../remedies";
import { PLANETS } from "../constants";

// Aries Lagna chart (Jaipur, 12 Apr 1990 06:45): lords — 1 Mars, 5 Sun, 9 Jupiter, 6 Mercury, 8 Mars, 12 Jupiter.
const chart = calculateKundali({
  name: "Test",
  date: "1990-04-12",
  time: "06:45",
  latitude: 26.9124,
  longitude: 75.7873,
  timezone: "Asia/Kolkata",
  place: "Jaipur",
});
const plan = computeRemedies(chart);

describe("computeRemedies — stones", () => {
  it("recommends life, lucky and fortune stones from the Lagna, 5th and 9th lords", () => {
    expect(chart.ascendant.sign).toBe("Aries");
    const byKind = Object.fromEntries(plan.stones.map((s) => [s.kind, s.planet]));
    expect(byKind["Life stone"]).toBe("Mars"); // Mars rules the 8th too, but as Lagna lord it's allowed
    expect(byKind["Lucky stone"]).toBe("Sun");
    // Jupiter rules the 9th but also the 12th (a dusthana), so no fortune stone is suggested.
    expect(byKind["Fortune stone"]).toBeUndefined();
  });

  it("never suggests a gem for a dusthana lord that isn't the Lagna lord", () => {
    const mercury = plan.support.find((s) => s.planet === "Mercury");
    if (mercury) expect(mercury.gemSuitable).toBe(false); // Mercury rules the 3rd and 6th for Aries Lagna
    for (const s of plan.support) {
      if (s.planet === "Rahu" || s.planet === "Ketu") expect(s.gemSuitable).toBe(false);
    }
  });
});

describe("computeRemedies — support and doshas", () => {
  it("gives every planet it lists at least one concrete reason", () => {
    for (const s of plan.support) expect(s.reasons.length).toBeGreaterThan(0);
  });

  it("includes the running Mahadasha lord", () => {
    expect(plan.support.map((s) => s.planet)).toContain(chart.currentDasha!.lord);
  });

  it("only lists remedies for doshas that are actually present", () => {
    // This chart's Mangal Dosha is cancelled (exalted Mars), so it must not appear.
    expect(chart.mangalDosha.status).toBe("cancelled");
    expect(plan.doshas.map((d) => d.name)).not.toContain("Mangal Dosha");
  });

  it("has complete remedy data for all nine planets", () => {
    for (const p of PLANETS) {
      const r = PLANET_REMEDIES[p];
      expect(r.gem && r.mantra && r.day && r.charity && r.rudraksha).toBeTruthy();
    }
  });
});
