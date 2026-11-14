import { describe, expect, it } from "vitest";
import { calculateKundali } from "../astrology/kundali";
import { kundliSectionStats } from "../kundliSectionStats";
import { birthInputSchema } from "../birthSchema";
import { fromBirthQuery, toBirthQuery } from "../birthParams";
const input={name:"Test",date:"1990-04-12",time:"06:45",latitude:26.9154576,longitude:75.8189817,timezone:"Asia/Kolkata",place:"Jaipur",timeAccuracy:"approximate" as const};
const chart=calculateKundali(input);
const at=new Date("2026-11-14T06:30:00Z");
describe("Kundli studio evidence and input fidelity",()=>{
 it("preserves supplied coordinates and time reliability in shared links",()=>{
  expect(fromBirthQuery(new URLSearchParams(toBirthQuery(input)))).toEqual(input);
 });
 it("validates birth-time ambiguity at the API schema boundary",()=>{
  expect(birthInputSchema.safeParse({...input,date:"2024-11-03",time:"01:30",timezone:"America/New_York"}).success).toBe(false);
  expect(birthInputSchema.safeParse({...input,date:"2024-11-03",time:"01:30",timezone:"UTC-04:00"}).success).toBe(true);
 });
 it("keeps D9 metrics in the selected division and labels their scope",()=>{
  const result=kundliSectionStats(chart,"More Vargas",at,"D9");
  expect(result.stats.find(s=>s.label==="Ascendant")?.value).toBe(chart.divisionalCharts.D9.ascendant.sign);
  expect(result.precision).toContain("Natal degrees and Shadbala belong to D1");
 });
 it("excludes nodes from classical strength metrics and discloses approximations",()=>{
  const result=kundliSectionStats(chart,"Shadbala",at);
  expect(result.stats.find(s=>s.label==="Classical planets")?.value).toBe("7");
  expect(result.precision).toContain("partial Shadbala");
 });
 it("reports actual Ashtakavarga totals instead of invented scores",()=>{
  expect(kundliSectionStats(chart,"Ashtakavarga",at).stats.find(s=>s.label==="Sarva total")?.value).toBe(String(chart.ashtakavarga.sarva.reduce((a,b)=>a+b,0)));
 });
});
