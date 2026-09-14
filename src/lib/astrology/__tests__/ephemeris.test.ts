import { describe, it, expect } from "vitest";
import * as Astronomy from "astronomy-engine";
import { computeRawPositions, isRetrograde } from "../ephemeris";

/**
 * These tests deliberately avoid depending on memorized reference charts.
 * Instead they check our ephemeris wrapper against astronomy-engine's own
 * authoritative event solvers (equinoxes/solstices, eclipses) — if our
 * GeoVector/Ecliptic plumbing has a sign error, wrong frame, or unit bug,
 * it will disagree with these independently-computed instants.
 */

describe("tropical longitude at seasonal markers", () => {
  it.each([2015, 1990, 2026, 2050])("matches Sun = 0/90/180/270° at the %i equinoxes/solstices", (year) => {
    const seasons = Astronomy.Seasons(year);
    const check = (date: Date, expectedLongitude: number) => {
      const sunLon = computeRawPositions(date).tropicalLongitudes.Sun;
      let diff = Math.abs(sunLon - expectedLongitude);
      if (diff > 180) diff = 360 - diff;
      expect(diff).toBeLessThan(0.01);
    };

    check(seasons.mar_equinox.date, 0);
    check(seasons.jun_solstice.date, 90);
    check(seasons.sep_equinox.date, 180);
    check(seasons.dec_solstice.date, 270);
  });
});

describe("Sun/Moon alignment at solar eclipses", () => {
  it("puts Sun and Moon within a fraction of a degree of each other at eclipse peak", () => {
    // Search from a fixed date rather than "now" so the test is deterministic.
    const eclipse = Astronomy.SearchGlobalSolarEclipse(new Date(Date.UTC(2015, 0, 1)));
    const { tropicalLongitudes } = computeRawPositions(eclipse.peak.date);
    let diff = Math.abs(tropicalLongitudes.Sun - tropicalLongitudes.Moon);
    if (diff > 180) diff = 360 - diff;
    expect(diff).toBeLessThan(1);
  });
});

describe("retrograde detection", () => {
  it("agrees with astronomy-engine's own apsis/longitude solver on a known Mercury retrograde window", () => {
    // Find a Mercury inferior conjunction (body passes between Earth and Sun,
    // the middle of every retrograde loop) and confirm we call it retrograde there.
    const conjunction = Astronomy.SearchRelativeLongitude(Astronomy.Body.Mercury, 0, new Date(Date.UTC(2024, 0, 1)));
    expect(isRetrograde("Mercury", conjunction.date)).toBe(true);
  });

  it("does not call Mercury retrograde a month after a conjunction", () => {
    const conjunction = Astronomy.SearchRelativeLongitude(Astronomy.Body.Mercury, 0, new Date(Date.UTC(2024, 0, 1)));
    const monthLater = new Date(conjunction.date.getTime() + 30 * 86400000);
    expect(isRetrograde("Mercury", monthLater)).toBe(false);
  });
});
