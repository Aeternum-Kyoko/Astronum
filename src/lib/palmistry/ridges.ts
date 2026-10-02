import type { GrayImage } from "./frame";

/** Separable Gaussian blur. */
export function blur(img: GrayImage, sigma: number): GrayImage {
  const { width: w, height: h, data } = img;
  const r = Math.max(1, Math.ceil(sigma * 3));
  const k = new Float32Array(2 * r + 1);
  let sum = 0;
  for (let i = -r; i <= r; i++) sum += k[i + r] = Math.exp(-(i * i) / (2 * sigma * sigma));
  for (let i = 0; i < k.length; i++) k[i] /= sum;
  const clamp = (v: number, max: number) => (v < 0 ? 0 : v > max ? max : v);
  const tmp = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let i = -r; i <= r; i++) acc += k[i + r] * data[y * w + clamp(x + i, w - 1)];
      tmp[y * w + x] = acc;
    }
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let i = -r; i <= r; i++) acc += k[i + r] * tmp[clamp(y + i, h - 1) * w + x];
      out[y * w + x] = acc;
    }
  return { width: w, height: h, data: out };
}

/**
 * Crease strength and direction over the straightened palm, at the base search
 * resolution. `response` is how strongly each pixel sits in a thin dark groove;
 * `orientation` is the groove's direction (radians, 0 = along the palm's width,
 * π/2 = along its length); `valid` marks pixels that came from the photo.
 */
export interface CreaseField {
  width: number;
  height: number;
  response: Float32Array;
  orientation: Float32Array;
  valid: Uint8Array;
}

/**
 * Finds creases with the Hessian: across a crease the brightness curves upward
 * sharply (large positive eigenvalue) while along it it stays flat. The image
 * is first divided by its local brightness so creases in shadow count as much
 * as creases in light. `scale` is how many times larger than the base grid the
 * input is (2 for a full-resolution photo); filters scale with it, and the
 * result is max-pooled back to the base grid so a fine crease survives intact.
 */
export function creaseField(img: GrayImage, scale = 1): CreaseField {
  const { width: w, height: h } = img;
  const valid = new Uint8Array(w * h);
  let mean = 0;
  let n = 0;
  for (let i = 0; i < w * h; i++)
    if (Number.isFinite(img.data[i])) {
      valid[i] = 1;
      mean += img.data[i];
      n++;
    }
  mean = n ? mean / n : 0.5;
  const filled = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) filled[i] = valid[i] ? img.data[i] : mean;

  const local = blur({ width: w, height: h, data: filled }, 12 * scale);
  const norm = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) norm[i] = filled[i] / Math.max(local.data[i], 0.05);

  const resp = new Float32Array(w * h);
  const orient = new Float32Array(w * h);
  for (const base of [2, 3.5]) {
    const sigma = base * scale;
    const g = blur({ width: w, height: h, data: norm }, sigma).data;
    const s2 = sigma * sigma;
    for (let y = 2; y < h - 2; y++)
      for (let x = 2; x < w - 2; x++) {
        const i = y * w + x;
        if (!valid[i]) continue;
        const ixx = g[i - 1] - 2 * g[i] + g[i + 1];
        const iyy = g[i - w] - 2 * g[i] + g[i + w];
        const ixy = (g[i + w + 1] - g[i + w - 1] - g[i - w + 1] + g[i - w - 1]) / 4;
        const half = (ixx - iyy) / 2;
        const root = Math.sqrt(half * half + ixy * ixy);
        const l1 = (ixx + iyy) / 2 + root;
        const l2 = (ixx + iyy) / 2 - root;
        const r = s2 * (l1 - 0.5 * Math.abs(l2));
        if (r > resp[i]) {
          resp[i] = r;
          // The strongest curvature runs across the crease; the crease itself is perpendicular to it.
          orient[i] = (0.5 * Math.atan2(2 * ixy, ixx - iyy) + Math.PI / 2 + Math.PI) % Math.PI;
        }
      }
  }
  if (scale === 1) return { width: w, height: h, response: resp, orientation: orient, valid };

  // Max-pool to the base grid, keeping the direction of the strongest pixel in each block.
  const bw = Math.round(w / scale);
  const bh = Math.round(h / scale);
  const out = { width: bw, height: bh, response: new Float32Array(bw * bh), orientation: new Float32Array(bw * bh), valid: new Uint8Array(bw * bh) };
  for (let by = 0; by < bh; by++)
    for (let bx = 0; bx < bw; bx++) {
      let best = 0;
      let dir = 0;
      let anyValid = 0;
      for (let y = Math.floor(by * scale); y < Math.min(h, Math.floor((by + 1) * scale)); y++)
        for (let x = Math.floor(bx * scale); x < Math.min(w, Math.floor((bx + 1) * scale)); x++) {
          const i = y * w + x;
          anyValid |= valid[i];
          if (resp[i] > best) {
            best = resp[i];
            dir = orient[i];
          }
        }
      const o = by * bw + bx;
      out.response[o] = best;
      out.orientation[o] = dir;
      out.valid[o] = anyValid;
    }
  return out;
}

/** Back-compat: crease strength alone at the base resolution. */
export function creaseResponse(img: GrayImage): Float32Array {
  return creaseField(img).response;
}

/**
 * Blends a new frame's creases into a running average. Every frame is mapped
 * onto the same palm layout, so real creases line up and add up, while noise,
 * glare and skin texture — different in every frame — average away.
 */
export function fuseFields(prev: CreaseField | null, next: CreaseField, weight = 0.3): CreaseField {
  if (!prev || prev.width !== next.width || prev.height !== next.height) return next;
  const response = new Float32Array(next.response.length);
  const orientation = new Float32Array(next.response.length);
  const valid = new Uint8Array(next.response.length);
  for (let i = 0; i < response.length; i++) {
    response[i] = prev.response[i] * (1 - weight) + next.response[i] * weight;
    orientation[i] = next.response[i] >= prev.response[i] ? next.orientation[i] : prev.orientation[i];
    valid[i] = prev.valid[i] | next.valid[i];
  }
  return { width: next.width, height: next.height, response, orientation, valid };
}
