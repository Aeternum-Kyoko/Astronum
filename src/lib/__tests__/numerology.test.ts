import { describe, it, expect } from "vitest";
import { bhagyank, moolank, nameNumber, NUMBER_MEANINGS, reduceToDigit } from "../numerology";

describe("numerology", () => {
  it("reduces repeatedly to a single digit", () => {
    expect(reduceToDigit(29)).toBe(2); // 2+9=11 → 2
    expect(reduceToDigit(9)).toBe(9);
    expect(reduceToDigit(1999)).toBe(1); // 28 → 10 → 1
  });

  it("takes Moolank from the day of birth", () => {
    expect(moolank("1990-04-12")).toBe(3);
    expect(moolank("1990-04-29")).toBe(2);
  });

  it("takes Bhagyank from every digit of the date", () => {
    // 1+9+9+0+0+4+1+2 = 26 → 8
    expect(bhagyank("1990-04-12")).toBe(8);
  });

  it("scores names with Chaldean values, ignoring spaces and punctuation", () => {
    // A1 S3 H5 A1 = 10 ; S3 H5 A1 R2 M4 A1 = 16 ; total 26 → 8
    expect(nameNumber("Asha Sharma")).toEqual({ compound: 26, digit: 8 });
    expect(nameNumber("asha  sharma.")).toEqual({ compound: 26, digit: 8 });
  });

  it("has a meaning for every digit", () => {
    for (let n = 1; n <= 9; n++) expect(NUMBER_MEANINGS[n].planet).toBeTruthy();
  });
});
