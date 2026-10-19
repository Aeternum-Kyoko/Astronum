import { childPeriods, type TreePeriod } from "./dashaTree";
import type { DashaPeriod } from "./dasha";

/** One boundary shared by every timeline control; dates are instants, not local-day guesses. */
export function timelineBoundaries(dashas: readonly DashaPeriod[], at: Date) {
  const roots: TreePeriod[] = dashas.map(period => ({ lord: period.lord, start: new Date(period.start), end: new Date(period.end), chain: [period.lord] }));
  const antardashas = roots.flatMap(childPeriods);
  const boundaries = antardashas.flatMap(period => childPeriods(period).map(child => child.start)).sort((a, b) => a.getTime() - b.getTime());
  const current = at.getTime();
  return {
    roots,
    previous: [...boundaries].reverse().find(start => start.getTime() < current) ?? null,
    next: boundaries.find(start => start.getTime() > current) ?? null,
  };
}

export function timelinePosition(start: Date, end: Date, at: Date) {
  const span = end.getTime() - start.getTime();
  if (span <= 0) return 0;
  return Math.max(0, Math.min(100, ((at.getTime() - start.getTime()) / span) * 100));
}
