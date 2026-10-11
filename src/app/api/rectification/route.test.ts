import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { POST } from "./route";

const birth = {
  name: "Test person", date: "1990-04-12", time: "06:45", latitude: 26.9124,
  longitude: 75.7873, timezone: "Asia/Kolkata", place: "Jaipur",
};

function request(body: unknown, id: string) {
  return new NextRequest("http://localhost/api/rectification", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `rectification-test-${id}` },
    body: JSON.stringify(body),
  });
}

describe("POST /api/rectification", () => {
  it("returns chart candidates, ranked runs, and evidence quality for valid events", async () => {
    const response = await POST(request({
      birth, window: 15,
      events: [
        { kind: "career", date: "2012-07-02", precision: "day", confidence: "high", importance: 4 },
        { kind: "marriage", date: "2016-11", precision: "month", confidence: "medium", importance: 4 },
        { kind: "child", date: "2019", precision: "year", confidence: "high", importance: 5 },
      ],
    }, "valid"));
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.strip).toHaveLength(31);
    expect(result.runs[0].best.score).toBe(result.maxScore);
    expect(["low", "moderate", "strong"]).toContain(result.confidence);
    expect(result.confidenceReason).toEqual(expect.any(String));
    expect(result.runs[0].best.events[0]).toMatchObject({ rawPoints: expect.any(Number), evidenceWeight: expect.any(Number) });
  });

  it("rejects events that could be before the birth date at their stated precision", async () => {
    for (const [id, event] of [
      ["day", { kind: "career", date: "1990-04-12", precision: "day" }],
      ["month", { kind: "career", date: "1990-04", precision: "month" }],
      ["year", { kind: "career", date: "1990", precision: "year" }],
    ] as const) {
      const response = await POST(request({ birth, window: 15, events: [event] }, id));
      expect(response.status).toBe(400);
    }
  });
  it("reviews journal links at the entered time without searching candidates", async () => {
    const response = await POST(request({birth,window:0,events:[{kind:"career",date:"2012-07-02"}]},"journal"));
    const result=await response.json();expect(response.status).toBe(200);expect(result.strip).toHaveLength(1);expect(result.runs[0].best.time).toBe(birth.time);expect(result.confidence).toBe("low");
  });

});

describe("reserved-event API checks", () => {
  it("keeps reserved-event points out of returned fitting scores", async () => {
    const response = await POST(request({ birth, window: 15, events: [
      { kind: "career", date: "2012-07-02" }, { kind: "marriage", date: "2016-11-20" },
      { kind: "child", date: "2019-03-14" }, { kind: "property", date: "2020-04-04", useFor: "validation" },
    ] }, "holdout"));
    const result = await response.json(); expect(response.status).toBe(200);
    expect(result.validation).toMatchObject({ fitEventCount: 3, heldOutEventCount: 1 });
    expect(result.validation.leaveOneOut).toHaveLength(3);
    for (const run of result.runs) expect(run.best.score).toBe(run.best.events.filter((e: {useFor: string}) => e.useFor !== "validation").reduce((sum: number, e: {points: number}) => sum + e.points, 0));
  });
  it("rejects unsupported event roles and all-reserved requests", async () => {
    expect((await POST(request({ birth, window: 15, events: [{kind:"career",date:"2012-07-02",useFor:"unknown"}] }, "bad-role"))).status).toBe(400);
    expect((await POST(request({ birth, window: 15, events: [{kind:"career",date:"2012-07-02",useFor:"validation"}] }, "all-reserved"))).status).toBe(400);
  });
});
