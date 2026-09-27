import { describe, it, expect } from "vitest";
import { calculateKundali } from "../kundali";
import { computeDailyTransits } from "../horoscope";
import { personalDay, TARAS } from "../personalDaily";
import { NAKSHATRAS } from "../constants";

const chart = calculateKundali({ name: "T", date: "1990-04-12", time: "06:45", latitude: 26.9124, longitude: 75.7873, timezone: "Asia/Kolkata", place: "Jaipur" });

describe("personalDay", () => {
  const t = computeDailyTransits("2026-09-27", "Asia/Kolkata");
  const day = personalDay(chart, t, new Date("2026-09-27T06:00:00Z"));
  const moon = chart.planets.find((p) => p.planet === "Moon")!;

  it("counts Tarabala from the birth nakshatra", () => {
    const today = NAKSHATRAS.indexOf(t.moonNakshatra as (typeof NAKSHATRAS)[number]);
    const count = ((today - moon.nakshatraIndex + 27) % 27) + 1;
    expect(day.tarabala.count).toBe(count);
    expect(day.tarabala.tara).toBe(TARAS[(count - 1) % 9]);
  });

  it("counts Chandrabala from the natal Moon sign", () => {
    expect(day.chandrabala.house).toBe(((t.moonSignIndex - moon.signIndex + 12) % 12) + 1);
  });

  it("explains every planet and keeps the score in range", () => {
    expect(day.transits).toHaveLength(9);
    for (const r of day.transits) expect(r.reason).toContain(r.planet);
    expect(day.transits.find((r) => r.planet === "Rahu")!.bindus).toBeNull();
    expect(day.score).toBeGreaterThanOrEqual(0);
    expect(day.score).toBeLessThanOrEqual(100);
    expect(day.stars).toBeGreaterThanOrEqual(1);
    expect(day.stars).toBeLessThanOrEqual(5);
    expect(day.dasha.chain).toHaveLength(3);
  });

  it("Janma tara on the day the Moon returns to the birth star", () => {
    expect(TARAS[0].name).toBe("Janma");
    expect(TARAS[0].good).toBe(false);
  });
});
