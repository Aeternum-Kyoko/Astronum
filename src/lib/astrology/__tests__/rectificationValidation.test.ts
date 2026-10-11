import { describe, expect, it } from "vitest";
import { validateRectification } from "../rectificationValidation";
import { rectify } from "../rectification";
import type { Candidate, EventMatch, LifeEvent } from "../rectificationEvents";
const base = { name: "Test", date: "1990-04-12", time: "06:45", latitude: 26.9124, longitude: 75.7873, timezone: "Asia/Kolkata", place: "Jaipur" };
const fit: LifeEvent[] = [{ kind: "career", date: "2012-07-02" }, { kind: "marriage", date: "2016-11-20" }, { kind: "child", date: "2019-03-14" }];
function candidate(time: string, points: number[], score = points.reduce((a, b) => a + b, 0)): Candidate {
  return { time, date: "1990-04-12", score, lagna: "Aries", navamsaLagna: "Gemini", moonNakshatra: "Test", events: points.map((p, i) => ({ kind: fit[i]?.kind ?? "property", date: fit[i]?.date ?? "2020-04-04", chain: [], points: p, rawPoints: p, evidenceWeight: 1, reasons: [] } as EventMatch)) };
}
describe("rectification validation", () => {
  it("exposes an influential event even when refitting broadens rather than moves the leaders", () => {
    const r = validateRectification([candidate("06:44", [1, 3, 3]), candidate("06:45", [5, 3, 3]), candidate("06:46", [2, 3, 3])], fit, 1);
    expect(r.stableAcrossOmissions).toBe(false);
    expect(r.leaveOneOut[0]).toMatchObject({ overlapCount: 1, nearestShiftMinutes: 0, edge: true });
    expect(r.leaveOneOut[0].leadingTimes).toHaveLength(3);
  });
  it("detects a moved leader and measures the shift in minutes", () => {
    const r = validateRectification([candidate("06:44", [0, 4, 4]), candidate("06:46", [7, 2, 2])], fit, 2);
    expect(r.leaveOneOut[0].nearestShiftMinutes).toBe(2);
    expect(r.leaveOneOut[0].overlapCount).toBe(0);
  });
  it("reports held-out disagreement without using those points for fitting", () => {
    const events = [...fit, { kind: "property", date: "2020-04-04", useFor: "validation" } as LifeEvent];
    const r = validateRectification([candidate("06:44", [3, 3, 3, 0], 9), candidate("06:45", [2, 2, 2, 9], 6)], events, 1);
    expect(r.heldOut).toMatchObject({ selectedScoreMax: 0, bestScore: 9, allCandidatesTie: false, selectedContainsValidationLeader: false });
  });
  it("adding or changing reserved evidence never changes fitting scores or ordering", () => {
    const original = rectify(base, 2, fit);
    const reserved = rectify(base, 2, [...fit, { kind: "property", date: "2020-04-04", useFor: "validation" }]);
    expect(reserved.candidates.map(c => c.score)).toEqual(original.candidates.map(c => c.score));
    expect(reserved.runs.map(r => r.from)).toEqual(original.runs.map(r => r.from));
    expect(reserved.validation.heldOutEventCount).toBe(1);
  });
  it("rejects all-reserved or too-few fitting events and avoids diagnostics for a single-time review", () => {
    expect(() => rectify(base, 2, [{ ...fit[0], useFor: "validation" }])).toThrow(/fitting/);
    expect(() => rectify(base, 2, [fit[0], { ...fit[1], useFor: "validation" }])).toThrow(/two/);
    expect(rectify(base, 0, fit).validation.stableAcrossOmissions).toBeNull();
    expect(() => rectify(base, 2, [...fit, { ...fit[0], useFor: "validation" }])).toThrow(/both/);
  });
});
