import type { CurrentTransit } from "./transits";
/** Transit houses always use the natal ascendant, never the transit ascendant. */
export function overlayPoints(transits: CurrentTransit[], natalAscendant: number) {
  return transits.map(p => ({ planet: p.planet, house: ((p.signIndex - natalAscendant + 12) % 12) + 1, signIndex: p.signIndex, sign: p.sign, degreeInSign: p.degree, retrograde: p.retrograde, layer: "transit" as const }));
}
