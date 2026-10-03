import { describe, it, expect } from "vitest";
import { detectClassicalYogas, type YogaPlanet } from "../yogasClassical";
import { detectYogas } from "../yogas";
import { calculateKundali } from "../kundali";
import { PLANETS, type PlanetName } from "../constants";

/** Planets by sign index; house is counted from `asc`. Unlisted planets go to Pisces. */
function chartOf(asc: number, signs: Partial<Record<PlanetName, number>>): YogaPlanet[] {
  return PLANETS.map((planet) => {
    const signIndex = signs[planet] ?? 11;
    return { planet, signIndex, house: ((signIndex - asc + 12) % 12) + 1 };
  });
}
const names = (ps: YogaPlanet[], asc: number) => detectClassicalYogas(ps, asc).map((y) => y.key);

describe("Parashari raja and dhana yogas", () => {
  it("links a kendra lord with a trikona lord (Cancer Lagna: Moon + Mars conjunct)", () => {
    const ps = chartOf(3, { Moon: 2, Mars: 2 });
    expect(names(ps, 3)).toContain("Kendra-Trikona Raja Yoga");
  });

  it("names the yogakaraka for the Lagna (Mars for Cancer)", () => {
    const y = detectClassicalYogas(chartOf(3, { Mars: 0 }), 3).find((x) => x.key === "Yogakaraka Planet");
    expect(y?.description).toMatch(/^Mars/);
  });

  it("finds Dharma-Karmadhipati when the 9th and 10th lords exchange signs", () => {
    // Aries Lagna: 9th lord Jupiter (Sagittarius), 10th lord Saturn (Capricorn). Jupiter in Capricorn, Saturn in Sagittarius.
    expect(names(chartOf(0, { Jupiter: 9, Saturn: 8 }), 0)).toContain("Dharma-Karmadhipati Yoga");
  });

  it("finds Sarala Yoga when the 8th lord sits in the 12th", () => {
    // Cancer Lagna: 8th lord Saturn in Gemini (12th).
    expect(names(chartOf(3, { Saturn: 2 }), 3)).toContain("Sarala Yoga");
  });

  it("finds Dhana Yoga when the 2nd/11th lords tie to the fortune lords", () => {
    // Cancer Lagna: 11th lord Venus with Lagna lord Moon in Gemini.
    expect(names(chartOf(3, { Venus: 2, Moon: 2 }), 3)).toContain("Dhana Yoga");
  });
});

describe("Chandra, conjunction and family yogas", () => {
  it("finds Sunapha when a planet (not the Sun) is 2nd from the Moon", () => {
    expect(names(chartOf(0, { Moon: 3, Mars: 4 }), 0)).toContain("Sunapha Yoga");
  });

  it("finds Durudhara when both sides of the Moon are occupied", () => {
    expect(names(chartOf(0, { Moon: 3, Mars: 4, Venus: 2 }), 0)).toContain("Durudhara Yoga");
  });

  it("finds Vish Yoga for Moon–Saturn and Grahan Yoga for Sun–Rahu", () => {
    const got = names(chartOf(0, { Moon: 2, Saturn: 2, Sun: 5, Rahu: 5 }), 0);
    expect(got).toContain("Vish Yoga");
    expect(got).toContain("Grahan Yoga");
  });

  it("finds Pravrajya Yoga with four planets in one sign", () => {
    expect(names(chartOf(0, { Moon: 2, Mars: 2, Venus: 2, Saturn: 2 }), 0)).toContain("Pravrajya Yoga");
  });

  it("classifies the Sankhya yoga by the number of signs held", () => {
    expect(names(chartOf(0, { Sun: 0, Moon: 1, Mars: 2, Mercury: 3, Jupiter: 4, Venus: 5, Saturn: 6 }), 0)).toContain("Veena Yoga");
    expect(names(chartOf(0, { Sun: 0, Moon: 0, Mars: 1, Mercury: 1, Jupiter: 2, Venus: 2, Saturn: 3 }), 0)).toContain("Kedara Yoga");
  });

  it("finds the Ashraya yogas by sign quality", () => {
    expect(names(chartOf(0, { Sun: 0, Moon: 3, Mars: 6, Mercury: 9, Jupiter: 0, Venus: 3, Saturn: 6 }), 0)).toContain("Rajju Yoga");
    expect(names(chartOf(0, { Sun: 1, Moon: 4, Mars: 7, Mercury: 10, Jupiter: 1, Venus: 4, Saturn: 7 }), 0)).toContain("Musala Yoga");
  });

  it("reports only formed yogas, with a Hindi name in the Hindi locale", () => {
    const ys = detectClassicalYogas(chartOf(0, { Moon: 3, Mars: 4 }), 0, "hi");
    expect(ys.every((y) => y.present)).toBe(true);
    expect(ys.find((y) => y.key === "Sunapha Yoga")?.name).toBe("सुनफा योग");
  });
});

describe("Kamyavardhan Dave's chart (22 May 2004, 11:20 IST, Jodhpur)", () => {
  const chart = calculateKundali({ name: "K", date: "2004-05-22", time: "11:20", latitude: 26.2389, longitude: 73.0243, timezone: "Asia/Kolkata", place: "Jodhpur" });
  const present = chart.yogas.filter((y) => y.present).map((y) => y.key);

  it("no longer flags Kemadruma (Mars, Venus and Saturn join the Moon)", () => {
    expect(present).not.toContain("Kemadruma Yoga");
  });

  it("shows the raja, dhana, Vipareeta and family yogas the chart really has", () => {
    for (const k of ["Kendra-Trikona Raja Yoga", "Yogakaraka Planet", "Dhana Yoga", "Sarala Yoga", "Vish Yoga", "Pravrajya Yoga", "Kedara Yoga", "Chapa Yoga"]) {
      expect(present).toContain(k);
    }
  });

  it("reads yogas in the Navamsa and Dasamsa too, present ones only", () => {
    expect(chart.vargaYogas?.D9).toBeDefined();
    expect(chart.vargaYogas?.D10?.every((y) => y.present)).toBe(true);
  });

  it("detectYogas matches the chart's own list", () => {
    const again = detectYogas(chart.planets, chart.ascendant.signIndex).filter((y) => y.present).map((y) => y.key);
    expect(again).toEqual(present);
  });
});
