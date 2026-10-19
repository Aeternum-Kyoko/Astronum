import { describe, expect, it } from "vitest";
import { readingEvidence } from "../readingEvidence";
import { calculateKundali } from "../kundali";
const chart = calculateKundali({ name: "Test", date: "1990-04-12", time: "06:45", latitude: 26.9124, longitude: 75.7873, timezone: "Asia/Kolkata", place: "Jaipur" });
const at = new Date("2026-10-10T12:00:00Z");
describe("traceable reading evidence", () => {
  it("changes the assertion and measurement with the underlying strength", () => {
    const lord = chart.houseLords.find(h => h.house === 10)!.lord;
    const changed = { ...chart, shadbala: chart.shadbala.map(p => p.planet === lord ? { ...p, isStrong: false, rupas: 0.1 } : p) };
    const entry = readingEvidence(changed, [10], ["D10"], at, null)[0].items.find(e => e.method === "Shadbala")!;
    expect(entry.tone).toBe("pressure"); expect(entry.observation).toContain("0.10"); expect(entry.statement).toContain("below");
    expect(entry.rule).toBeTruthy(); expect(entry.limitation).toBeTruthy(); expect(entry.sourceTab).toBe("shadbala");
  });
  it("exposes mixed checks without flattening them into a score", () => {
    const lord = chart.houseLords.find(h => h.house === 10)!.lord;
    const changed = { ...chart, planets: chart.planets.map(p => p.planet === lord ? { ...p, dignity: "Exalted" as const } : p), shadbala: chart.shadbala.map(p => p.planet === lord ? { ...p, isStrong: false, rupas: 0.1 } : p) };
    const result = readingEvidence(changed, [10], [], at, [])[0];
    expect(result.mixed).toBe(true);
    expect(result.items.some(e => e.tone === "support")).toBe(true);
    expect(result.items.some(e => e.tone === "pressure")).toBe(true);
    expect(new Set(result.items.map(e => e.id)).size).toBe(result.items.length);
  });
  it("labels unloaded transits and timestamps the dasha observation", () => {
    const result = readingEvidence(chart, [7], ["D9"], at, null)[0];
    expect(result.missing.some(m => m.includes("transit"))).toBe(true);
    expect(result.items.find(e => e.method === "Dasha")?.observation).toContain(at.toISOString());
    expect(result.items.some(e => e.method === "Transit")).toBe(false);
    const hindi = readingEvidence(chart, [7], ["D9"], at, [], "hi")[0];
    expect(hindi.items[0].statement).toContain("भाव");
  });
  it("points each assertion to the chart factor it measures", () => {
    const items = readingEvidence(chart, [7, 10], ["D9", "D10"], at, [], "hi").flatMap(group => group.items);
    expect(items.length).toBeGreaterThan(10);
    for (const item of items) {
      expect(item.destination.chart).toBe(item.method === "Varga" ? item.id.split("varga-")[1] : "D1");
      if (item.destination.pick.kind === "planet") {
        const planet = item.destination.pick.planet;
        expect(planet).toBe(chart.houseLords.find(h => h.house === item.house)?.lord);
        const planets = item.destination.chart === "D1" ? chart.planets : chart.divisionalCharts[item.destination.chart].planets;
        expect(planets.some(p => p.planet === planet)).toBe(true);
      } else {
        expect(item.destination.pick.house).toBe(item.house);
      }
    }
  });
});
