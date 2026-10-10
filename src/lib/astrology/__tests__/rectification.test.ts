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

  it("scores each event with traceable raw and evidence-weighted points", () => {
    for (const c of r.candidates) {
      expect(c.events).toHaveLength(3);
      expect(c.score).toBe(c.events.reduce((a, e) => a + e.points, 0));
      for (const e of c.events) {
        expect(e.chain).toHaveLength(3);
        expect(e.points).toBe(Math.round(e.rawPoints * e.evidenceWeight));
        expect(e.reasons.length).toBeGreaterThan(0);
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

 describe("rectification evidence quality", () => {
  it("does not gain points or confidence from duplicate events", () => {
    const single = rectify(base, 2, [events[0]]);
    const duplicated = rectify(base, 2, Array(6).fill(events[0]));
    expect(duplicated.candidates.map((c) => c.score)).toEqual(single.candidates.map((c) => c.score));
    expect(duplicated.confidence).toBe("low");
    expect(duplicated.warnings.some((w) => w.startsWith("Repeated"))).toBe(true);
  });

  it("keeps unresolved and boundary-limited searches at low confidence", () => {
    const result = rectify(base, 0, events);
    expect(result.confidence).toBe("low");
    expect(result.leadingCandidateCount).toBe(1);
    expect(result.warnings.some((w) => w.includes("All tested times tie"))).toBe(true);
  });

  it("averages approximate-date evidence and avoids fine timing for year-only events", () => {
    const result = rectify(base, 1, [{ kind: "career", date: "2012", precision: "year" }]);
    for (const candidate of result.candidates) {
      const match = candidate.events[0];
      expect(match.chain).toHaveLength(2);
      expect(match.points).toBe(Math.round(match.rawPoints * match.evidenceWeight));
      expect(match.reasons[0]).toContain("Averaged 12 dates");
    }
  });

  it("rejects invalid search steps and calendar dates", () => {
    expect(() => rectify(base, 2, events, 0)).toThrow();
    expect(() => rectify(base, 2, [{ kind: "career", date: "2012-02-30" }])).toThrow();
  });
  it("retains documented seconds throughout the minute search", () => {
    const result=rectify({...base,time:"06:45:32"},1,[events[0]]);
    expect(result.candidates.map(c=>c.time)).toEqual(["06:44:32","06:45:32","06:46:32"]);
  });

});
