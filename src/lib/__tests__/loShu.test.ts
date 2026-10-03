import { describe, it, expect } from "vitest";
import { kuaNumber, loShuReport } from "../loShu";
import { loShu } from "../numerology";

describe("loShuReport", () => {
  const r = loShuReport("1990-04-12", { now: new Date("2026-10-02") });

  it("places the date digits plus Driver and Conductor, matching the basic grid", () => {
    expect(r.driver).toBe(3);
    expect(r.conductor).toBe(8);
    expect(r.placed).toEqual([1, 9, 9, 0, 0, 4, 1, 2, 3, 8].filter((d) => d > 0));
    expect(r.counts).toEqual(loShu("1990-04-12").counts);
    expect(r.cells.flat().map((c) => c.n)).toEqual([4, 9, 2, 3, 5, 7, 8, 1, 6]);
  });

  it("reads repeated and missing numbers with remedies", () => {
    expect(r.present.find((p) => p.n === 9)!.count).toBe(2);
    expect(r.missing.map((m) => m.n)).toEqual([5, 6, 7]);
    expect(r.missing[0].remedies.length).toBeGreaterThan(0);
  });

  it("classifies the planes", () => {
    expect(r.planes.find((p) => p.name === "Mental plane")!.status).toBe("complete"); // 4, 9, 2
    expect(r.planes.find((p) => p.name.startsWith("Golden"))!.status).toBe("partial"); // 4 present, 5 and 6 missing
    expect(r.planes.find((p) => p.name === "Action plane")!.missingNumbers).toEqual([7, 6]);
  });

  it("checks whether the name fills a missing number", () => {
    const withName = loShuReport("1990-04-12", { name: "Ravi" }); // R2 A1 V6 I1 = 10 → 1
    expect(withName.name!.number).toBe(1);
    expect(withName.name!.fills).toBeNull();
  });

  it("adds the Kua number when gender is given", () => {
    const g = loShuReport("1990-04-12", { gender: "male" });
    expect(g.kua).toBe(1); // 10 − (9+0 → 9) = 1
    expect(g.placed.at(-1)).toBe(1);
    expect(g.kuaDirections!.group).toBe("East group");
  });
});

describe("kuaNumber", () => {
  it("follows the Ba Zhai formula, the 4 February year boundary and the 5 substitution", () => {
    expect(kuaNumber("1990-04-12", "female")).toBe(8); // 5 + 9 = 14 → 5, which becomes 8 for women
    expect(kuaNumber("1985-06-01", "male")).toBe(6); // 10 − (8+5=13→4) = 6
    expect(kuaNumber("2001-03-10", "male")).toBe(8); // 9 − 1 = 8
    expect(kuaNumber("2001-03-10", "female")).toBe(7); // 6 + 1 = 7
    expect(kuaNumber("1991-01-20", "male")).toBe(kuaNumber("1990-06-01", "male")); // before 4 Feb counts as the previous year
  });
});

describe("loShuReport in Hindi", () => {
  it("writes the whole reading in Hindi from the same numbers", () => {
    const en = loShuReport("1990-04-12", { gender: "male", name: "Ravi" });
    const hi = loShuReport("1990-04-12", { gender: "male", name: "Ravi", locale: "hi" });
    expect(hi.counts).toEqual(en.counts);
    expect(hi.cells[0][1].label.planet).toBe("मंगल");
    expect(hi.missing[0].label.direction).toMatch(/केंद्र/);
    expect(hi.driverConductor).toMatch(/मूलांक 3/);
    expect(hi.planes[0].name).toBe("मानसिक तल");
    expect(hi.kuaDirections!.group).toBe("पूर्व समूह");
    expect(hi.name!.text).toMatch(/नामांक/);
    const all = [hi.driverConductor, ...hi.strengths, ...hi.challenges, ...hi.topRemedies, ...hi.present.map((p) => p.meaning), ...hi.missing.map((m) => m.meaning)].join(" ");
    expect(all).not.toMatch(/\b(the|and|your|with)\b/);
  });
});
