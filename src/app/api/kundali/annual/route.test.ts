import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("@/lib/rateLimit", () => ({ checkRateLimit: vi.fn(() => ({ allowed: true })) }));
import { checkRateLimit } from "@/lib/rateLimit";
import { POST } from "./route";
const birth = { name: "Test", date: "1990-04-12", time: "06:45:32", latitude: 26.9124, longitude: 75.7873, timezone: "Asia/Kolkata", place: "Jaipur" };
const request = (body: unknown) => new NextRequest("http://localhost/api/kundali/annual", { method: "POST", body: JSON.stringify(body) });
describe("annual API", () => {
  it("returns serializable natal/annual evidence with seconds", async () => {
    const res = await POST(request({ birth, year: 2026 })); expect(res.status).toBe(200);
    const data = await res.json(); expect(data.areas).toHaveLength(5); expect(data.annual.chart.input.time).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    expect(typeof data.annual.returnMoment).toBe("string");
  });
  it.each([1989, 2101, 2026.5, "2026"])("rejects invalid annual year %s", async year => { expect((await POST(request({ birth, year }))).status).toBe(400); });
  it("rejects invalid and out-of-interval snapshots", async () => {
    expect((await POST(request({ birth, year: 2026, at: "bad" }))).status).toBe(400);
    expect((await POST(request({ birth, year: 2026, at: "2026-01-01T00:00:00Z" }))).status).toBe(400);
  });
  it("rate limits calculation requests", async () => {
    vi.mocked(checkRateLimit).mockReturnValueOnce({ allowed: false, retryAfterSec: 60 });
    expect((await POST(request({ birth, year: 2026 }))).status).toBe(429);
  });
});
