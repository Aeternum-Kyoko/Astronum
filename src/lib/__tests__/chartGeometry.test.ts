import { describe, it, expect } from "vitest";
import { HOUSE_POLYGONS, SIGN_ANCHORS, layoutHouse } from "../chartGeometry";

/** Point-in-polygon by ray casting. */
function inside([x, y]: [number, number], poly: number[][]): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

describe("North Indian chart layout", () => {
  it("keeps every sign number inside its own house", () => {
    SIGN_ANCHORS.forEach((p, i) => expect(inside(p, HOUSE_POLYGONS[i]), `house ${i + 1}`).toBe(true));
  });

  it("fits up to nine planets inside every house, clear of the sign number", () => {
    for (let house = 1; house <= 12; house++)
      for (let n = 1; n <= 9; n++) {
        const { points, scale } = layoutHouse(house, n);
        expect(points).toHaveLength(n);
        const halfW = 18 * scale; // half a label's width
        for (const [x, y] of points) {
          // The label's centre and its left and right ends all lie inside the house.
          for (const probe of [
            [x, y - 4 * scale],
            [x - halfW, y - 4 * scale],
            [x + halfW, y - 4 * scale],
          ] as [number, number][])
            expect(inside(probe, HOUSE_POLYGONS[house - 1]), `house ${house}, ${n} planets, label at ${x},${y}`).toBe(true);
          const [sx, sy] = SIGN_ANCHORS[house - 1];
          expect(Math.hypot(x - sx, y - sy), `house ${house}, ${n} planets`).toBeGreaterThan(9);
        }
      }
  });
});
