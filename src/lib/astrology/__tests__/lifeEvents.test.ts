import { describe, it, expect } from "vitest";
import { calculateKundali } from "../kundali";
import { lifeTimeline } from "../lifeTimeline";
import { isShown } from "../lifeEvents";

const charts = [
  ["1990-04-12", "06:45", 26.9124, 75.7873],
  ["1985-11-03", "14:20", 19.076, 72.8777],
  ["1996-07-21", "22:10", 28.6139, 77.209],
].map(([date, time, latitude, longitude]) =>
  calculateKundali({ name: "T", date: date as string, time: time as string, latitude: latitude as number, longitude: longitude as number, timezone: "Asia/Kolkata", place: "X" })
);

describe("life event engine", () => {
  for (const chart of charts) {
    const t = lifeTimeline(chart);
    describe(`${chart.input.date} (${chart.ascendant.sign} Lagna)`, () => {
      it("shows only confident events, each with dasha evidence and a peak inside its period", () => {
        for (const m of t.mahas)
          for (const a of m.antars) {
            expect(a.events.length).toBeLessThanOrEqual(4);
            for (const e of a.events) {
              expect(isShown(e)).toBe(true);
              expect(e.confidence).toBeLessThanOrEqual(97);
              expect(e.evidence.some((x) => x.layer === "Dasha")).toBe(true);
              if (e.peak) {
                expect(new Date(e.peak.start).getTime()).toBeGreaterThanOrEqual(new Date(a.start).getTime() - 1000);
                expect(new Date(e.peak.end).getTime()).toBeLessThanOrEqual(new Date(a.end).getTime() + 1000);
              }
            }
          }
      });

      it("only publishes windows that clear the rule threshold without ordering children after marriage", () => {
        for (const window of t.keyWindows) expect(window.confidence).toBeGreaterThanOrEqual(window.nature === "caution" ? 58 : 50);
        for (const m of t.mahas) for (const a of m.antars) for (const event of a.events) {
          expect(event.evidence.some(item => item.text.includes("before your most likely marriage window"))).toBe(false);
          expect(event.evidence.some(item => item.text.includes("within five years"))).toBe(false);
        }
      });

      it("reads each year's Saturn phase from Saturn's actual sign", () => {
        expect(t.years).toHaveLength(90);
        for (const y of t.years) {
          const m = y.saturn.fromMoon;
          const expected = m === 12 || m === 1 || m === 2 ? "Sade Sati" : m === 4 ? "Kantaka Shani" : m === 8 ? "Ashtama Shani" : null;
          if (expected) expect(y.saturnPhase).toContain(expected);
          else expect(y.saturnPhase).toBeNull();
          expect(y.rating).toBeGreaterThanOrEqual(1);
          expect(y.rating).toBeLessThanOrEqual(5);
        }
      });
    });
  }
});
