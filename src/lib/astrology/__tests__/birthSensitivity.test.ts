import {describe,it,expect} from "vitest";
import {birthSensitivity,chartAtOffset} from "../birthSensitivity";
const birth={name:"Test",date:"1990-04-12",time:"00:02",latitude:26.9124,longitude:75.7873,timezone:"Asia/Kolkata",place:"Jaipur"};
describe("birth precision",()=>{
 it("handles midnight and retains seconds without altering the original birth",()=>{const chart=chartAtOffset({...birth,time:"00:02:45"},-5);expect(chart.input.date).toBe("1990-04-11");expect(chart.input.time).toBe("23:57:45");expect(birth.date).toBe("1990-04-12");});
 it("reports exact-time selections as one sample, not interval validation",()=>{const r=birthSensitivity(birth,0);expect(r.sampleCount).toBe(1);expect(r.fields.every(f=>f.stable)).toBe(true);});
 it("samples the entire selected minute window with unique field keys",()=>{const r=birthSensitivity(birth,5);expect(r.sampleCount).toBe(11);expect(r.samples[0]).toMatchObject({date:"1990-04-11",time:"23:57",offset:-5});expect(r.samples.at(-1)?.offset).toBe(5);expect(new Set(r.fields.map(f=>f.key)).size).toBe(r.fields.length);expect(r.fields.some(f=>f.key==="D9 ascendant")).toBe(true);expect(+new Date(r.dashaBalanceEndRange.to)).toBeGreaterThanOrEqual(+new Date(r.dashaBalanceEndRange.from));});
 it("rejects unbounded or fractional input",()=>{expect(()=>birthSensitivity(birth,120)).toThrow();expect(()=>chartAtOffset(birth,.5)).toThrow();});
});
