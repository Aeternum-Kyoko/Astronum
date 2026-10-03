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

/**
 * Where each house's sign number sits: at the house's inner corner, toward
 * the chart's centre lines — fixed, so a crowded house can never push it out.
 */
export const SIGN_ANCHORS: [number, number][] = [
  [200, 184], // 1
  [100, 84], // 2
  [82, 104], // 3
  [182, 204], // 4
  [82, 304], // 5
  [100, 324], // 6
  [200, 226], // 7
  [300, 324], // 8
  [318, 304], // 9
  [220, 204], // 10
  [318, 104], // 11
  [300, 84], // 12
];

/** The largest upright box inside each house (kites: the inscribed square; triangles: the half nearest the frame). */
export const HOUSE_BOXES: [x0: number, y0: number, x1: number, y1: number][] = [
  [152, 44, 248, 150], // 1
  [52, 10, 148, 54], // 2
  [10, 52, 54, 148], // 3
  [50, 152, 156, 248], // 4
  [10, 252, 54, 348], // 5
  [52, 346, 148, 390], // 6
  [152, 250, 248, 356], // 7
  [252, 346, 348, 390], // 8
  [346, 252, 390, 348], // 9
  [244, 152, 350, 248], // 10
  [346, 52, 390, 148], // 11
  [252, 10, 348, 54], // 12
];

/** Width of one planet label ("Ma29°↑") at full size, and its line height. */
const ITEM_W = 42;
const ITEM_H = 17;

export interface HouseLayout {
  /** Label centres, in drawing order. */
  points: [number, number][];
  /** Font scale (1 = 14px labels). */
  scale: number;
  /** Whether there is room for degree numbers beside the planets. */
  degrees: boolean;
}

/**
 * Fits `count` planet labels inside house `house` (1–12): tries 1–3 columns
 * and keeps whichever lets the labels be largest, shrinking them only as far
 * as needed so every planet stays inside its house.
 */
export function layoutHouse(house: number, count: number, reserveBottom = 0): HouseLayout {
  const [x0, y0, x1, y1raw] = HOUSE_BOXES[house - 1];
  const y1 = y1raw - reserveBottom;
  const w = x1 - x0;
  const h = y1 - y0;
  if (count === 0) return { points: [], scale: 1, degrees: true };
  let best = { cols: 1, scale: 0 };
  for (let cols = 1; cols <= Math.min(3, count); cols++) {
    const rows = Math.ceil(count / cols);
    const scale = Math.min(1, w / cols / ITEM_W, h / rows / ITEM_H);
    if (scale > best.scale + 0.01) best = { cols, scale };
  }
  const { cols } = best;
  const scale = Math.max(0.55, best.scale);
  const rows = Math.ceil(count / cols);
  const cellW = Math.min(w / cols, ITEM_W * scale * 1.15);
  const cellH = ITEM_H * scale;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const points: [number, number][] = [];
  for (let i = 0; i < count; i++) {
    const r = Math.floor(i / cols);
    const inRow = r === rows - 1 ? count - r * cols : cols;
    const c = i % cols;
    points.push([cx + (c - (inRow - 1) / 2) * cellW, cy + (r - (rows - 1) / 2) * cellH + 5 * scale]);
  }
  return { points, scale, degrees: scale >= 0.8 };
}
