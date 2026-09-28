import { describe, it, expect } from "vitest";
import { monthlyHoroscope, retrogradePeriods, weeklyHoroscope, yearlyHoroscope } from "../periodHoroscope";

describe("weeklyHoroscope", () => {
  const w = weeklyHoroscope(0, "2024-01-11"); // Aries, the week of Thu 11 Jan 2024

  it("covers Monday to Sunday of the given date's week", () => {
    expect(w.weekStart).toBe("2024-01-08");
    expect(w.weekEnd).toBe("2024-01-14");
    expect(w.days).toHaveLength(7);
  });

  it("reads the Moon's house each day from the sign", () => {
    // 11 Jan 2024 06:00 IST: Moon in Sagittarius = 9th from Aries.
    expect(w.days.find((d) => d.date === "2024-01-11")!.moonHouse).toBe(9);
    for (const d of w.bestDays) expect(w.days.find((x) => x.date === d)!.tone).toBe("Favourable");
    expect(w.rating).toBeGreaterThanOrEqual(1);
    expect(w.rating).toBeLessThanOrEqual(5);
  });
});

describe("monthlyHoroscope", () => {
  it("groups Chandrashtama days into windows of two or three days", () => {
    const m = monthlyHoroscope(0, "2024-03");
    expect(m.chandrashtama.length).toBeGreaterThan(0);
    for (const w of m.chandrashtama) {
      const span = (Date.parse(w.to) - Date.parse(w.from)) / 86400_000 + 1;
      expect(span).toBeGreaterThanOrEqual(1);
      expect(span).toBeLessThanOrEqual(3);
    }
  });

  it("reports the Sun's ingress during the month", () => {
    // The Sun enters sidereal Pisces around 14 March.
    const m = monthlyHoroscope(0, "2024-03");
    const sun = m.movements.find((x) => x.planet === "Sun")!;
    expect(sun.sign).toBe("Pisces");
    expect(sun.date.getUTCDate()).toBeGreaterThanOrEqual(13);
    expect(sun.date.getUTCDate()).toBeLessThanOrEqual(15);
  });
});

describe("yearlyHoroscope", () => {
  const y = yearlyHoroscope(10, 2024); // Aquarius Moon sign, 2024

  it("tracks Jupiter's move from Aries to Taurus in May 2024", () => {
    const jupiter = y.slowPlanets.filter((s) => s.planet === "Jupiter").map((s) => s.sign);
    expect(jupiter).toEqual(["Aries", "Taurus"]);
  });

  it("puts Saturn over an Aquarius Moon all year — the peak of Sade Sati", () => {
    const saturn = y.slowPlanets.filter((s) => s.planet === "Saturn");
    expect(saturn).toHaveLength(1);
    expect(saturn[0].house).toBe(1);
    expect(saturn[0].text).toMatch(/peak of Sade Sati/);
  });

  it("gives a month-by-month Sun table and the year's retrogrades", () => {
    expect(y.months).toHaveLength(12);
    const mercury = y.retrogrades.filter((r) => r.planet === "Mercury");
    expect(mercury.length).toBeGreaterThanOrEqual(3); // Mercury turns retrograde three or four times a year
  });
});

describe("retrogradePeriods", () => {
  it("finds Mercury's April 2024 retrograde (1–25 April)", () => {
    const r = retrogradePeriods("Mercury", new Date("2024-03-15"), new Date("2024-05-15"));
    expect(r).toHaveLength(1);
    expect(Math.abs(r[0].from.getTime() - Date.parse("2024-04-01"))).toBeLessThan(2 * 86400_000);
    expect(Math.abs(r[0].to.getTime() - Date.parse("2024-04-25"))).toBeLessThan(2 * 86400_000);
  });
});
