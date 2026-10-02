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
 * How strongly each pixel sits in a thin dark groove — a palm crease — at the
 * given scale. Uses the Hessian: across a crease the brightness curves upward
 * sharply (large positive eigenvalue) while along it it stays flat. The image
 * is first divided by its local brightness so creases in shadow count as much
 * as creases in light. Pixels off the photo (NaN) score zero.
 */
export function creaseResponse(img: GrayImage, scales = [2, 3.5]): Float32Array {
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

  const base = { width: w, height: h, data: filled };
  const local = blur(base, 12);
  const norm = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) norm[i] = filled[i] / Math.max(local.data[i], 0.05);

  const out = new Float32Array(w * h);
  for (const sigma of scales) {
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
        if (r > out[i]) out[i] = r;
      }
  }
  return out;
}
