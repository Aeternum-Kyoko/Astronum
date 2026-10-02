import { sToX, tToY, xToS, yToT, type GrayImage } from "./frame";

export type LineKey = "heart" | "head" | "life" | "fate";

/**
 * Where each major line is looked for, in palm coordinates (see frame.ts).
 * A line is traced station by station along `axis`, from `from` to `to` (the
 * direction palmists read it in), searching ±`halfWidth` across around `prior`.
 */
interface LineTemplate {
  key: LineKey;
  axis: "s" | "t";
  from: number;
  to: number;
  prior: (u: number) => number;
  halfWidth: number;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// Fitted to MediaPipe landmarks on real palm photos: the knuckle landmarks sit
// just above the heart line, and the head and life lines leave the thumb-side
// edge together about a sixth of the way down the palm.
export const TEMPLATES: LineTemplate[] = [
  // Heart line: from the outer edge below the little finger toward the index/middle fingers.
  { key: "heart", axis: "s", from: 1.02, to: 0.1, prior: (s) => 0.13 - 0.05 * clamp01((0.6 - s) / 0.5), halfWidth: 0.09 },
  // Head line: from the thumb-side edge across the palm.
  { key: "head", axis: "s", from: -0.02, to: 0.92, prior: (s) => 0.18 + 0.22 * clamp01(s), halfWidth: 0.14 },
  // Life line: from the same edge, curving around the ball of the thumb toward the wrist.
  { key: "life", axis: "t", from: 0.17, to: 0.98, prior: (t) => 0.45 * Math.sqrt(clamp01((t - 0.14) / 0.75)), halfWidth: 0.16 },
  // Fate line: from near the wrist up the centre of the palm toward the middle finger.
  { key: "fate", axis: "t", from: 0.88, to: 0.14, prior: () => 0.46, halfWidth: 0.12 },
];

export interface PalmPoint {
  s: number;
  t: number;
}

export interface TracedLine {
  key: LineKey;
  found: boolean;
  /** The traced path over the line's extent, start to end in reading order. */
  path: PalmPoint[];
  /** The visible stretches of the path; more than one means the line is broken. */
  segments: PalmPoint[][];
  /** Mean crease strength over the visible stretches, relative to the detection threshold (1 = just visible). */
  depth: number;
  /** Fraction of the searched span the line covers. */
  coverage: number;
}

interface Field {
  width: number;
  height: number;
  data: Float32Array;
}

function sample(f: Field, x: number, y: number): number {
  const xi = Math.round(x);
  const yi = Math.round(y);
  let best = 0;
  // The best of a 3×3 neighbourhood, so a crease a pixel off the grid still counts.
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const xx = xi + dx;
      const yy = yi + dy;
      if (xx < 0 || yy < 0 || xx >= f.width || yy >= f.height) continue;
      const v = f.data[yy * f.width + xx];
      if (v > best) best = v;
    }
  return best;
}

/** The crease-strength level above which a pixel counts as part of a line. */
export function creaseThreshold(f: Field): number {
  const vals: number[] = [];
  for (let y = 0; y < f.height; y++) {
    const t = yToT(y, f.height);
    if (t < 0.05 || t > 0.95) continue;
    for (let x = 0; x < f.width; x++) {
      const s = xToS(x, f.width);
      if (s < 0.05 || s > 0.95) continue;
      vals.push(f.data[y * f.width + x]);
    }
  }
  vals.sort((a, b) => a - b);
  const p = (q: number) => vals[Math.min(vals.length - 1, Math.floor(q * vals.length))] ?? 0;
  return Math.max(p(0.88), 0.025);
}

/**
 * Traces one line with dynamic programming: the path that runs through the
 * strongest creases while staying smooth and near where the line belongs.
 */
export function traceLine(tpl: LineTemplate, f: Field, threshold: number, exclude: PalmPoint[][] = []): TracedLine {
  const { width: w, height: h } = f;
  // Pixels per palm unit along each axis of the rectified image.
  const unitS = sToX(1, w) - sToX(0, w);
  const unitT = tToY(1, h) - tToY(0, h);
  const span = Math.abs(tpl.to - tpl.from);
  const stations = Math.max(8, Math.round((span * (tpl.axis === "s" ? unitS : unitT)) / 2));
  const crossStep = 1 / (tpl.axis === "s" ? unitT : unitS);
  const half = Math.round(tpl.halfWidth / crossStep);
  const n = 2 * half + 1;

  const exclusion = exclude.flat().map((p) => ({ x: sToX(p.s, w), y: tToY(p.t, h) }));
  const near = (x: number, y: number) => exclusion.some((p) => (p.x - x) ** 2 + (p.y - y) ** 2 < 64);

  const at = (k: number, j: number): PalmPoint => {
    const u = tpl.from + ((tpl.to - tpl.from) * k) / (stations - 1);
    const c = tpl.prior(u) + (j - half) * crossStep;
    return tpl.axis === "s" ? { s: u, t: c } : { s: c, t: u };
  };
  const score = new Float32Array(stations * n);
  for (let k = 0; k < stations; k++)
    for (let j = 0; j < n; j++) {
      const p = at(k, j);
      const x = sToX(p.s, w);
      const y = tToY(p.t, h);
      const r = near(x, y) ? 0 : sample(f, x, y) / threshold;
      score[k * n + j] = Math.min(r, 3);
    }

  // Viterbi: smoothness keeps the path from jumping between creases; a gentle pull toward the prior.
  const smooth = 0.35;
  const pull = 0.6;
  const maxStep = 3;
  const acc = new Float32Array(stations * n);
  const back = new Int16Array(stations * n);
  for (let j = 0; j < n; j++) acc[j] = score[j] - pull * ((j - half) / half) ** 2;
  for (let k = 1; k < stations; k++)
    for (let j = 0; j < n; j++) {
      let best = -Infinity;
      let arg = j;
      for (let d = -maxStep; d <= maxStep; d++) {
        const jp = j + d;
        if (jp < 0 || jp >= n) continue;
        const v = acc[(k - 1) * n + jp] - smooth * d * d;
        if (v > best) {
          best = v;
          arg = jp;
        }
      }
      acc[k * n + j] = best + score[k * n + j] - pull * ((j - half) / half) ** 2;
      back[k * n + j] = arg;
    }
  let j = 0;
  for (let jj = 1; jj < n; jj++) if (acc[(stations - 1) * n + jj] > acc[(stations - 1) * n + j]) j = jj;
  const idx = new Array<number>(stations);
  for (let k = stations - 1; k >= 0; k--) {
    idx[k] = j;
    j = back[k * n + j];
  }

  const points = idx.map((jj, k) => at(k, jj));
  const strength = idx.map((jj, k) => score[k * n + jj]);
  return summarise(tpl.key, points, strength, stations);
}

/** Turns per-station strengths into visible segments, breaks and depth. */
function summarise(key: LineKey, points: PalmPoint[], strength: number[], stations: number): TracedLine {
  // Judge visibility on a short running average: a real crease is continuous, skin texture is not.
  const r = 3;
  const avg = strength.map((_, k) => {
    let sum = 0;
    let n = 0;
    for (let i = Math.max(0, k - r); i <= Math.min(strength.length - 1, k + r); i++, n++) sum += strength[i];
    return sum / n;
  });
  const on = avg.map((v) => v >= 1);
  // Close pinholes of up to three stations — a crease rarely shows perfectly continuously.
  for (let k = 1; k < on.length - 1; k++)
    if (!on[k]) {
      let a = k;
      while (a < on.length && !on[a]) a++;
      if (a - k <= 3 && on[k - 1] && a < on.length) for (let i = k; i < a; i++) on[i] = true;
      k = a;
    }
  let runs: [number, number][] = [];
  for (let k = 0; k < on.length; ) {
    if (!on[k]) {
      k++;
      continue;
    }
    let e = k;
    while (e < on.length && on[e]) e++;
    runs.push([k, e]);
    k = e;
  }
  const minRun = Math.max(3, Math.round(stations * 0.06));
  runs = runs.filter(([a, b]) => b - a >= minRun);
  // Join runs separated by short gaps; a long gap at either end just means the line ends there.
  const maxGap = Math.round(stations * 0.18);
  const groups: [number, number][][] = [];
  for (const r of runs) {
    const g = groups.at(-1);
    if (g && r[0] - g.at(-1)![1] <= maxGap) g.push(r);
    else groups.push([r]);
  }
  const len = (g: [number, number][]) => g.reduce((a, [x, y]) => a + y - x, 0);
  const main = groups.sort((a, b) => len(b) - len(a))[0] ?? [];
  const covered = len(main);
  const found = covered >= stations * 0.25;
  if (!main.length) return { key, found: false, path: [], segments: [], depth: 0, coverage: 0 };
  main.sort((a, b) => a[0] - b[0]);
  const first = main[0][0];
  const last = main.at(-1)![1];
  let sum = 0;
  for (const [a, b] of main) for (let k = a; k < b; k++) sum += strength[k];
  return {
    key,
    found,
    path: points.slice(first, last),
    segments: main.map(([a, b]) => points.slice(a, b)),
    depth: sum / covered,
    coverage: (last - first) / stations,
  };
}

export function traceAll(img: Pick<GrayImage, "width" | "height">, response: Float32Array): TracedLine[] {
  const field = { width: img.width, height: img.height, data: response };
  const threshold = creaseThreshold(field);
  const done: TracedLine[] = [];
  for (const tpl of TEMPLATES) {
    // A line ignores creases already claimed by a line running the same way (head below heart,
    // fate beside life). Crossing lines aren't excluded, or every crossing would read as a break.
    const axis = (k: LineKey) => TEMPLATES.find((x) => x.key === k)!.axis;
    const exclude = done.filter((l) => l.found && axis(l.key) === tpl.axis).map((l) => l.path);
    done.push(traceLine(tpl, field, threshold, exclude));
  }
  return done;
}
