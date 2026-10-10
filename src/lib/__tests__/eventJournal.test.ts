import {describe,it,expect} from "vitest";
import {journalSchema} from "../eventJournal";
const event={id:"test",kind:"career",date:"2012-07-02",precision:"day",confidence:"high",importance:4,note:"Documented milestone"};
describe("device journal validation",()=>{
 it("rejects malformed storage values",()=>{expect(journalSchema.safeParse(null).success).toBe(false);expect(journalSchema.safeParse([{...event,kind:"other"}]).success).toBe(false);});
 it("rejects impossible dates and mismatched precision",()=>{expect(journalSchema.safeParse([{...event,date:"2012-02-30"}]).success).toBe(false);expect(journalSchema.safeParse([{...event,precision:"month"}]).success).toBe(false);});
 it("accepts documented intervals and limits event count",()=>{expect(journalSchema.safeParse([{...event,date:"2012-07",precision:"month"},{...event,date:"2013",precision:"year"}]).success).toBe(true);expect(journalSchema.safeParse(Array.from({length:13},()=>event)).success).toBe(false);});
});
