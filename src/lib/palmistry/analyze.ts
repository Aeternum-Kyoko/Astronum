import { dist, palmFrame, palmHand, rectify, showsPalm, skinMask, toImage, toPixels, xToS, yToT, INDEX, LITTLE, MIDDLE, RING, WRIST, type GrayImage, type Hand, type Landmark, type Point, type RgbaSource } from "./frame";
import { creaseThreshold, traceAll, type LineKey, type TracedLine } from "./lines";
import { blur, creaseField, fuseFields, type CreaseField } from "./ridges";
import { readPalm, type PalmReading } from "./reading";
import { readMounts, type MountAnswers, type MountReading, type KundliGrades } from "./mounts";

/** Size of the straightened palm grid the lines are searched in. */
export const RECT_SIZE = { width: 288, height: 240 };

export interface DrawnLine {
  key: LineKey;
  found: boolean;
  /** Visible stretches of the line, in image pixels. */
  segments: Point[][];
  /** The whole course including any breaks, in image pixels. */
  path: Point[];
}

export type PalmIssue = "back-of-hand" | "too-small" | "too-dark" | "too-bright" | "blurry" | "glare" | "uneven-light" | "curled" | "tilted";

export interface PalmQuality {
  sharpness: number;
  glare: number;
  evenness: number;
  brightness: number;
  straightness: number | null;
  tilt: number | null;
}

export interface PalmScan {
  lines: DrawnLine[];
  traced: TracedLine[];
  issues: PalmIssue[];
  quality: PalmQuality;
  /** The crease map, in palm coordinates — fuse it across frames. */
  field: CreaseField;
}

/** Thresholds for the quality checks, tuned on real palm photos. */
export const QUALITY_LIMITS = { sharpness: 0.6, glare: 0.06, evenness: 0.45, straightness: 0.9, tilt: 0.3 };

/**
 * How usable a straightened palm image is: sharpness (fine detail left after
 * removing the broad shading), glare (blown-out pixels), evenness (light on the
 * thumb side vs the outer side, and top vs bottom) and brightness.
 */
export function imageQuality(img: GrayImage): Pick<PalmQuality, "sharpness" | "glare" | "evenness" | "brightness"> {
  const { width: w, height: h, data } = img;
  const filled = new Float32Array(w * h);
  let mean = 0;
  let n = 0;
  for (let i = 0; i < w * h; i++)
    if (Number.isFinite(data[i])) {
      mean += data[i];
      n++;
    }
  mean = n ? mean / n : 0.5;
  for (let i = 0; i < w * h; i++) filled[i] = Number.isFinite(data[i]) ? data[i] : mean;
  const scale = w / RECT_SIZE.width;
  // Sharpness: the finest detail (raw minus a 1px blur) relative to medium detail (1px minus 3px blur).
  // Focus blur removes the fine band first, so the ratio drops whatever the photo's contrast.
  const b1 = blur({ width: w, height: h, data: filled }, 1 * scale).data;
  const b3 = blur({ width: w, height: h, data: filled }, 3 * scale).data;
  let detail = 0;
  let medium = 0;
  let count = 0;
  let glare = 0;
  const quad = [0, 0, 0, 0];
  const quadN = [0, 0, 0, 0];
  for (let y = 0; y < h; y++) {
    const t = yToT(y, h);
    if (t < 0.08 || t > 0.92) continue;
    for (let x = 0; x < w; x++) {
      const s = xToS(x, w);
      if (s < 0.05 || s > 0.95) continue;
      const i = y * w + x;
      if (!Number.isFinite(data[i])) continue;
      detail += Math.abs(filled[i] - b1[i]);
      medium += Math.abs(b1[i] - b3[i]);
      if (data[i] > 0.97) glare++;
      const q = (s < 0.5 ? 0 : 1) + (t < 0.5 ? 0 : 2);
      quad[q] += data[i];
      quadN[q]++;
      count++;
    }
  }
  if (!count) return { sharpness: 0, glare: 0, evenness: 1, brightness: mean };
  const qm = quad.map((v, i) => (quadN[i] ? v / quadN[i] : mean));
  const brightness = qm.reduce((a, b) => a + b, 0) / 4;
  const evenness = (Math.max(...qm) - Math.min(...qm)) / Math.max(brightness, 0.05);
  return { sharpness: detail / Math.max(medium, 1e-6), glare: glare / count, evenness, brightness };
}

const d3 = (a: Landmark, b: Landmark) => Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0));

/**
 * Hand pose from MediaPipe's 3D world landmarks: how straight the four fingers
 * are (1 = fully straight; a cupped or curled hand drops below 0.9), and how
 * far the palm is tilted away from facing the camera (the palm's length-to-width
 * ratio on screen against its true ratio; 0 = square on).
 */
export function handPose(px: Point[], world: Landmark[] | null): Pick<PalmQuality, "straightness" | "tilt"> {
  if (!world) return { straightness: null, tilt: null };
  const fingers = [INDEX, MIDDLE, RING, LITTLE].map((f) => d3(world[f[0]], world[f[3]]) / (d3(world[f[0]], world[f[1]]) + d3(world[f[1]], world[f[2]]) + d3(world[f[2]], world[f[3]])));
  const straightness = fingers.reduce((a, b) => a + b, 0) / fingers.length;
  const ratio2d = dist(px[WRIST], px[MIDDLE[0]]) / dist(px[INDEX[0]], px[LITTLE[0]]);
  const ratio3d = d3(world[WRIST], world[MIDDLE[0]]) / d3(world[INDEX[0]], world[LITTLE[0]]);
  return { straightness, tilt: Math.abs(Math.log(ratio2d / ratio3d)) };
}

export interface ScanOptions {
  hand?: Hand;
  world?: Landmark[] | null;
  /** Grid scale for the crease search: 1 for live video, 2 for a still photo. */
  scale?: number;
  /** A crease map fused over earlier live frames, blended in to steady the result. */
  prior?: CreaseField | null;
}

/**
 * Finds the four major lines on one frame or photo, with quality checks.
 * Fast enough to run live at scale 1.
 */
export function scanPalm(src: RgbaSource, landmarks: Landmark[], opts: ScanOptions | Hand = {}): PalmScan {
  const o: ScanOptions = typeof opts === "string" ? { hand: opts } : opts;
  const lm = toPixels(landmarks, src.width, src.height);
  // Search at double detail only when the photo really has it (a large palm in a high-resolution still).
  const scale = o.scale ?? 1;
  const frame = palmFrame(lm);
  const img = rectify(src, frame, RECT_SIZE.width * scale, RECT_SIZE.height * scale);
  let field = creaseField(img, scale);
  if (o.prior) field = fuseFields(o.prior, field, 0.5);
  const traced = traceAll(field, field.response);

  const q = imageQuality(img);
  const pose = handPose(lm, o.world ?? null);
  const quality: PalmQuality = { ...q, ...pose };
  const issues: PalmIssue[] = [];
  if (o.hand && !showsPalm(lm, o.hand)) issues.push("back-of-hand");
  // Below this knuckle span the creases are only a pixel or two wide.
  if (dist(lm[INDEX[0]], lm[LITTLE[0]]) < 150) issues.push("too-small");
  if (q.brightness < 0.22) issues.push("too-dark");
  else if (q.brightness > 0.93) issues.push("too-bright");
  if (pose.straightness !== null && pose.straightness < QUALITY_LIMITS.straightness) issues.push("curled");
  if (pose.tilt !== null && pose.tilt > QUALITY_LIMITS.tilt) issues.push("tilted");
  if (q.glare > QUALITY_LIMITS.glare) issues.push("glare");
  if (q.evenness > QUALITY_LIMITS.evenness) issues.push("uneven-light");
  if (q.sharpness < QUALITY_LIMITS.sharpness) issues.push("blurry");

  const toPx = (pts: { s: number; t: number }[]) => pts.map((p) => toImage(frame, p.s, p.t));
  const lines = traced.map((l) => ({ key: l.key, found: l.found, segments: l.segments.map(toPx), path: toPx(l.path) }));
  return { lines, traced, issues, quality, field };
}

export interface PalmAnalysis extends PalmScan {
  reading: PalmReading;
  mounts: MountReading[];
  hand: Hand;
}

/** The mounts for a finished scan — cheap, so it can re-run as the reader answers the fullness questions. */
export function mountsFor(scan: PalmScan, src: RgbaSource, landmarks: Landmark[], answers: MountAnswers = {}, kundli: KundliGrades | null = null): MountReading[] {
  const frame = palmFrame(toPixels(landmarks, src.width, src.height));
  const threshold = creaseThreshold({ width: scan.field.width, height: scan.field.height, data: scan.field.response });
  const skin = skinMask(src, frame, scan.field.width, scan.field.height);
  return readMounts(scan.field, threshold, scan.traced, frame, answers, kundli, skin);
}

export function analyzePalm(
  src: RgbaSource,
  landmarks: Landmark[],
  world: Landmark[] | null,
  hand?: Hand,
  extra: { scale?: number; prior?: CreaseField | null; answers?: MountAnswers; kundli?: KundliGrades | null } = {}
): PalmAnalysis {
  const scan = scanPalm(src, landmarks, { hand, world, scale: extra.scale, prior: extra.prior });
  return { ...scan, hand: hand ?? palmHand(landmarks), reading: readPalm(scan.traced, world), mounts: mountsFor(scan, src, landmarks, extra.answers, extra.kundli) };
}
