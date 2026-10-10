import { DateTime } from "luxon";
import { calculateKundali } from "./kundali";
import { VARGA_KEYS } from "./constants";
import type { BirthInput, KundaliChart } from "./types";

export function chartAtOffset(birth: BirthInput, minutes: number): KundaliChart {
  const base = DateTime.fromISO(`${birth.date}T${birth.time}`, { zone: birth.timezone });
  if (!base.isValid || !Number.isInteger(minutes) || Math.abs(minutes) > 120) throw new Error("Invalid birth time or minute offset.");
  const at = base.plus({ minutes });
  return calculateKundali({ ...birth, date: at.toISODate()!, time: at.toFormat(birth.time.length > 5 ? "HH:mm:ss" : "HH:mm") });
}

/** Minute-grid sensitivity, not a guarantee about all instants between samples. */
export function birthSensitivity(birth: BirthInput, window: number) {
  if (![0, 5, 15, 30].includes(window)) throw new Error("Choose 0, 5, 15 or 30 minutes.");
  const charts = Array.from({ length: window * 2 + 1 }, (_, i) => chartAtOffset(birth, i - window));
  const distinct = (values: (string | number)[]) => [...new Set(values)];
  const fields = [
    { key: "lagna", values: distinct(charts.map((c) => c.ascendant.sign)) },
    { key: "moonNakshatra", values: distinct(charts.map((c) => `${c.planets.find((p) => p.planet === "Moon")!.nakshatra} / ${c.planets.find((p) => p.planet === "Moon")!.pada}`)) },
    ...VARGA_KEYS.filter((key) => key !== "D1").map((key) => ({ key: `${key} ascendant`, values: distinct(charts.map((c) => c.divisionalCharts[key].ascendant.sign)) })),
    ...charts[0].planets.map((p) => ({ key: `${p.planet} D1 house`, values: distinct(charts.map((c) => c.planets.find((v) => v.planet === p.planet)!.house)) })),
    ...charts[0].planets.map((p) => ({ key: `${p.planet} Chalit`, values: distinct(charts.map((c) => c.chalitHouses.find((v) => v.planet === p.planet)!.house)) })),
    ...VARGA_KEYS.filter((key) => key !== "D1").flatMap((key) => charts[0].planets.map((p) => ({ key: `${key} ${p.planet} sign`, values: distinct(charts.map((c) => c.divisionalCharts[key].planets.find((v) => v.planet === p.planet)!.sign)) }))),
  ];
  return {
    window, sampleCount: charts.length, fields: fields.map((field) => ({ ...field, stable: field.values.length === 1 })),
    samples: charts.map((chart, i) => ({ offset: i - window, date: chart.input.date, time: chart.input.time, lagna: chart.ascendant.sign, navamsa: chart.divisionalCharts.D9.ascendant.sign })),
    dashaBalanceEndRange: { from: new Date(Math.min(...charts.map((c) => new Date(c.dashas[0].end).getTime()))).toISOString(), to: new Date(Math.max(...charts.map((c) => new Date(c.dashas[0].end).getTime()))).toISOString() },
  };
}
export type BirthSensitivity = ReturnType<typeof birthSensitivity>;
