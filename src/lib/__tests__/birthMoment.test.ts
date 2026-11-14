import { describe, expect, it } from "vitest";
import { inspectBirthMoment } from "../birthMoment";

describe("birth moment precision", () => {
  it("converts an Indian birth instant to UTC", () => {
    expect(inspectBirthMoment("1990-04-12", "06:45", "Asia/Kolkata").utc).toBe("1990-04-12T01:15:00.000Z");
  });
  it("rejects impossible calendar dates and timezone names", () => {
    expect(inspectBirthMoment("2001-02-29", "12:00", "UTC").valid).toBe(false);
    expect(inspectBirthMoment("2001-02-28", "12:00", "Missing/Zone").valid).toBe(false);
  });
  it("rejects a skipped local time in New York", () => {
    expect(inspectBirthMoment("2024-03-10", "02:30", "America/New_York").valid).toBe(false);
  });
  it("requires disambiguation of repeated times", () => {
    expect(inspectBirthMoment("2024-11-03", "01:30", "America/New_York").valid).toBe(false);
    expect(inspectBirthMoment("2024-11-03", "01:30", "UTC-04:00").utc).toBe("2024-11-03T05:30:00.000Z");
  });
  it("uses the birth-date seasonal offset, not today's offset", () => {
    expect(inspectBirthMoment("2000-07-01", "12:00", "Europe/London").utc).toBe("2000-07-01T11:00:00.000Z");
    expect(inspectBirthMoment("2000-01-01", "12:00", "Europe/London").utc).toBe("2000-01-01T12:00:00.000Z");
  });
});
