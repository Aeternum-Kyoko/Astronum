import { describe, expect, it } from "vitest";
import { calculateKundali } from "../kundali";
import { topicReading } from "../topicReading";
import { synthesizeTopic } from "../interpretation/topicSynthesis";
import { readingEvidence } from "../readingEvidence";
import { periodsAt } from "../dashaTree";
import { buildCoreReport } from "../report";

const input = { name: "Test", date: "1990-04-12", time: "06:45", latitude: 26.9124, longitude: 75.7873, timezone: "Asia/Kolkata", place: "Jaipur" };
const chart = calculateKundali(input);
const at = new Date("2026-10-12T06:30:00Z");

describe("shared topic synthesis", () => {
  it("keeps a mixed career conclusion tied to primary evidence and a named timing relation", () => {
    const reading = topicReading(chart, "career", at);
    const result = reading.synthesis;
    expect(result.balance).toBe("mixed");
    expect(result.support?.role).toBe("primary");
    expect(result.counterpoint?.role).toBe("primary");
    expect(result.support?.dependencyGroup).toBe(result.counterpoint?.dependencyGroup);
    expect(result.conclusion).toContain("Saturn");
    expect(result.timing.evidenceId).toMatch(/^\d+:dasha$/);
    expect(result.timing.relation).toMatch(/^(lord|occupant|aspect):house-\d+$/);
    expect(result.timing.text).not.toMatch(/promotion|probability|guarantee/i);
  });

  it("does not change its result when evidence order changes or items repeat", () => {
    const evidence = readingEvidence(chart, [10, 6, 2, 11], ["D10"], at, null);
    const running = periodsAt(chart.dashas, at, 3);
    const first = synthesizeTopic(chart, "career", [10, 6, 2, 11], evidence, running, at);
    const reordered = [...evidence].reverse().map(group => ({ ...group, items: [...group.items].reverse().concat(group.items) }));
    const second = synthesizeTopic(chart, "career", [10, 6, 2, 11], reordered, running, at);
    expect(second).toEqual(first);
  });

  it("does not turn a different person's name into a different reading", () => {
    const renamed = calculateKundali({ ...input, name: "Someone else" });
    expect(topicReading(renamed, "career", at).synthesis).toEqual(topicReading(chart, "career", at).synthesis);
  });

  it("keeps conclusion and evidence ids stable across languages", () => {
    const en = topicReading(chart, "relationships", at, "en").synthesis;
    const hi = topicReading(chart, "relationships", at, "hi").synthesis;
    expect(hi.evidenceIds).toEqual(en.evidenceIds);
    expect(hi.balance).toBe(en.balance);
    expect(hi.conclusion).not.toBe(en.conclusion);
  });

  it("uses the same conclusion in the core report and the interactive reading", () => {
    const report = buildCoreReport(chart, at);
    const mapped = { career: "career", marriage: "relationships", wealth: "wealth", education: "education", home: "property" } as const;
    for (const [chapter, topic] of Object.entries(mapped)) {
      const area = report.lifeAreas.find(item => item.key === chapter);
      const reading = topicReading(chart, topic, at);
      expect(area?.summary).toBe(reading.synthesis.conclusion);
      expect(area?.synthesis?.evidenceIds).toEqual(reading.synthesis.evidenceIds);
    }
  });
});
