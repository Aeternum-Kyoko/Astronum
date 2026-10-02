import { describe, it, expect } from "vitest";
import { calculateKundali } from "../kundali";
import { baladiAvastha, birthTime, grahaTable, navamsaPosition } from "../dashboard";

const chart = calculateKundali({ name: "T", date: "1990-04-12", time: "06:45", latitude: 26.9124, longitude: 75.7873, timezone: "Asia/Kolkata", place: "Jaipur" });

describe("grahaTable", () => {
  const rows = grahaTable(chart);

  it("lists the Lagna then all nine grahas", () => {
    expect(rows.map((r) => r.planet)).toEqual(["Lagna", "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"]);
  });

  it("puts every graha in the same Navamsa sign as the D9 chart", () => {
    for (const r of rows.slice(1)) {
      expect(r.d9Sign, r.planet).toBe(chart.divisionalCharts.D9.planets.find((p) => p.planet === r.planet)!.sign);
      expect(r.d9Degree).toBeGreaterThanOrEqual(0);
      expect(r.d9Degree).toBeLessThan(30);
    }
    expect(rows[0].d9Sign).toBe(chart.divisionalCharts.D9.ascendant.sign);
  });

  it("assigns each of the seven Chara karakas once, and lords every house once", () => {
    const karakas = rows.map((r) => r.karaka).filter(Boolean);
    expect(new Set(karakas).size).toBe(7);
    expect(rows.flatMap((r) => r.rules).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it("carries Shadbala for the seven planets only", () => {
    expect(rows.filter((r) => r.shadbala).map((r) => r.planet)).toEqual(["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]);
  });
});

describe("navamsaPosition", () => {
  it("starts Aries at Aries and a fire sign's ninth navamsa at Sagittarius", () => {
    expect(navamsaPosition(1)).toEqual({ signIndex: 0, degree: 9 });
    expect(navamsaPosition(29.5).signIndex).toBe(8);
  });
});

describe("baladiAvastha", () => {
  it("counts forward in odd signs and backward in even signs", () => {
    expect(baladiAvastha(0, 2)).toBe("Bala");
    expect(baladiAvastha(0, 28)).toBe("Mrita");
    expect(baladiAvastha(1, 2)).toBe("Mrita");
    expect(baladiAvastha(1, 14)).toBe("Yuva");
  });
});

describe("birthTime", () => {
  it("gives the sunrise, Vedic weekday and Ishta Kaal", () => {
    const t = birthTime(chart)!;
    // Jaipur sunrise on 12 Apr 1990 was about 06:05 IST; 12 Apr 1990 was a Thursday.
    const sunriseIst = new Date(t.sunrise.getTime() + 5.5 * 3600_000).toISOString().slice(11, 16);
    expect(sunriseIst >= "06:00" && sunriseIst <= "06:10").toBe(true);
    expect(t.vara.name).toBe("Thursday");
    expect(t.ishtaKaal.ghati).toBe(1);
    expect(t.night).toBe(false);
  });

  it("keeps the previous Vedic day for a birth before sunrise", () => {
    const early = calculateKundali({ ...chart.input, time: "04:30" });
    expect(birthTime(early)!.vara.name).toBe("Wednesday");
    expect(birthTime(early)!.night).toBe(true);
  });
});
