import { z } from "zod";
import type { BirthInput } from "./astrology/types";
import { toBirthQuery } from "./birthParams";

export const observationSchema = z.object({
  id: z.string().min(1),
  date: z.iso.date(),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  topic: z.enum(["general", "career", "relationships", "wealth", "health"]),
  note: z.string().trim().min(1).max(500),
  period: z.string().max(100),
  sky: z.array(z.string().max(80)).max(3),
});

export const observationsSchema = z.array(observationSchema).max(30);
export type ReadingObservation = z.infer<typeof observationSchema>;
export const observationsKey = (birth: BirthInput) => `astronum-observations:${toBirthQuery(birth)}`;
