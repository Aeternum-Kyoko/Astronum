import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { askPrashna, PRASHNA_TOPICS, type PrashnaTopic } from "@/lib/astrology/prashna";

const schema = z.object({
  topic: z.enum(Object.keys(PRASHNA_TOPICS) as [PrashnaTopic, ...PrashnaTopic[]]),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().min(1),
  place: z.string().trim().max(200),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  const { topic, ...place } = parsed.data;
  try {
    return NextResponse.json(askPrashna(topic, place));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not cast the Prashna chart" }, { status: 400 });
  }
}
