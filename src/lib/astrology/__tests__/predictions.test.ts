import { describe, it, expect } from "vitest";
import { calculateKundali } from "../kundali";
import { dashaReadings, lifeAreaReadings, planetReadings } from "../predictions";

const chart = calculateKundali({
  name: "Test",
  date: "1990-04-12",
  time: "06:45",
  latitude: 26.9124,
  longitude: 75.7873,
  timezone: "Asia/Kolkata",
  place: "Jaipur",
});
const NOW = new Date("2026-09-27T00:00:00Z");

describe("planetReadings", () => {
  const readings = planetReadings(chart);

  it("reads all nine planets with house, sign and nakshatra text", () => {
    expect(readings).toHaveLength(9);
    for (const r of readings) {
      expect(r.house.length).toBeGreaterThan(20);
      expect(r.sign).toContain(chart.planets.find((p) => p.planet === r.planet)!.sign);
      expect(r.nakshatra).toMatch(/nakshatra, pada [1-4]/);
    }
  });

  it("uses the right article before the element", () => {
    for (const r of readings) expect(r.sign).not.toMatch(/ a (air|earth)/);
  });

  it("gives lordship text to the seven sign lords but not to the nodes", () => {
    expect(readings.find((r) => r.planet === "Rahu")!.lordship).toBeNull();
    expect(readings.find((r) => r.planet === "Mars")!.lordship).toMatch(/1st and 8th houses/); // Aries Lagna
  });
});

describe("lifeAreaReadings", () => {
  const areas = lifeAreaReadings(chart, NOW);

  it("covers every house through thirteen life areas, each with a 1–5 rating and reasons", () => {
    expect(areas.map((a) => a.key)).toEqual(["self", "career", "wealth", "marriage", "education", "children", "home", "siblings", "health", "longevity", "fortune", "gains", "foreign"]);
    const covered = new Set(areas.flatMap((a) => a.points.join(" ").match(/Your (\d+)(st|nd|rd|th) house/g) ?? []));
    expect(covered.size).toBe(12);
    for (const a of areas) {
      expect(a.rating).toBeGreaterThanOrEqual(1);
      expect(a.rating).toBeLessThanOrEqual(5);
      expect(a.points.length).toBeGreaterThan(1);
    }
  });

  it("lists only future periods whose lord is tied to the area, in date order", () => {
    for (const a of areas) {
      for (const p of a.periods) expect(p.end.getTime()).toBeGreaterThan(NOW.getTime());
      const starts = a.periods.map((p) => p.start.getTime());
      expect([...starts].sort((x, y) => x - y)).toEqual(starts);
    }
    const career = areas.find((a) => a.key === "career")!;
    expect(career.periods.length).toBeGreaterThan(0);
  });

  it("mentions the career and marriage divisional charts", () => {
    expect(areas.find((a) => a.key === "career")!.points.join(" ")).toMatch(/Dasamsa \(D10\)/);
    expect(areas.find((a) => a.key === "marriage")!.points.join(" ")).toMatch(/Navamsa \(D9\)/);
  });
});

describe("dashaReadings", () => {
  const readings = dashaReadings(chart);

  it("reads every Mahadasha with its Antardashas", () => {
    expect(readings).toHaveLength(chart.dashas.length);
    readings.forEach((r, i) => {
      // The birth Mahadasha was already under way at birth, so only its remaining Antardashas exist.
      if (i === 0) expect(r.antardashas.length).toBeGreaterThan(0);
      else expect(r.antardashas).toHaveLength(9);
      expect(r.text.length).toBeGreaterThanOrEqual(4);
    });
  });

  it("explains the tone with the actual reasons", () => {
    const mercury = readings.find((r) => r.lord === "Mercury")!;
    const summary = mercury.text[mercury.text.length - 1];
    expect(summary).not.toMatch(/favourable houses/);
    expect(summary).toMatch(/1st house/);
  });

  it("describes the nodes through their dispositor", () => {
    expect(readings.find((r) => r.lord === "Rahu")!.text.join(" ")).toMatch(/dispositor/);
  });
});
