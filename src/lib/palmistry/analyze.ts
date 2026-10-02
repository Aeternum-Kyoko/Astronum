import { dist, palmFrame, palmHand, rectify, showsPalm, toImage, toPixels, INDEX, LITTLE, type Hand, type Landmark, type Point, type RgbaSource } from "./frame";
import { traceAll, type LineKey, type TracedLine } from "./lines";
import { creaseResponse } from "./ridges";
import { readPalm, type PalmReading } from "./reading";

/** Size of the straightened palm image the lines are searched in. */
export const RECT_SIZE = { width: 288, height: 240 };

export interface DrawnLine {
  key: LineKey;
  found: boolean;
  /** Visible stretches of the line, in image pixels. */
  segments: Point[][];
  /** The whole course including any breaks, in image pixels. */
  path: Point[];
}

export type PalmIssue = "back-of-hand" | "too-small" | "too-dark" | "too-bright";

export interface PalmScan {
  lines: DrawnLine[];
  traced: TracedLine[];
  issues: PalmIssue[];
}

/** Brightness of the palm centre, 0–1, from a coarse sample. */
function palmBrightness(src: RgbaSource, lm: Point[]): number {
  const f = palmFrame(lm);
  let sum = 0;
  let n = 0;
  for (let s = 0.15; s <= 0.85; s += 0.1)
    for (let t = 0.2; t <= 0.8; t += 0.1) {
      const p = toImage(f, s, t);
      const x = Math.round(p.x);
      const y = Math.round(p.y);
      if (x < 0 || y < 0 || x >= src.width || y >= src.height) continue;
      const i = (y * src.width + x) * 4;
      sum += (0.299 * src.data[i] + 0.587 * src.data[i + 1] + 0.114 * src.data[i + 2]) / 255;
      n++;
    }
  return n ? sum / n : 0.5;
}

/**
 * Finds the four major lines on one frame or photo. Fast enough to run live.
 * Pass `hand` when the reader has said which hand it is; then a mismatch means
 * the back of the hand is showing.
 */
export function scanPalm(src: RgbaSource, landmarks: Landmark[], hand?: Hand): PalmScan {
  const lm = toPixels(landmarks, src.width, src.height);
  const issues: PalmIssue[] = [];
  if (hand && !showsPalm(lm, hand)) issues.push("back-of-hand");
  // Below this knuckle span the creases are only a pixel or two wide.
  if (dist(lm[INDEX[0]], lm[LITTLE[0]]) < 150) issues.push("too-small");
  const light = palmBrightness(src, lm);
  if (light < 0.22) issues.push("too-dark");
  else if (light > 0.93) issues.push("too-bright");

  const frame = palmFrame(lm);
  const img = rectify(src, frame, RECT_SIZE.width, RECT_SIZE.height);
  const traced = traceAll(img, creaseResponse(img));
  const px = (pts: { s: number; t: number }[]) => pts.map((p) => toImage(frame, p.s, p.t));
  const lines = traced.map((l) => ({ key: l.key, found: l.found, segments: l.segments.map(px), path: px(l.path) }));
  return { lines, traced, issues };
}

export interface PalmAnalysis extends PalmScan {
  reading: PalmReading;
  hand: Hand;
}

export function analyzePalm(src: RgbaSource, landmarks: Landmark[], world: Landmark[] | null, hand?: Hand): PalmAnalysis {
  const scan = scanPalm(src, landmarks, hand);
  return { ...scan, hand: hand ?? palmHand(landmarks), reading: readPalm(scan.traced, world) };
}
