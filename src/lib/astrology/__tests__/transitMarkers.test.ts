import { describe, it, expect } from "vitest";
import { transitMarkers } from "../chartMarkers";

describe("transitMarkers", () => {
  it("marks exaltation, debilitation, retrograde and combustion from the same moment's Sun", () => {
    const m = transitMarkers([
      { planet: "Sun", signIndex: 0, longitude: 10, retrograde: false }, // Aries: exalted
      { planet: "Saturn", signIndex: 0, longitude: 20, retrograde: false }, // Aries: debilitated, 10° from Sun → combust (orb 15)
      { planet: "Jupiter", signIndex: 3, longitude: 95, retrograde: true }, // Cancer: exalted, retrograde
      { planet: "Mars", signIndex: 3, longitude: 100, retrograde: false }, // Cancer: debilitated, far from Sun
      { planet: "Rahu", signIndex: 5, longitude: 160, retrograde: true },
    ]);
    expect(m.Sun).toBe("↑");
    expect(m.Saturn).toBe("↓C");
    expect(m.Jupiter).toBe("↑R");
    expect(m.Mars).toBe("↓");
    expect(m.Rahu).toBe("");
  });

  it("handles combustion across 0° Aries", () => {
    const m = transitMarkers([
      { planet: "Sun", signIndex: 11, longitude: 358, retrograde: false },
      { planet: "Venus", signIndex: 0, longitude: 3, retrograde: false },
    ]);
    expect(m.Venus).toContain("C");
  });
});
