import { describe, expect, it } from "vitest";
import { gocharaVedha, rawTransitModifiers } from "../transitModifiers";
import { calculateKundali } from "../kundali";
import { monthlyForecast } from "../monthlyForecast";
describe("shared transit modifiers", () => {
  it("returns all blockers in the paired house and honours exempt pairs", () => {
    const positions = [{ planet: "Sun" as const, signIndex: 2, degree: 1 }, { planet: "Saturn" as const, signIndex: 8, degree: 2 }, { planet: "Mars" as const, signIndex: 8, degree: 3 }, { planet: "Venus" as const, signIndex: 8, degree: 4 }, { planet: "Moon" as const, signIndex: 8, degree: 5 }];
    const result = gocharaVedha("Sun", 2, 0, positions);
    expect(result.blockers).toEqual(["Mars", "Venus"]);
    expect(result.tone).toBe("Mixed");
    expect(result.obstructionHouse).toBe(9);
  });
  it("does not apply favourable-house Vedha to a demanding Moon-house transit", () => {
    expect(gocharaVedha("Jupiter", 0, 0, [])).toMatchObject({ favourable: false, obstructionHouse: null, blockers: [], tone: "Demanding" });
  });
  it("matches monthly Vedha and Kakshya for every planet at the identical snapshot", () => {
    const chart = calculateKundali({ name: "Test", date: "1990-04-12", time: "06:45", latitude: 26.9124, longitude: 75.7873, timezone: "Asia/Kolkata", place: "Jaipur" });
    const month = monthlyForecast(chart, new Date("2026-10-01"), 1).months[0];
    const positions = month.transits.map(p => ({ ...p, signIndex: ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"].indexOf(p.sign) }));
    for (const p of positions) {
      const result = rawTransitModifiers(chart, p, positions);
      expect(result.gochara.blockers[0] ?? null).toBe(p.vedhaBy);
      expect(result.gochara.favourable).toBe(p.favourable);
      if (p.kakshya) expect(result.kakshya).toMatchObject(p.kakshya);
      expect(result.kakshya === null).toBe(p.planet === "Rahu" || p.planet === "Ketu");
    }
  });
});
