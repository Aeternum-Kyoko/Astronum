export function normalizeDegrees(deg: number): number {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

/** 1-based house of a sign counted from the ascendant's own sign (whole-sign houses), wrapping around the zodiac. */
export function signOffsetHouse(signIndex: number, ascendantSignIndex: number): number {
  return ((signIndex - ascendantSignIndex + 12) % 12) + 1;
}
