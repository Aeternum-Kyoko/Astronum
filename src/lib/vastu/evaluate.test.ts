import { describe, expect, it } from "vitest";
import { evaluateVastu } from "./evaluate";
import type { VastuAssessmentInput } from "./types";

const base: VastuAssessmentInput = {
  propertyType: "house", northReference: "compass", entrance: "unknown", rooms: [], floors: 1,
  planBearing: 0, daylight: "unknown", ventilation: "unknown", dampness: "unknown", accessAndSafety: "unknown",
};

describe("evaluateVastu", () => {
  it("returns no property-layout finding until a room or condition is provided", () => {
    const result = evaluateVastu(base);
    expect(result.findings.map((finding) => finding.id)).toEqual(["entrance-unknown"]);
    expect(result.summary).toEqual({ priority: 0, consider: 0, notes: 1 });
  });

  it("reports preferred rooms as notes and separates practical priority issues", () => {
    const result = evaluateVastu({
      ...base,
      entrance: "E",
      rooms: [
        { id: "kitchen", room: "kitchen", zone: "SE", floor: 1 },
        { id: "toilet", room: "toilet", zone: "NE", floor: 1 },
      ],
      daylight: "limited", ventilation: "limited", dampness: "yes", accessAndSafety: "needsAttention",
    });

    expect(result.findings.find((finding) => finding.id === "convention-match-kitchen-SE-1")).toMatchObject({ level: "note", sourceType: "modern-vastu-convention" });
    expect(result.findings.find((finding) => finding.id === "toilet-northeast-1")).toMatchObject({ level: "consider", sourceType: "modern-vastu-convention" });
    expect(result.findings.filter((finding) => finding.sourceType === "practical-housing-guidance")).toHaveLength(4);
    expect(result.summary).toEqual({ priority: 3, consider: 2, notes: 2 });
  });
});
