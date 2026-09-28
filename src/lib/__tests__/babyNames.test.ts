import { describe, it, expect } from "vitest";
import { BABY_NAMES, namesFor, syllablesFor } from "../babyNames";
import { NAKSHATRAS } from "../astrology/constants";

describe("baby names", () => {
  it("parses every entry with a meaning", () => {
    expect(BABY_NAMES.length).toBeGreaterThan(300);
    for (const n of BABY_NAMES) expect(n.meaning.length).toBeGreaterThan(2);
  });
  it("keeps longer syllables apart from shorter ones", () => {
    const cha = namesFor(["Cha"])[0].names.map((n) => n.name);
    expect(cha).not.toContain("Chhavi");
    const da = namesFor(["Da"])[0].names.map((n) => n.name);
    expect(da).not.toContain("Dhruv");
  });
  it("offers names for most nakshatras", () => {
    const covered = NAKSHATRAS.filter((_, i) => namesFor(syllablesFor(i)).some((g) => g.names.length > 0));
    expect(covered.length).toBeGreaterThanOrEqual(26);
  });
});
