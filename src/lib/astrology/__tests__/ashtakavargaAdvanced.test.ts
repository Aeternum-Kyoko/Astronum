import { binduBand } from "../ashtakavarga";
import { describe, expect, it } from "vitest";
import { ashtakavargaAdvanced, trikonaShodhana, ekadhipatyaShodhana, kakshyaAt } from "../ashtakavargaAdvanced";
import { calculateKundali } from "../kundali";
import { ASHTAKAVARGA_PLANETS } from "../constants";
const chart = calculateKundali({ name: "Test", date: "1990-04-12", time: "06:45", latitude: 26.9124, longitude: 75.7873, timezone: "Asia/Kolkata", place: "Jaipur" });

describe("advanced Ashtakavarga", () => {
  it("keeps BAV/SAV cutoff displays consistent, including mixed 4 and 25–29", () => {
    expect([0, 3, 4, 5, 8].map(v => binduBand(v, false))).toEqual(["low", "low", "mid", "high", "high"]);
    expect([24, 25, 28, 29, 30, 34].map(v => binduBand(v, true))).toEqual(["low", "mid", "mid", "mid", "high", "high"]);
  });
  it("reproduces the textbook Mercury Trikona example, without mutating raw BAV", () => {
    const raw = [7, 4, 7, 4, 4, 3, 4, 4, 4, 3, 6, 4];
    expect(trikonaShodhana(raw).values).toEqual([3, 1, 3, 0, 0, 0, 0, 0, 0, 0, 2, 0]);
    expect(raw).toEqual([7, 4, 7, 4, 4, 3, 4, 4, 4, 3, 6, 4]);
  });
  it("keeps zero-containing trines unchanged, including two zeros", () => {
    const raw = [0, 4, 4, 4, 0, 4, 4, 4, 7, 4, 4, 4];
    const r = trikonaShodhana(raw).values;
    expect([r[0], r[4], r[8]]).toEqual([0, 0, 7]);
    expect([r[1], r[5], r[9]]).toEqual([0, 0, 0]);
  });
  it.each([
    [4, 2, [1, 6], [4, 2]], [4, 2, [1], [4, 0]], [4, 2, [6], [2, 2]],
    [4, 2, [], [2, 2]], [2, 2, [], [0, 0]], [2, 2, [1], [2, 0]], [0, 2, [], [0, 2]],
  ])("applies co-owned occupancy reductions (%s/%s)", (a, b, occupied, expected) => {
    const values = Array(12).fill(0); values[1] = a; values[6] = b;
    const r = ekadhipatyaShodhana(values, new Set(occupied as number[]));
    expect([r.values[1], r.values[6]]).toEqual(expected);
    expect(values[1]).toBe(a);
  });
  it("reconciles contributors with all seven raw BAV tables and keeps raw counts intact", () => {
    const before = JSON.stringify(chart.ashtakavarga);
    for (const target of ASHTAKAVARGA_PLANETS) {
      const r = ashtakavargaAdvanced(chart, target);
      for (let s = 0; s < 12; s++) {
        expect(r.contributors.filter(c => c.bindus[s]).length).toBe(r.raw[s]);
        expect(r.ekadhipatya.values[s]).toBeLessThanOrEqual(r.trikona.values[s]);
        expect(r.trikona.values[s]).toBeLessThanOrEqual(r.raw[s]);
      }
      expect(r.sodhyaPinda).toBe(r.rasiPinda + r.grahaPinda);
    }
    expect(JSON.stringify(chart.ashtakavarga)).toBe(before);
  });
  it("resolves every Kakshya boundary and wraps the zodiac, excluding nodes", () => {
    expect(kakshyaAt(chart, "Jupiter", 0)?.lord).toBe("Saturn");
    expect(kakshyaAt(chart, "Jupiter", 3.749999)?.lord).toBe("Saturn");
    expect(kakshyaAt(chart, "Jupiter", 3.75)?.lord).toBe("Jupiter");
    expect(kakshyaAt(chart, "Jupiter", 29.999)?.lord).toBe("Ascendant");
    expect(kakshyaAt(chart, "Jupiter", 360)?.signIndex).toBe(0);
    for (let i = 0; i < 8; i++) expect(kakshyaAt(chart, "Saturn", i * 3.75)?.index).toBe(i);
    expect(kakshyaAt(chart, "Rahu", 10)).toBeNull();
  });
});
