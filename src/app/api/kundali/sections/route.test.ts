import { describe, expect, it, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({
  calculate: vi.fn(() => ({ id: "chart" })),
  build: vi.fn(() => ({ monthly: { months: [] } })),
}));
vi.mock("@/lib/astrology/kundali", () => ({
  calculateKundali: mocks.calculate,
}));
vi.mock("@/lib/astrology/report", () => ({
  HEAVY_SECTIONS: ["monthly", "timeline", "houses"],
  buildSections: mocks.build,
}));
import { POST } from "./route";
const birth = {
  name: "Test",
  date: "1990-04-12",
  time: "06:45",
  latitude: 28.6139,
  longitude: 77.209,
  timezone: "Asia/Kolkata",
  place: "New Delhi",
};
const request = (body: unknown) =>
  new NextRequest("http://localhost/api/kundali/sections", {
    method: "POST",
    body: JSON.stringify(body),
  });
afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});
describe("on-demand calculation snapshots", () => {
  it("uses the requested instant rather than the server's current month", async () => {
    const at = "2032-02-01T12:00:00+05:30";
    const res = await POST(request({ birth, sections: ["monthly"], at }));
    expect(res.status).toBe(200);
    expect(mocks.build).toHaveBeenCalledWith(
      { id: "chart" },
      ["monthly"],
      new Date(at),
      "en",
    );
  });
  it("retains current-time behavior when no snapshot is requested", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-24T06:30:00Z"));
    expect((await POST(request({ birth, sections: ["monthly"] }))).status).toBe(
      200,
    );
    expect(mocks.build).toHaveBeenCalledWith(
      { id: "chart" },
      ["monthly"],
      new Date("2026-10-24T06:30:00Z"),
      "en",
    );
  });
  it.each(["not-a-date", "2032-02-01", "2032-13-01T00:00:00Z"])(
    "rejects an invalid snapshot: %s",
    async (at) => {
      expect(
        (await POST(request({ birth, sections: ["monthly"], at }))).status,
      ).toBe(400);
      expect(mocks.calculate).not.toHaveBeenCalled();
    },
  );
  it("rejects unsupported tool names before doing calculation work", async () => {
    expect((await POST(request({ birth, sections: ["made-up"] }))).status).toBe(
      400,
    );
    expect(mocks.calculate).not.toHaveBeenCalled();
  });
});
