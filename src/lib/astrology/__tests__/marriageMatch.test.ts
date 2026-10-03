import { describe, it, expect } from "vitest";
import { calculateKundali } from "../kundali";
import { chartLinks, dashaTiming, deepMatch, marriagePromise } from "../marriageMatch";

const boy = calculateKundali({ name: "Rahul", date: "1990-04-12", time: "06:45", latitude: 26.9124, longitude: 75.7873, timezone: "Asia/Kolkata", place: "Jaipur" });
const girl = calculateKundali({ name: "Priya", date: "1992-08-21", time: "14:20", latitude: 26.2389, longitude: 73.0243, timezone: "Asia/Kolkata", place: "Jodhpur" });
const now = new Date("2026-10-03");

describe("deep marriage matching", () => {
  it("reads each person's own marriage promise from the 7th house, its lord in the D9, the karaka and the Navamsa", () => {
    const b = marriagePromise(boy, "boy");
    const g = marriagePromise(girl, "girl");
    expect(b.findings.map((f) => f.title)).toEqual(expect.arrayContaining([expect.stringMatching(/^7th house/), expect.stringMatching(/^7th lord/), expect.stringMatching(/^Venus, significator of the wife/), "The Navamsa as a whole"]));
    expect(g.findings.some((f) => /^Jupiter, significator of the husband/.test(f.title))).toBe(true);
    expect(b.score).toBe(Math.max(0, Math.min(100, Math.round(50 + b.findings.reduce((a, f) => a + f.points, 0) * 6))));
  });

  it("states the two Navamsa Lagnas' relationship both ways", () => {
    const nav = chartLinks(boy, girl).find((l) => l.title === "Navamsa Lagnas")!;
    // Gemini and Capricorn: Capricorn is 8th from Gemini, Gemini is 6th from Capricorn.
    expect(nav.text).toMatch(/8th\/6th/);
    expect(nav.tone).toBe("caution");
  });

  it("finds wedding windows only where both charts run supportive periods", () => {
    const t = dashaTiming(boy, girl, now);
    for (const w of t.favourable) {
      expect(w.tone).toBe("good");
      expect(new Date(w.end) > new Date(w.start)).toBe(true);
    }
  });

  it("combines everything into one verdict with a summary", () => {
    const d = deepMatch(boy, girl, now);
    expect(["Very supportive", "Supportive", "Mixed", "Needs care"]).toContain(d.verdict);
    expect(d.summary).toMatch(/marriage promise/);
    expect(d.summary).toMatch(/Rahul|Priya/);
  });
});
