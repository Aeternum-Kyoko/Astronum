import { describe, it, expect } from "vitest";
import { palmFrame, rectify, toImage, type Landmark, type Point } from "../frame";
import { analyzePalm, handPose, imageQuality, RECT_SIZE } from "../analyze";
import { creaseField, fuseFields } from "../ridges";
import { traceAll } from "../lines";

const W = 640;
const H = 640;

/** A right palm seen face-on, fingers up. */
function rightPalm(): Point[] {
  const lm: Point[] = Array.from({ length: 21 }, () => ({ x: 0, y: 0 }));
  lm[0] = { x: 300, y: 520 };
  const knuckles = [{ x: 400, y: 250 }, { x: 335, y: 240 }, { x: 270, y: 245 }, { x: 205, y: 262 }];
  [5, 9, 13, 17].forEach((base, f) => {
    for (let j = 0; j < 4; j++) lm[base + j] = { x: knuckles[f].x, y: knuckles[f].y - 60 * j };
  });
  for (let j = 1; j <= 4; j++) lm[j] = { x: 410 + j * 30, y: 480 - j * 55 };
  return lm;
}
const lm = rightPalm();
const norm: Landmark[] = lm.map((p) => ({ x: p.x / W, y: p.y / H }));
const frame = palmFrame(lm);

type Stroke = { s: number; t: number; angle: number; len: number };

/** Skin-coloured photo with dark strokes given in palm coordinates; `noise` adds per-pixel grain. */
function photo(strokes: Stroke[], { seed = 3, noise = 0.05, depth = 0.3, blurPx = 0 } = {}) {
  let r = seed;
  const rand = () => (r = (r * 16807) % 2147483647) / 2147483647;
  const shade = new Float32Array(W * H).fill(1);
  for (const st of strokes)
    for (let u = -st.len / 2; u <= st.len / 2; u += 0.002) {
      const c = toImage(frame, st.s + u * Math.cos(st.angle), st.t + u * Math.sin(st.angle));
      for (let dy = -4; dy <= 4; dy++)
        for (let dx = -4; dx <= 4; dx++) {
          const x = Math.round(c.x) + dx;
          const y = Math.round(c.y) + dy;
          if (x < 0 || y < 0 || x >= W || y >= H) continue;
          const i = y * W + x;
          shade[i] = Math.min(shade[i], 1 - depth * Math.exp(-((x - c.x) ** 2 + (y - c.y) ** 2) / (3 + blurPx * blurPx)));
        }
    }
  const data = new Uint8ClampedArray(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    const v = shade[i] * (1 - noise / 2 + noise * rand());
    data[i * 4] = 225 * v;
    data[i * 4 + 1] = 180 * v;
    data[i * 4 + 2] = 160 * v;
    data[i * 4 + 3] = 255;
  }
  return { width: W, height: H, data };
}

const star = (s: number, t: number): Stroke[] => [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4].map((angle) => ({ s, t, angle, len: 0.1 }));

describe("mounts", () => {
  const strokes: Stroke[] = [
    ...star(0.05, 0.1), // Jupiter
    { s: 0.55, t: 0.09, angle: Math.PI / 2, len: 0.12 }, // Sun: vertical lines
    { s: 0.62, t: 0.09, angle: Math.PI / 2, len: 0.12 },
    ...[0.6, 0.68, 0.76, 0.84].map((t) => ({ s: 0.85, t, angle: 0.15, len: 0.32 })), // Moon: a grille
    ...[0.74, 0.82, 0.9, 0.98].map((s) => ({ s, t: 0.73, angle: Math.PI / 2 - 0.1, len: 0.32 })),
  ];
  const a = analyzePalm(photo(strokes), norm, null, "Right", { answers: { jupiter: "full", saturn: "flat" }, kundli: { Jupiter: "Excellent", Saturn: "Weak" } });
  const m = (k: string) => a.mounts.find((x) => x.key === k)!;

  it("reads all ten mounts with their planets", () => {
    expect(a.mounts.map((x) => x.planet)).toEqual(["Jupiter", "Saturn", "Sun", "Mercury", "Mars", "Mars", "Venus", "Moon", "Rahu", "Ketu"]);
  });

  it("finds a star, vertical lines and a grille where they were drawn, and nothing on a clear mount", () => {
    expect(m("jupiter").sign).toBe("star");
    expect(m("jupiter").markings[0].kind).toBe("star");
    expect(m("sun").sign).toBe("vertical");
    expect(m("moon").sign).toBe("grille");
    expect(m("saturn").sign).toBe("clear");
    expect(m("mercury").sign).toBe("clear");
  });

  it("adds the reader's fullness answers and cross-checks the kundli", () => {
    expect(m("jupiter").fullness).toBe("full");
    expect(m("jupiter").text).toMatch(/natural leader/);
    expect(m("jupiter").kundli).toMatch(/Confirmed: Jupiter is also excellent/);
    expect(m("saturn").kundli).toMatch(/agrees: Saturn is weak/);
    expect(m("rahu").fullness).toBeNull();
  });
});

describe("photo quality", () => {
  it("scores a blurred photo as less sharp than the same photo in focus", () => {
    const strokes = star(0.4, 0.5);
    const sharp = imageQuality(rectify(photo(strokes), frame, RECT_SIZE.width, RECT_SIZE.height));
    const soft = imageQuality(rectify(photo(strokes, { noise: 0.005, blurPx: 3 }), frame, RECT_SIZE.width, RECT_SIZE.height));
    expect(sharp.sharpness).toBeGreaterThan(soft.sharpness);
  });

  it("flags curled fingers and a tilted palm from the 3D landmarks", () => {
    const flat = lm.map((p) => ({ x: p.x / 3000, y: p.y / 3000, z: 0 }));
    expect(handPose(lm, flat).straightness!).toBeGreaterThan(0.99);
    expect(handPose(lm, flat).tilt!).toBeLessThan(0.05);
    // Curl each finger: tips fold back toward the palm.
    const curled = flat.map((p, i) => ([7, 11, 15, 19].includes(i) ? { ...p, z: 0.03 } : [8, 12, 16, 20].includes(i) ? { ...p, y: p.y + 0.04, z: 0.04 } : p));
    expect(handPose(lm, curled).straightness!).toBeLessThan(0.9);
    // The palm looks half as long on screen as it really is: tilted away.
    const squashed = lm.map((p) => ({ x: p.x, y: 300 + (p.y - 300) * 0.5 }));
    expect(handPose(squashed, flat).tilt!).toBeGreaterThan(0.3);
  });
});

describe("fusing frames", () => {
  it("recovers a faint line from noisy frames that no single frame shows", () => {
    // A faint heart line under heavy grain: each frame alone is too noisy.
    const heart: Stroke[] = [{ s: 0.55, t: 0.12, angle: -0.05, len: 0.9 }];
    let fused = null;
    let single = null;
    for (let k = 0; k < 10; k++) {
      const img = rectify(photo(heart, { seed: 11 + k * 97, noise: 0.5, depth: 0.1 }), frame, RECT_SIZE.width, RECT_SIZE.height);
      const field = creaseField(img);
      single ??= field;
      fused = fuseFields(fused, field, 0.3);
    }
    const heartOf = (f: typeof single) => traceAll(f!, f!.response).find((l) => l.key === "heart")!;
    expect(heartOf(fused).coverage).toBeGreaterThan(heartOf(single).coverage);
    expect(heartOf(fused).found).toBe(true);
  });
});

describe("palm reading in Hindi", () => {
  it("reads the same palm in Hindi", () => {
    const strokes: Stroke[] = star(0.05, 0.1);
    const hi = analyzePalm(photo(strokes), norm, null, "Right", { answers: { jupiter: "full" }, kundli: { Jupiter: "Excellent" }, locale: "hi" });
    const j = hi.mounts.find((m) => m.key === "jupiter")!;
    expect(j.name).toBe("गुरु पर्वत");
    expect(j.text).toMatch(/स्वाभाविक नेता/);
    expect(j.kundli).toMatch(/पुष्टि/);
    expect(hi.reading.lines[0].name).toBe("हृदय रेखा");
  });
});
