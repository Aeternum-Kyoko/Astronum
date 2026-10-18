import { describe, expect, it } from "vitest";
import { calendarSignals } from "../astrologerCalendar";
import type { LifeTimeline, LifeEvent, TimelineAntar } from "../lifeTimeline";

const from = new Date("2026-10-01T00:00:00Z");
const event = (kind: LifeEvent["kind"], confidence: number, peak: LifeEvent["peak"] = null): LifeEvent => ({
  kind, label: kind, nature: "positive", confidence, level: "Possible", peak, advice: "",
  evidence: [{ layer: "Dasha", text: "Lord connects", points: 2 }, { layer: "Transit", text: "Jupiter connects", points: 1 }, { layer: "KP", text: "Cusp disagrees", points: -1 }],
});
const antar: TimelineAntar = {
  lord: "Venus", start: new Date("2026-09-01T00:00:00Z"), end: new Date("2027-05-01T00:00:00Z"),
  ageStart: 30, ageEnd: 31, tone: "Mixed", houses: [], themes: [], note: "",
  events: [event("career", 70, { start: new Date("2026-09-20T00:00:00Z"), end: new Date("2026-10-20T00:00:00Z"), why: "" }), event("jobChange", 80, { start: new Date("2026-10-05T00:00:00Z"), end: new Date("2026-10-20T00:00:00Z"), why: "" }), event("marriage", 60)],
};
const timeline = { mahas: [{ lord: "Saturn", start: antar.start, end: antar.end, ageStart: 30, ageEnd: 31, tone: "Mixed", summary: "", antars: [antar] }], milestones: [], years: [], keyWindows: [] } as LifeTimeline;

describe("astrologer signal calendar", () => {
  it("keeps a live peak in the current month and groups related career themes", () => {
    const signals = calendarSignals(timeline, from, 12, "career");
    expect(signals.map(item => item.event.kind)).toEqual(["career", "jobChange"]);
    expect(signals[0].date).toEqual(from);
    expect(signals[0].transitReason).toBe("Jupiter connects");
    expect(signals[0].counterpoint).toBe("Cusp disagrees");
    expect(signals[0].agreeingLayers).toEqual(["Dasha", "Transit"]);
  });
  it("excludes windows outside the selected horizon", () => {
    expect(calendarSignals(timeline, new Date("2028-01-01T00:00:00Z"), 12)).toEqual([]);
  });
});
