import { describe, it, expect } from "vitest";
import { loShu, mobileNumerology, nameSuggestions, FRIENDLY, moolank, bhagyank, nameNumber } from "../numerology";

describe("numerology extras", () => {
  it("builds the Lo Shu grid from the date plus Moolank and Bhagyank", () => {
    const g = loShu("1990-04-12"); // digits 1,2,4,1,9,9 + moolank 3 + bhagyank 8
    expect(g.counts[1]).toBe(2);
    expect(g.counts[9]).toBe(2);
    expect(g.counts[3]).toBe(1);
    expect(g.counts[8]).toBe(1);
    expect(g.missing.map((m) => m.number)).toEqual([5, 6, 7]);
  });
  it("only suggests spellings that suit both numbers", () => {
    const d = "1990-04-12";
    const { suggestions } = nameSuggestions("Rahul Sharma", d);
    for (const s of suggestions) {
      expect(FRIENDLY[moolank(d)]).toContain(s.digit);
      expect(FRIENDLY[bhagyank(d)]).toContain(s.digit);
      expect(nameNumber(s.spelling).digit).toBe(s.digit);
    }
  });
  it("reads the last ten digits of a mobile number", () => {
    const r = mobileNumerology("+91 98765 43210", "1990-04-12");
    expect(r.total).toBe(45);
    expect(r.digit).toBe(9);
  });
});
