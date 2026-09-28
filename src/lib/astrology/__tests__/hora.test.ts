import { describe, it, expect } from "vitest";
import { computeHoras, computeDailyPanchang } from "../panchang";

describe("computeHoras", () => {
  const rise = new Date("2024-01-14T01:45:00Z");
  const set = new Date("2024-01-14T12:15:00Z");
  const next = new Date("2024-01-15T01:45:00Z");

  it("starts the day with the weekday lord and the night five lords on", () => {
    // Sunday: Sun rules sunrise, Jupiter the first night hora; Monday: Moon, then Venus.
    expect(computeHoras(rise, set, next, 0).day[0].lord).toBe("Sun");
    expect(computeHoras(rise, set, next, 0).night[0].lord).toBe("Jupiter");
    expect(computeHoras(rise, set, next, 1).day[0].lord).toBe("Moon");
    expect(computeHoras(rise, set, next, 1).night[0].lord).toBe("Venus");
  });

  it("follows the Chaldean order and ends the night one before the next weekday lord", () => {
    const h = computeHoras(rise, set, next, 0);
    expect(h.day.slice(0, 7).map((x) => x.lord)).toEqual(["Sun", "Venus", "Mercury", "Moon", "Saturn", "Jupiter", "Mars"]);
    // 24 horas later the Moon (Monday's lord) comes up again at sunrise.
    expect(["Sun", "Venus", "Mercury", "Moon", "Saturn", "Jupiter", "Mars"][24 % 7]).toBe("Moon");
    expect(h.day[11].end.getTime()).toBe(set.getTime());
    expect(h.night[11].end.getTime()).toBe(next.getTime());
  });

  it("is part of the daily panchang", () => {
    const p = computeDailyPanchang("2024-01-11", 28.6139, 77.209, "Asia/Kolkata");
    expect(p.hora.day[0].lord).toBe("Jupiter"); // a Thursday
    expect(p.hora.day[0].start.getTime()).toBe(p.sunrise.getTime());
  });
});
