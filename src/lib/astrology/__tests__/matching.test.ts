import { describe, it, expect } from "vitest";
import { compareManglik, computeGunaMilan, YONI_ORDER, YONI_TABLE, type MoonInput } from "../matching";
import type { MangalDoshaResult } from "../mangalDosha";

// Nakshatra index → sign: each sign holds 2¼ nakshatras (Ashwini 0 … Revati 26).
const moon = (signIndex: number, nakshatraIndex: number, pada = 1, degreeInSign = 10): MoonInput => ({
  signIndex,
  nakshatraIndex,
  pada,
  degreeInSign,
});

const score = (r: ReturnType<typeof computeGunaMilan>, name: string) => r.kootas.find((k) => k.name === name)!.score;

describe("computeGunaMilan", () => {
  it("scores 28 for two Moons in the same nakshatra and sign — everything but Nadi", () => {
    const r = computeGunaMilan(moon(0, 0), moon(0, 0));
    expect(r.total).toBe(28);
    expect(score(r, "Nadi")).toBe(0);
    expect(r.kootas.find((k) => k.name === "Nadi")!.note).toMatch(/Nadi Dosha/);
  });

  it("scores an Ashwini boy with a Bharani girl (both Aries) at 34", () => {
    const r = computeGunaMilan(moon(0, 0, 1, 5), moon(0, 1, 1, 18));
    expect(r.kootas.map((k) => [k.name, k.score])).toEqual([
      ["Varna", 1],
      ["Vashya", 2],
      ["Tara", 3],
      ["Yoni", 2], // Horse – Elephant
      ["Graha Maitri", 5],
      ["Gana", 6], // Deva boy, Manushya girl
      ["Bhakoot", 7],
      ["Nadi", 8], // Adi vs Madhya
    ]);
    expect(r.total).toBe(34);
    expect(r.verdict).toBe("Excellent");
  });

  it("always adds up to at most 36 and matches the sum of its kootas", () => {
    for (let b = 0; b < 27; b += 4) {
      for (let g = 0; g < 27; g += 5) {
        const r = computeGunaMilan(moon(Math.floor((b * 4) / 9), b), moon(Math.floor((g * 4) / 9), g));
        expect(r.total).toBeLessThanOrEqual(36);
        expect(r.total).toBe(r.kootas.reduce((s, k) => s + k.score, 0));
        expect(r.kootas.reduce((s, k) => s + k.max, 0)).toBe(36);
      }
    }
  });

  it("flags Bhakoot Dosha for 6/8 Moon signs and notes the friendly-lord cancellation", () => {
    // Aries (Mars) and Virgo (Mercury) are 6/8: Mars treats Mercury as an enemy, so no cancellation.
    const r = computeGunaMilan(moon(0, 0), moon(5, 12));
    expect(score(r, "Bhakoot")).toBe(0);
    expect(r.kootas.find((k) => k.name === "Bhakoot")!.note).not.toMatch(/cancel/);
    // Aries (Mars) and Sagittarius (Jupiter) are 5/9, and Mars and Jupiter are mutual friends.
    const friendly = computeGunaMilan(moon(0, 0), moon(8, 18));
    expect(score(friendly, "Bhakoot")).toBe(0);
    expect(friendly.kootas.find((k) => k.name === "Bhakoot")!.note).toMatch(/cancel/);
  });

  it("marks Tara as inauspicious for Vipat, Pratyari and Vadha counts", () => {
    // Girl Ashwini (0), boy Krittika (2): count 3 = Vipat. Back from boy: count 26 → 8 = Mitra.
    expect(score(computeGunaMilan(moon(0, 2, 1, 28), moon(0, 0)), "Tara")).toBe(1.5);
  });

  it("uses the Graha Maitri scale for Moon-sign lords", () => {
    expect(score(computeGunaMilan(moon(4, 9), moon(3, 7)), "Graha Maitri")).toBe(5); // Sun–Moon friends
    expect(score(computeGunaMilan(moon(4, 9), moon(9, 21)), "Graha Maitri")).toBe(0); // Sun–Saturn enemies
    expect(score(computeGunaMilan(moon(2, 5), moon(3, 7)), "Graha Maitri")).toBe(1); // Mercury→Moon enemy, Moon→Mercury friend
  });
});

describe("YONI_TABLE", () => {
  it("is symmetric with 4 on the diagonal", () => {
    YONI_TABLE.forEach((row, i) => {
      expect(row[i]).toBe(4);
      row.forEach((v, j) => expect(v).toBe(YONI_TABLE[j][i]));
    });
  });

  it("gives 0 exactly for the seven classical enemy pairs", () => {
    const zeros = new Set<string>();
    YONI_TABLE.forEach((row, i) =>
      row.forEach((v, j) => v === 0 && i < j && zeros.add(`${YONI_ORDER[i]}-${YONI_ORDER[j]}`))
    );
    expect([...zeros].sort()).toEqual(
      ["Horse-Buffalo", "Elephant-Lion", "Sheep-Monkey", "Serpent-Mongoose", "Dog-Deer", "Cat-Rat", "Cow-Tiger"].sort()
    );
  });
});

describe("compareManglik", () => {
  const withStatus = (status: MangalDoshaResult["status"]) => ({ status }) as MangalDoshaResult;

  it("treats two Manglik charts, or two non-Manglik charts, as compatible", () => {
    expect(compareManglik(withStatus("present"), withStatus("present")).compatible).toBe(true);
    expect(compareManglik(withStatus("absent"), withStatus("cancelled")).compatible).toBe(true);
  });

  it("flags a one-sided Mangal Dosha", () => {
    const r = compareManglik(withStatus("absent"), withStatus("present"));
    expect(r.compatible).toBe(false);
    expect(r.summary).toMatch(/girl's/);
  });
});
