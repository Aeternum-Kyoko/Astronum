/**
 * A coordinate frame fixed to the palm, built from the 21 MediaPipe hand
 * landmarks (0 wrist; 1–4 thumb; 5–8 index; 9–12 middle; 13–16 ring; 17–20 little).
 *
 * Palm coordinates (s, t):
 *   s = 0 at the index knuckle, 1 at the little-finger knuckle (thumb side → outer edge)
 *   t = 0 at the knuckle line, 1 at the wrist
 * The map is affine, so left and right hands, palm rotation and distance from
 * the camera all land on the same (s, t) layout and one set of line templates fits all.
 */

export interface Point {
  x: number;
  y: number;
}

export interface Landmark extends Point {
  z?: number;
}

export type Hand = "Left" | "Right";

export interface PalmFrame {
  origin: Point; // index knuckle
  ex: Point; // index knuckle → little-finger knuckle
  ey: Point; // middle knuckle → wrist
}

export const WRIST = 0;
export const THUMB = [1, 2, 3, 4] as const;
export const INDEX = [5, 6, 7, 8] as const;
export const MIDDLE = [9, 10, 11, 12] as const;
export const RING = [13, 14, 15, 16] as const;
export const LITTLE = [17, 18, 19, 20] as const;

const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });
export const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/** Landmarks in pixels (MediaPipe gives them normalised to 0–1). */
export function toPixels(landmarks: Landmark[], width: number, height: number): Point[] {
  return landmarks.map((p) => ({ x: p.x * width, y: p.y * height }));
}

export function palmFrame(lm: Point[]): PalmFrame {
  return { origin: lm[INDEX[0]], ex: sub(lm[LITTLE[0]], lm[INDEX[0]]), ey: sub(lm[WRIST], lm[MIDDLE[0]]) };
}

export function toImage(f: PalmFrame, s: number, t: number): Point {
  return { x: f.origin.x + s * f.ex.x + t * f.ey.x, y: f.origin.y + s * f.ex.y + t * f.ey.y };
}

export function toPalm(f: PalmFrame, p: Point): { s: number; t: number } {
  const det = f.ex.x * f.ey.y - f.ex.y * f.ey.x;
  const dx = p.x - f.origin.x;
  const dy = p.y - f.origin.y;
  return { s: (dx * f.ey.y - dy * f.ey.x) / det, t: (f.ex.x * dy - f.ex.y * dx) / det };
}

/**
 * Whether the inside of the hand faces the camera. Seen palm-on with the
 * fingers up, a right hand has its thumb on the right of the picture; the back
 * of the same hand (or a left palm) is its mirror image, which flips the sign.
 */
export function showsPalm(lm: Point[], hand: Hand): boolean {
  const up = sub(lm[MIDDLE[0]], lm[WRIST]);
  const across = sub(lm[LITTLE[0]], lm[INDEX[0]]);
  const cross = up.x * across.y - up.y * across.x;
  return hand === "Right" ? cross < 0 : cross > 0;
}

/**
 * Which hand this is, assuming the palm faces the camera. MediaPipe's own
 * left/right label flickers between frames of the same hand, so geometry decides.
 */
export function palmHand(lm: Point[]): Hand {
  return showsPalm(lm, "Right") ? "Right" : "Left";
}

/** The region of palm coordinates that gets rectified and searched. */
export const RECT = { s0: -0.3, s1: 1.15, t0: -0.08, t1: 1.08 } as const;

export interface GrayImage {
  width: number;
  height: number;
  data: Float32Array; // 0–1 luminance, row-major
}

export interface RgbaSource {
  width: number;
  height: number;
  data: Uint8ClampedArray | Uint8Array;
}

export function sToX(s: number, w: number) {
  return ((s - RECT.s0) / (RECT.s1 - RECT.s0)) * (w - 1);
}
export function tToY(t: number, h: number) {
  return ((t - RECT.t0) / (RECT.t1 - RECT.t0)) * (h - 1);
}
export function xToS(x: number, w: number) {
  return RECT.s0 + (x / (w - 1)) * (RECT.s1 - RECT.s0);
}
export function yToT(y: number, h: number) {
  return RECT.t0 + (y / (h - 1)) * (RECT.t1 - RECT.t0);
}

/**
 * Resamples the palm into a straight-on grey image in palm coordinates, so the
 * line search can work on the same layout whatever the hand's pose. Pixels
 * outside the photo are marked NaN.
 */
export function rectify(src: RgbaSource, f: PalmFrame, width: number, height: number): GrayImage {
  const out = new Float32Array(width * height);
  const { data, width: sw, height: sh } = src;
  const lum = (i: number) => (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
  for (let y = 0; y < height; y++) {
    const t = yToT(y, height);
    for (let x = 0; x < width; x++) {
      const p = toImage(f, xToS(x, width), t);
      const x0 = Math.floor(p.x);
      const y0 = Math.floor(p.y);
      if (x0 < 0 || y0 < 0 || x0 + 1 >= sw || y0 + 1 >= sh) {
        out[y * width + x] = NaN;
        continue;
      }
      const fx = p.x - x0;
      const fy = p.y - y0;
      const i = (y0 * sw + x0) * 4;
      const a = lum(i);
      const b = lum(i + 4);
      const c = lum(i + sw * 4);
      const d = lum(i + sw * 4 + 4);
      out[y * width + x] = (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
    }
  }
  return { width, height, data: out };
}

/**
 * Which cells of the straightened palm grid show skin: colour (chromaticity)
 * and brightness close to the palm centre's. Keeps background texture beside
 * the hand out of the mount readings.
 */
export function skinMask(src: RgbaSource, f: PalmFrame, width: number, height: number): Uint8Array {
  const { data, width: sw, height: sh } = src;
  const at = (s: number, t: number) => {
    const p = toImage(f, s, t);
    const x = Math.round(p.x);
    const y = Math.round(p.y);
    if (x < 0 || y < 0 || x >= sw || y >= sh) return null;
    const i = (y * sw + x) * 4;
    const sum = data[i] + data[i + 1] + data[i + 2] + 1;
    return { r: data[i] / sum, g: data[i + 1] / sum, l: sum / 765 };
  };
  let r = 0;
  let g = 0;
  let l = 0;
  let n = 0;
  for (let s = 0.2; s <= 0.8; s += 0.1)
    for (let t = 0.3; t <= 0.8; t += 0.1) {
      const c = at(s, t);
      if (!c) continue;
      r += c.r;
      g += c.g;
      l += c.l;
      n++;
    }
  const out = new Uint8Array(width * height);
  if (!n) return out.fill(1);
  r /= n;
  g /= n;
  l /= n;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const c = at(xToS(x, width), yToT(y, height));
      if (!c) continue;
      const chroma = Math.hypot(c.r - r, c.g - g);
      out[y * width + x] = chroma < 0.045 && c.l > l * 0.45 && c.l < l * 1.7 ? 1 : 0;
    }
  return out;
}
