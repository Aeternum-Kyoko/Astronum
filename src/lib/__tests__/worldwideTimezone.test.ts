import { describe, expect, it } from "vitest";
import { find } from "geo-tz/all";
import { inspectBirthMoment } from "../birthMoment";
describe("worldwide birthplace timezone coverage",()=>{
 it.each([
  [40.7128,-74.006,"America/New_York"],
  [-33.8688,151.2093,"Australia/Sydney"],
  [35.6762,139.6503,"Asia/Tokyo"],
  [-1.2921,36.8219,"Africa/Nairobi"],
  [-36.8509,174.7645,"Pacific/Auckland"],
 ] as const)("resolves %s, %s using the full zone dataset",(lat,lon,zone)=>expect(find(lat,lon)).toContain(zone));
 it("handles the southern hemisphere seasonal offset at the birth date",()=>{
  expect(inspectBirthMoment("2000-01-01","12:00","Australia/Sydney").utc).toBe("2000-01-01T01:00:00.000Z");
  expect(inspectBirthMoment("2000-07-01","12:00","Australia/Sydney").utc).toBe("2000-07-01T02:00:00.000Z");
 });
});
