import { describe, expect, it } from "vitest";
import { reliabilityState, type SensitivityRecord } from "../birthReliability";

const record: SensitivityRecord = { precision: "15", sampleCount: 31, fields: [
  { key: "D9 ascendant", stable: true }, { key: "D9 Venus sign", stable: false },
] };

describe("divisional claim reliability", () => {
  it("does not infer reliability from a known time alone", () => {
    expect(reliabilityState("unknown", record, "D9")).toBe("unknown");
    expect(reliabilityState("0", record, "D9")).toBe("exact");
    expect(reliabilityState("5", record, "D9")).toBe("unchecked");
  });
  it("checks the particular placement used by a claim", () => {
    expect(reliabilityState("15", record, "D9")).toBe("stable");
    expect(reliabilityState("15", record, "D9", "Venus")).toBe("changes");
    expect(reliabilityState("15", record, "D9", "Mars")).toBe("unchecked");
  });
});
