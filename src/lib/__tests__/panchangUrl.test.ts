import { describe, it, expect } from "vitest";
import { DEFAULT_PANCHANG_LOCATION, panchangHref, parsePanchangParams } from "../panchangUrl";

describe("parsePanchangParams", () => {
  it("round-trips a location and date through the URL", () => {
    const loc = { place: "Jaipur, India", latitude: 26.9124, longitude: 75.7873, timezone: "Asia/Kolkata" };
    const q = new URL(panchangHref("2024-03-08", loc), "http://x").searchParams;
    expect(parsePanchangParams(Object.fromEntries(q))).toEqual({ date: "2024-03-08", location: loc });
  });

  it("falls back to New Delhi and today there when params are missing or bad", () => {
    // 20:00 UTC on 1 Jan is already 2 Jan in India.
    const now = new Date("2024-01-01T20:00:00Z");
    expect(parsePanchangParams({}, now)).toEqual({ date: "2024-01-02", location: DEFAULT_PANCHANG_LOCATION });
    expect(parsePanchangParams({ date: "2024-02-31", tz: "Mars/Olympus", lat: "1", lon: "2", place: "x" }, now)).toEqual({
      date: "2024-01-02",
      location: DEFAULT_PANCHANG_LOCATION,
    });
  });
});
