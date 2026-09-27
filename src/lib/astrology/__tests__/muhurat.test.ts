import { describe, it, expect } from "vitest";
import { ACTIVITIES, findMuhurats } from "../muhurat";

const DELHI = { latitude: 28.6139, longitude: 77.209, timezone: "Asia/Kolkata" };

describe("findMuhurats", () => {
  it("only returns days whose nakshatra and weekday are allowed for the activity", () => {
    const { days } = findMuhurats("vehicle", "2024-02", DELHI);
    expect(days.length).toBeGreaterThan(0);
    for (const d of days) {
      expect(ACTIVITIES.vehicle.nakshatras as readonly string[]).toContain(d.nakshatra);
      expect(d.tithi).not.toMatch(/Chaturthi|Navami|Chaturdashi|Amavasya|Ashtami/);
      expect(d.date.startsWith("2024-02")).toBe(true);
    }
  });

  it("blocks marriages during Chaturmas", () => {
    // August 2024 sits inside Chaturmas (Devshayani 17 Jul – Devutthana 12 Nov).
    const r = findMuhurats("marriage", "2024-08", DELHI);
    expect(r.days).toHaveLength(0);
    expect(r.blockedReason).toMatch(/Chaturmas/);
  });

  it("blocks griha pravesh during Kharmas", () => {
    // The Sun is in sidereal Sagittarius from mid-December to mid-January.
    const r = findMuhurats("griha-pravesh", "2024-12", DELHI);
    for (const d of r.days) expect(Number(d.date.slice(8))).toBeLessThan(16);
  });

  it("suggests a daytime window that avoids Rahu Kaal", () => {
    for (const d of findMuhurats("business", "2024-03", DELHI).days) {
      const overlaps = d.window.start < d.rahuKaal.end && d.window.end > d.rahuKaal.start;
      expect(overlaps).toBe(false);
    }
  });
});
