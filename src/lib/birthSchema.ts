import { z } from "zod";

/** Request-body shape for one person's birth details, shared by the chart and matching APIs. */
export const birthInputSchema = z.object({
  name: z.string().trim().min(1, "Please enter a name.").max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().min(1),
  place: z.string().trim().max(200),
});
