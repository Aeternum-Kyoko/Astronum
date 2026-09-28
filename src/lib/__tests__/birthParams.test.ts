import { describe, it, expect } from "vitest";
import { fromBirthQuery, toBirthQuery, type BirthParams } from "../birthParams";

const sample: BirthParams = {
  name: "Asha Sharma",
  date: "1990-04-12",
  time: "06:45",
  place: "Jaipur, Rajasthan, India",
  latitude: 26.9124,
  longitude: 75.7873,
  timezone: "Asia/Kolkata",
};

describe("birth query params", () => {
  it("round-trips birth details through the query string", () => {
    expect(fromBirthQuery(new URLSearchParams(toBirthQuery(sample)))).toEqual(sample);
  });

  it("rejects incomplete or malformed queries", () => {
    const q = new URLSearchParams(toBirthQuery(sample));
    q.delete("lat");
    expect(fromBirthQuery(q)).toBeNull();

    const bad = new URLSearchParams(toBirthQuery(sample));
    bad.set("time", "6:45pm");
    expect(fromBirthQuery(bad)).toBeNull();

    const outOfRange = new URLSearchParams(toBirthQuery(sample));
    outOfRange.set("lat", "123");
    expect(fromBirthQuery(outOfRange)).toBeNull();
  });

  it("namespaces keys with a prefix so two people share one URL", () => {
    const other = { ...sample, name: "Ravi Mehta", date: "1988-11-02" };
    const q = new URLSearchParams(`${toBirthQuery(sample, "b")}&${toBirthQuery(other, "g")}`);
    expect(q.get("bname")).toBe("Asha Sharma");
    expect(fromBirthQuery(q, "b")).toEqual(sample);
    expect(fromBirthQuery(q, "g")).toEqual(other);
    expect(fromBirthQuery(q)).toBeNull();
  });
});
