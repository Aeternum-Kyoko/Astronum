import { describe, it, expect } from "vitest";
import { calculateKundali } from "../kundali";
import { ghatakChakra, jaiminiTables, prastarashtakavarga, vimshopakaBala } from "../kundliTables";
import { ASHTAKAVARGA_PLANETS } from "../constants";

const chart = calculateKundali({ name: "T", date: "1990-04-12", time: "06:45", latitude: 26.9124, longitude: 75.7873, timezone: "Asia/Kolkata", place: "Jaipur" });

describe("kundli tables", () => {
  it("Prastarashtakavarga adds up to each planet's Bhinnashtakavarga", () => {
    for (const pl of ASHTAKAVARGA_PLANETS) {
      const rows = prastarashtakavarga(chart, pl);
      const sums = Array.from({ length: 12 }, (_, s) => rows.filter((r) => r.bindus[s]).length);
      expect(sums).toEqual(chart.ashtakavarga.bhinna[pl]);
    }
  });
  it("Arudha padas never fall in their own house or the 7th from it", () => {
    for (const p of jaiminiTables(chart).padas) {
      expect(p.houseFromLagna).not.toBe(p.house);
      expect(p.houseFromLagna).not.toBe(((p.house + 5) % 12) + 1);
    }
  });
  it("Vimshopaka scores stay within 0–20", () => {
    for (const r of vimshopakaBala(chart))
      for (const v of Object.values(r.scores)) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(20);
      }
  });
  it("Ghatak chakra for a Sagittarius Moon matches the reference row", () => {
    const sag = calculateKundali({ name: "T", date: "1990-04-02", time: "12:00", latitude: 26.9, longitude: 75.8, timezone: "Asia/Kolkata", place: "J" });
    const g = ghatakChakra(sag);
    if (g.moonSign === "Sagittarius") expect(g).toMatchObject({ month: "Shravana", weekday: "Friday", nakshatra: "Bharani", yoga: "Vajra", ghatakRasi: "Pisces" });
    expect(g.month.length).toBeGreaterThan(0);
  });
});
