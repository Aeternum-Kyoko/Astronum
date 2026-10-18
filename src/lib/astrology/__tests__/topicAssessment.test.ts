import { describe, expect, it } from "vitest";
import { calculateKundali } from "../kundali";
import { readingEvidence } from "../readingEvidence";
import { assessTopic } from "../topicAssessment";

const chart = calculateKundali({ name: "Test", date: "1990-04-12", time: "06:45", latitude: 26.9124, longitude: 75.7873, timezone: "Asia/Kolkata", place: "Jaipur" });
const at = new Date("2026-10-12T06:30:00Z");

describe("topic assessment", () => {
  it("keeps the primary house's contradictory evidence together", () => {
    const evidence = readingEvidence(chart, [10, 6, 2, 11], ["D10"], at, null);
    const result = assessTopic(chart, "Career & direction", [10, 6, 2, 11], ["Sun", "Saturn", "Mercury"], evidence, ["Saturn"]);
    expect(result.lead).toContain("Saturn");
    expect(result.supporting?.house).toBe(10);
    expect(result.demanding?.house).toBe(10);
    expect(result.balance).toBe("mixed");
    expect(result.activation).toContain("Saturn");
    expect(result.markers.some(marker => marker.planet === "Saturn" && marker.symbol === "V")).toBe(true);
  });

  it("does not imply an event window when no running lord directly connects", () => {
    const evidence = readingEvidence(chart, [7], ["D9"], at, null);
    const result = assessTopic(chart, "Relationships", [7], ["Venus"], evidence, []);
    expect(result.activation).toContain("do not directly connect");
    expect(result.activation).not.toContain("promised event");
  });
});
