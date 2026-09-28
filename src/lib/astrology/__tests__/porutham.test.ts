import { describe, it, expect } from "vitest";
import { computePorutham } from "../porutham";

const moon = (nakshatraIndex: number) => {
  const lon = nakshatraIndex * (360 / 27) + 2;
  return { nakshatraIndex, signIndex: Math.floor(lon / 30), degreeInSign: lon % 30, pada: 1 };
};

describe("Dasa Porutham", () => {
  it("fails Rajju when both stars share a rajju, and that is decisive", () => {
    const m = computePorutham(moon(0), moon(8)); // Ashwini and Ashlesha: both Pada rajju
    expect(m.poruthams.find((p) => p.name === "Rajju")!.result).toBe("Bad");
    expect(m.verdict).toBe("Not recommended");
  });
  it("fails Vedha for obstructing pairs", () => {
    const m = computePorutham(moon(0), moon(17)); // Ashwini–Jyeshtha
    expect(m.poruthams.find((p) => p.name === "Vedha")!.result).toBe("Bad");
  });
  it("scores all ten and counts from the girl's star", () => {
    const m = computePorutham(moon(10), moon(3)); // girl Rohini, boy Magha: count 8
    expect(m.poruthams).toHaveLength(10);
    expect(m.poruthams.find((p) => p.name === "Dina")!.detail).toContain("8th");
  });
});
