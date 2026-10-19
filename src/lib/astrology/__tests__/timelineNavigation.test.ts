import { describe, expect, it } from "vitest";
import { calculateKundali } from "../kundali";
import { childPeriods } from "../dashaTree";
import { timelineBoundaries, timelinePosition } from "../timelineNavigation";

const chart = calculateKundali({ name: "Test", date: "1990-04-12", time: "06:45", latitude: 26.9124, longitude: 75.7873, timezone: "Asia/Kolkata", place: "Jaipur" });

describe("selected-date timeline navigation", () => {
  it("moves to the nearest visible subperiod boundary at an exact transition", () => {
    const roots = timelineBoundaries(chart.dashas, new Date(chart.dashas[0].start)).roots;
    const periods = roots.flatMap(childPeriods).flatMap(childPeriods);
    const boundary = periods[12].start;
    const result = timelineBoundaries(chart.dashas, boundary);
    expect(result.previous?.getTime()).toBe(periods[11].start.getTime());
    expect(result.next?.getTime()).toBe(periods[13].start.getTime());
    expect(result.roots.length).toBe(chart.dashas.length);
  });
  it("clamps the marker and keeps the midpoint proportional to elapsed time", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const end = new Date("2026-01-11T00:00:00Z");
    expect(timelinePosition(start, end, new Date("2026-01-06T00:00:00Z"))).toBe(50);
    expect(timelinePosition(start, end, new Date("2025-12-31T00:00:00Z"))).toBe(0);
    expect(timelinePosition(start, end, end)).toBe(100);
  });
});
