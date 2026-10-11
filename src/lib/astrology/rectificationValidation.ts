import type { Candidate, LifeEvent, RectificationValidation } from "./rectificationEvents";

/** Reuses already-scored candidates: no extra ephemeris work or fitting to reserved events.
 * Stability requires the entire refitted leading set to stay inside the original leading set.
 * Holdout scores are descriptive rule scores, not calibrated predictive validation.
 */
export function validateRectification(candidates: readonly Candidate[], events: readonly LifeEvent[], step: number): RectificationValidation {
  const fit = events.map((e, i) => e.useFor !== "validation" ? i : -1).filter(i => i >= 0);
  const reserved = events.map((e, i) => e.useFor === "validation" ? i : -1).filter(i => i >= 0);
  const maxFit = Math.max(...candidates.map(c => c.score));
  const original = candidates.map((c, i) => c.score === maxFit ? i : -1).filter(i => i >= 0);
  const originalSet = new Set(original);
  const key = (c: Candidate) => `${c.date} ${c.time}`;
  const leaveOneOut = fit.length < 3 || candidates.length < 2 ? [] : fit.map(index => {
    const scores = candidates.map(c => c.score - c.events[index].points);
    const max = Math.max(...scores);
    const leading = scores.map((s, i) => s === max ? i : -1).filter(i => i >= 0);
    const overlapCount = leading.filter(i => originalSet.has(i)).length;
    const nearestShiftMinutes = Math.min(...leading.flatMap(i => original.map(j => Math.abs(i - j) * step)));
    return { omittedKind: events[index].kind, omittedDate: events[index].date, leadingTimes: leading.map(i => key(candidates[i])), overlapCount, nearestShiftMinutes, edge: leading.includes(0) || leading.includes(candidates.length - 1) };
  });
  const heldOutScores = candidates.map(c => reserved.reduce((sum, i) => sum + c.events[i].points, 0));
  const selectedScores = original.map(i => heldOutScores[i]);
  const bestScore = Math.max(...heldOutScores);
  const heldOut = reserved.length ? {
    selectedScoreMin: Math.min(...selectedScores), selectedScoreMax: Math.max(...selectedScores), bestScore,
    allCandidatesTie: heldOutScores.every(s => s === bestScore),
    selectedContainsValidationLeader: selectedScores.some(s => s === bestScore),
    events: reserved.map(i => ({ kind: events[i].kind, date: events[i].date, pointsMin: Math.min(...original.map(j => candidates[j].events[i].points)), pointsMax: Math.max(...original.map(j => candidates[j].events[i].points)) })),
  } : null;
  return { fitEventCount: fit.length, heldOutEventCount: reserved.length, leaveOneOut, stableAcrossOmissions: leaveOneOut.length ? leaveOneOut.every(row => row.overlapCount === row.leadingTimes.length) : null, heldOut };
}
