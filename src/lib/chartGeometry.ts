/**
 * Geometry of the North Indian chart on a 400×400 canvas, shared by the web
 * chart (NorthIndianChart) and the PDF report.
 */

export const PLANET_ABBR: Record<string, string> = {
  Sun: "Su",
  Moon: "Mo",
  Mars: "Ma",
  Mercury: "Me",
  Jupiter: "Ju",
  Venus: "Ve",
  Saturn: "Sa",
  Rahu: "Ra",
  Ketu: "Ke",
};

/** Traditional planet symbols; Rahu and Ketu use the lunar node signs. */
export const PLANET_GLYPH: Record<string, string> = {
  Sun: "☉",
  Moon: "☽",
  Mars: "♂",
  Mercury: "☿",
  Jupiter: "♃",
  Venus: "♀",
  Saturn: "♄",
  Rahu: "☊",
  Ketu: "☋",
};

// Square corners, edge midpoints, and diagonal half-midpoints used to build
// the classic North Indian diamond: outer square + both corner-to-corner
// diagonals + the diamond connecting edge midpoints. Houses 1/4/7/10 (the
// kendras) are the four kites pointing out from the center; the rest are the
// eight corner triangles.
export const A = [0, 0];
export const B = [400, 0];
export const C = [400, 400];
export const D = [0, 400];
const O = [200, 200];
export const P1 = [200, 0];
export const P2 = [400, 200];
export const P3 = [200, 400];
export const P4 = [0, 200];
const Q1 = [100, 100];
const Q2 = [300, 100];
const Q3 = [300, 300];
const Q4 = [100, 300];

// House 1 is always the top kite; from there houses are numbered
// counter-clockwise (house 2 sits to the LEFT of house 1), which is the
// standard direction for the North Indian chart format.
export const HOUSE_POLYGONS: number[][][] = [
  [P1, Q2, O, Q1], // 1
  [A, Q1, P1], // 2
  [P4, A, Q1], // 3
  [P4, Q1, O, Q4], // 4
  [D, Q4, P4], // 5
  [P3, D, Q4], // 6
  [P3, Q4, O, Q3], // 7
  [C, Q3, P3], // 8
  [P2, C, Q3], // 9
  [P2, Q3, O, Q2], // 10
  [B, Q2, P2], // 11
  [P1, B, Q2], // 12
];

export const HOUSE_LABEL_ANCHORS: [number, number][] = [
  [200, 58], // 1
  [130, 46], // 2
  [54, 100], // 3
  [58, 200], // 4
  [54, 300], // 5
  [130, 356], // 6
  [200, 344], // 7
  [270, 356], // 8
  [346, 300], // 9
  [344, 200], // 10
  [346, 100], // 11
  [270, 46], // 12
];

export function polygonPoints(polygon: number[][]): string {
  return polygon.map(([x, y]) => `${x},${y}`).join(" ");
}
