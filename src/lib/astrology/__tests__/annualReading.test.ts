import { describe, expect, it } from "vitest";
import { annualReading } from "../annualReading";
import { calculateKundali } from "../kundali";
import { periodsAt } from "../dashaTree";
const chart = calculateKundali({ name: "Test", date: "1990-04-12", time: "06:45:32", latitude: 26.9124, longitude: 75.7873, timezone: "Asia/Kolkata", place: "Jaipur" });
describe("annual Kundli reading", () => {
  const r = annualReading(chart, 2026);
  it("preserves solar-return seconds and ends at the next return", () => {
    expect(Math.abs(+new Date(r.annual.chart.utcDate) - +r.annual.returnMoment)).toBeLessThan(1000);
    expect(+r.end - +r.annual.returnMoment).toBeGreaterThan(364 * 86400000);
    expect(+r.end - +r.annual.returnMoment).toBeLessThan(367 * 86400000);
  });
  it("uses the natal dasha chain and correct natal/annual house ownership", () => {
    expect(r.chain).toEqual(periodsAt(chart.dashas, r.at, 3));
    for (const area of r.areas) {
      expect(area.natal.lord).toEqual(chart.houseLords.find(h => h.house === area.house));
      expect(area.annual.lord).toEqual(r.annual.chart.houseLords.find(h => h.house === area.house));
      expect(area.natal.vargas).toHaveLength(1);
    }
    expect(r.periods.every(p => +new Date(p.end) > +r.annual.returnMoment && +new Date(p.start) < +r.end)).toBe(true);
  });
  it("recomputes a later snapshot without changing the annual chart", () => {
    const later = annualReading(chart, 2026, new Date("2026-10-10T06:30:00Z"));
    expect(later.annual.chart.utcDate).toEqual(r.annual.chart.utcDate);
    expect(later.transits.find(p => p.planet === "Sun")?.signIndex).not.toBe(r.transits.find(p => p.planet === "Sun")?.signIndex);
  });
  it("rejects pre-birth years and snapshots outside the selected annual interval", () => {
    expect(() => annualReading(chart, 1989)).toThrow();
    expect(() => annualReading(chart, 2026, new Date("2026-01-01"))).toThrow(/within/);
    expect(() => annualReading(chart, 2026, r.end)).toThrow(/within/);
  });
});
