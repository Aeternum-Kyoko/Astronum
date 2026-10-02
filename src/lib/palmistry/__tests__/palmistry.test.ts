import { describe, it, expect } from "vitest";
import { palmFrame, palmHand, showsPalm, toImage, toPalm, type Landmark, type Point } from "../frame";
import { scanPalm, analyzePalm } from "../analyze";
import type { LineKey } from "../lines";

const W = 640;
const H = 640;

/** A right palm seen face-on, fingers up: thumb on the right of the picture. */
function rightPalm(): Point[] {
  const lm: Point[] = Array.from({ length: 21 }, () => ({ x: 0, y: 0 }));
  lm[0] = { x: 300, y: 500 };
  const knuckles = [ { x: 390, y: 260 }, { x: 330, y: 250 }, { x: 270, y: 255 }, { x: 215, y: 272 } ];
  [5, 9, 13, 17].forEach((base, f) => {
    const lens = [85, 95, 90, 70][f];
    for (let j = 0; j < 4; j++) lm[base + j] = { x: knuckles[f].x - f * 4 * j, y: knuckles[f].y - (lens * j) / 1.2 };
  });
  for (let j = 1; j <= 4; j++) lm[j] = { x: 400 + j * 30, y: 470 - j * 55 };
  return lm;
}

const norm = (lm: Point[]): Landmark[] => lm.map((p) => ({ x: p.x / W, y: p.y / H }));
const mirror = (lm: Point[]) => lm.map((p) => ({ x: W - p.x, y: p.y }));

/** True courses for the synthetic creases, in palm coordinates. */
const TRUTH: Record<LineKey, (u: number) => { s: number; t: number }> = {
  heart: (u) => ({ s: 1 - 0.85 * u, t: 0.14 - 0.06 * u * u }),
  head: (u) => ({ s: 0.85 * u, t: 0.2 + 0.2 * u }),
  life: (u) => ({ s: 0.02 + 0.42 * Math.sqrt(u), t: 0.19 + 0.75 * u }),
  fate: (u) => ({ s: 0.5 - 0.04 * u, t: 0.86 - 0.66 * u }),
};

function photo(lm: Point[], lines: LineKey[], seed = 7) {
  let r = seed;
  const rand = () => ((r = (r * 16807) % 2147483647) / 2147483647);
  const data = new Uint8ClampedArray(W * H * 4);
  const shade = new Float32Array(W * H).fill(1);
  const f = palmFrame(lm);
  for (const k of lines)
    for (let u = 0; u <= 1; u += 0.002) {
      const c = toImage(f, TRUTH[k](u).s, TRUTH[k](u).t);
      for (let dy = -4; dy <= 4; dy++)
        for (let dx = -4; dx <= 4; dx++) {
          const x = Math.round(c.x) + dx;
          const y = Math.round(c.y) + dy;
          const d2 = (x - c.x) ** 2 + (y - c.y) ** 2;
          const i = y * W + x;
          shade[i] = Math.min(shade[i], 1 - 0.3 * Math.exp(-d2 / 3));
        }
    }
  for (let i = 0; i < W * H; i++) {
    const v = shade[i] * (0.95 + 0.05 * rand());
    data[i * 4] = 225 * v;
    data[i * 4 + 1] = 180 * v;
    data[i * 4 + 2] = 160 * v;
    data[i * 4 + 3] = 255;
  }
  return { width: W, height: H, data };
}

/** Worst distance from a traced path to the true course, in palm units. */
function error(path: Point[], lm: Point[], k: LineKey) {
  const f = palmFrame(lm);
  const truth = Array.from({ length: 201 }, (_, i) => TRUTH[k](i / 200));
  return Math.max(
    ...path.map((p) => {
      const q = toPalm(f, p);
      return Math.min(...truth.map((t) => Math.hypot(t.s - q.s, t.t - q.t)));
    })
  );
}

describe("palm frame", () => {
  it("round-trips between image and palm coordinates", () => {
    const f = palmFrame(rightPalm());
    const p = toImage(f, 0.37, 0.61);
    const q = toPalm(f, p);
    expect(q.s).toBeCloseTo(0.37, 6);
    expect(q.t).toBeCloseTo(0.61, 6);
  });

  it("tells the palm from the back of the hand", () => {
    expect(showsPalm(rightPalm(), "Right")).toBe(true);
    expect(showsPalm(rightPalm(), "Left")).toBe(false);
    expect(showsPalm(mirror(rightPalm()), "Left")).toBe(true);
  });

  it("tells left from right, assuming the palm is shown", () => {
    expect(palmHand(rightPalm())).toBe("Right");
    expect(palmHand(mirror(rightPalm()))).toBe("Left");
  });
});

describe("scanPalm", () => {
  it("traces all four lines along their true courses", () => {
    const lm = rightPalm();
    const scan = scanPalm(photo(lm, ["heart", "head", "life", "fate"]), norm(lm), "Right");
    expect(scan.issues).toEqual([]);
    for (const line of scan.lines) {
      expect(line.found, line.key).toBe(true);
      expect(error(line.path, lm, line.key), line.key).toBeLessThan(0.04);
    }
  });

  it("works the same on a left hand", () => {
    const lm = mirror(rightPalm());
    const scan = scanPalm(photo(lm, ["heart", "head", "life"]), norm(lm), "Left");
    expect(scan.issues).toEqual([]);
    const found = Object.fromEntries(scan.lines.map((l) => [l.key, l.found]));
    expect(found).toEqual({ heart: true, head: true, life: true, fate: false });
    for (const line of scan.lines.filter((l) => l.found)) expect(error(line.path, lm, line.key), line.key).toBeLessThan(0.04);
  });

  it("finds nothing on a blank palm", () => {
    const lm = rightPalm();
    const scan = scanPalm(photo(lm, []), norm(lm), "Right");
    expect(scan.lines.filter((l) => l.found)).toEqual([]);
  });

  it("flags the back of the hand", () => {
    const lm = rightPalm();
    expect(scanPalm(photo(lm, []), norm(lm), "Left").issues).toContain("back-of-hand");
  });
});

describe("analyzePalm", () => {
  it("writes a reading for every line and the hand shape", () => {
    const lm = rightPalm();
    const world = lm.map((p) => ({ x: p.x / 3000, y: p.y / 3000, z: 0 }));
    const a = analyzePalm(photo(lm, ["heart", "head", "life"]), norm(lm), world, "Right");
    expect(a.reading.lines.map((l) => l.key)).toEqual(["heart", "head", "life", "fate"]);
    expect(a.reading.lines.find((l) => l.key === "fate")!.found).toBe(false);
    expect(a.reading.lines.find((l) => l.key === "life")!.text).toMatch(/not read it as the length of life/);
    expect(a.reading.element.name).toMatch(/(Earth|Air|Fire|Water) hand/);
    expect(a.reading.fingers).toHaveLength(3);
    expect(a.reading.summary.length).toBeGreaterThan(10);
  });
});
