import { describe, it, expect } from "vitest";
import { rectify, EVENT_KEYS } from "../rectification";

const base = { name: "T", date: "1990-04-12", time: "06:45", latitude: 26.9124, longitude: 75.7873, timezone: "Asia/Kolkata", place: "Jaipur" };
const events = [
  { kind: "marriage" as const, date: "2016-11-20" },
  { kind: "career" as const, date: "2012-07-02" },
  { kind: "child" as const, date: "2019-03-14" },
];

describe("rectify", () => {
  const r = rectify(base, 30, events);

  it("tries every minute of the window", () => {
    expect(r.candidates).toHaveLength(61);
    expect(r.candidates[0].time).toBe("06:15");
    expect(r.candidates[60].time).toBe("07:15");
  });

  it("scores each event with a reason for every point", () => {
    for (const c of r.candidates) {
      expect(c.events).toHaveLength(3);
      expect(c.score).toBe(c.events.reduce((a, e) => a + e.points, 0));
      for (const e of c.events) {
        expect(e.chain).toHaveLength(3);
        const explained = e.reasons.reduce((a, s) => a + Number(s.match(/\(\+(\d+)\)/)![1]), 0);
        expect(explained).toBe(e.points);
      }
    }
  });

  it("groups minutes into runs, best first, covering the window", () => {
    expect(r.runs[0].best.score).toBe(r.maxScore);
    for (let i = 1; i < r.runs.length; i++) expect(r.runs[i - 1].best.score).toBeGreaterThanOrEqual(r.runs[i].best.score);
    const minutes = r.runs.reduce((a, run) => a + (toMin(run.to) - toMin(run.from) + 1), 0);
    expect(minutes).toBe(61);
  });

  it("reports Navamsa lagna changes, which happen every few minutes", () => {
    expect(r.boundaries.some((b) => b.what.startsWith("Navamsa"))).toBe(true);
  });

  it("knows every event kind", () => {
    const all = rectify(base, 2, EVENT_KEYS.map((kind) => ({ kind, date: "2015-06-01" })));
    expect(all.candidates[0].events).toHaveLength(EVENT_KEYS.length);
  });
});

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
