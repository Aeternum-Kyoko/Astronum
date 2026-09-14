import { describe, it, expect } from "vitest";
import { lahiriAyanamsa } from "../ayanamsa";

describe("lahiriAyanamsa", () => {
  it("equals the official J2000.0 anchor value exactly", () => {
    // 23°51'11.6" = 23.853222°, as published by Swiss Ephemeris/reference
    // sources for the official (frozen) Lahiri definition at JD 2451545.0.
    const value = lahiriAyanamsa(new Date(Date.UTC(2000, 0, 1, 12, 0, 0)));
    expect(value).toBeCloseTo(23.853222, 5);
  });

  it("is within an arcminute of the 1956 Calendar Reform Committee reference (23°15'00.66\")", () => {
    const value = lahiriAyanamsa(new Date(Date.UTC(1956, 2, 21, 0, 0, 0)));
    const expected = 23 + 15 / 60 + 0.658 / 3600;
    expect(Math.abs(value - expected)).toBeLessThan(1 / 60);
  });

  it("increases monotonically over time (precession only moves one direction)", () => {
    const a = lahiriAyanamsa(new Date(Date.UTC(1980, 0, 1)));
    const b = lahiriAyanamsa(new Date(Date.UTC(2000, 0, 1)));
    const c = lahiriAyanamsa(new Date(Date.UTC(2020, 0, 1)));
    expect(a).toBeLessThan(b);
    expect(b).toBeLessThan(c);
  });

  it("moves at roughly the general precession rate (~50.3 arcsec/year)", () => {
    const a = lahiriAyanamsa(new Date(Date.UTC(2000, 0, 1)));
    const b = lahiriAyanamsa(new Date(Date.UTC(2001, 0, 1)));
    const arcsecPerYear = (b - a) * 3600;
    expect(arcsecPerYear).toBeGreaterThan(50);
    expect(arcsecPerYear).toBeLessThan(50.6);
  });
});
