import { z } from "zod";
import { DateTime } from "luxon";
import { EVENT_KEYS, EVENT_PRECISIONS, EVENT_CONFIDENCES, type EventKind } from "./astrology/rectificationEvents";
import type { BirthInput } from "./astrology/types";
import { toBirthQuery } from "./birthParams";
export const journalKey = (birth: BirthInput) => `astronum-journal:${toBirthQuery(birth)}`;
export const journalEventSchema = z.object({
 id: z.string().min(1), kind: z.enum(EVENT_KEYS as [EventKind,...EventKind[]]), date: z.string(),
 precision: z.enum(EVENT_PRECISIONS), confidence: z.enum(EVENT_CONFIDENCES), importance: z.number().int().min(1).max(5), note: z.string().max(500),
}).superRefine((event,ctx)=>{
 const pattern=event.precision==="day"?/^\d{4}-\d{2}-\d{2}$/:event.precision==="month"?/^\d{4}-\d{2}$/:/^\d{4}$/;
 const full=event.date+(event.precision==="month"?"-01":event.precision==="year"?"-01-01":"");
 if(!pattern.test(event.date)||!DateTime.fromISO(full).isValid) ctx.addIssue({code:"custom",message:"Enter a valid date for the selected precision."});
});
export const journalSchema=z.array(journalEventSchema).max(12);
export type JournalEvent=z.infer<typeof journalEventSchema>;
export function readJournal(birth:BirthInput):JournalEvent[]{
 try { const parsed=journalSchema.safeParse(JSON.parse(localStorage.getItem(journalKey(birth))??"[]"));return parsed.success?parsed.data:[]; } catch { return []; }
}
