import { describe, it, expect } from "vitest";
import { calculateKundali } from "../kundali";
import { childPeriods, formatSpan, fullYears, periodsAt, type TreePeriod } from "../dashaTree";

const chart = calculateKundali({ name: "T", date: "1990-04-12", time: "06:45", latitude: 26.9124, longitude: 75.7873, timezone: "Asia/Kolkata", place: "Jaipur" });
const close = (a: Date, b: Date) => Math.abs(a.getTime() - b.getTime()) < 2000;
const asTree = (m: (typeof chart.dashas)[number]): TreePeriod => ({ lord: m.lord, start: m.start, end: m.end, chain: [m.lord] });

describe("childPeriods", () => {
  it("reproduces the chart's own Antardashas exactly, including the birth-truncated Mahadasha", () => {
    for (const maha of chart.dashas.slice(0, 4)) {
      const mine = childPeriods(asTree(maha));
      const theirs = maha.subPeriods!;
      expect(mine.map((p) => p.lord)).toEqual(theirs.map((p) => p.lord));
      mine.forEach((p, i) => {
        expect(close(p.start, theirs[i].start)).toBe(true);
        expect(close(p.end, theirs[i].end)).toBe(true);
      });
    }
  });

  it("reproduces the chart's Pratyantardashas too", () => {
    const maha = chart.dashas[1];
    const antar = childPeriods(asTree(maha))[2];
    const mine = childPeriods(antar);
    const theirs = maha.subPeriods![2].subPeriods!;
    mine.forEach((p, i) => expect(close(p.end, theirs[i].end)).toBe(true));
  });

  it("tiles each parent exactly, down to Prana level", () => {
    let period = asTree(chart.dashas[2]);
    for (let depth = 1; depth < 5; depth++) {
      const kids = childPeriods(period);
      expect(kids).toHaveLength(9);
      expect(close(kids[0].start, period.start)).toBe(true);
      expect(close(kids[8].end, period.end)).toBe(true);
      period = kids[3];
    }
    expect(period.chain).toHaveLength(5);
    // A Prana period is hours to days long.
    expect(period.end.getTime() - period.start.getTime()).toBeLessThan(40 * 86400_000);
  });

  it("starts each division with the parent's own lord", () => {
    const kids = childPeriods(asTree(chart.dashas[2]));
    expect(kids[0].lord).toBe(chart.dashas[2].lord);
  });
});

describe("periodsAt", () => {
  it("finds the running chain down to Prana and matches the chart's current periods", () => {
    const now = new Date("2026-09-27T12:00:00Z");
    const path = periodsAt(chart.dashas, now);
    expect(path).toHaveLength(5);
    for (const p of path) expect(p.start.getTime() <= now.getTime() && now.getTime() < p.end.getTime()).toBe(true);
    expect(path[0].lord).toBe(chart.dashas.find((d) => d.start <= now && now < d.end)!.lord);
  });
});

describe("helpers", () => {
  it("computes full lengths from the lord chain", () => {
    expect(fullYears(["Venus"])).toBe(20);
    expect(fullYears(["Venus", "Venus"])).toBeCloseTo((20 * 20) / 120);
  });

  it("formats spans with their two largest units", () => {
    expect(formatSpan(20 * 365.25 * 86400000)).toBe("20y");
    expect(formatSpan(3 * 86400000 + 5 * 3600000)).toBe("3d 5h");
    expect(formatSpan(95 * 60000)).toBe("1h 35min");
  });
});
