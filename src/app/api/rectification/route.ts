import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { birthInputSchema } from "@/lib/birthSchema";
import { checkRateLimit } from "@/lib/rateLimit";
import { EVENT_KEYS, rectify, type EventKind } from "@/lib/astrology/rectification";

const schema = z.object({
  birth: birthInputSchema,
  window: z.union([z.literal(15), z.literal(30), z.literal(60), z.literal(120)]),
  events: z
    .array(z.object({ kind: z.enum(EVENT_KEYS as [EventKind, ...EventKind[]]), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
    .min(1, "Add at least one life event.")
    .max(12),
});

export async function POST(req: NextRequest) {
  // Each request casts up to 241 charts, so keep it to a sensible pace per visitor.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const limit = checkRateLimit(`rectify:${ip}`, 20, 10 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: `Too many attempts. Try again in ${Math.ceil(limit.retryAfterSec / 60)} minutes.` }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  const { birth, window, events } = parsed.data;
  if (events.some((e) => e.date <= birth.date)) return NextResponse.json({ error: "Every event must be after the date of birth." }, { status: 400 });

  try {
    const result = rectify(birth, window, events);
    // The full minute-by-minute list is only needed for the score strip; send its scores, and details for the top runs.
    return NextResponse.json({
      runs: result.runs.slice(0, 8),
      strip: result.candidates.map((c) => ({ time: c.time, score: c.score, lagna: c.lagna })),
      boundaries: result.boundaries,
      maxScore: result.maxScore,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not rectify" }, { status: 400 });
  }
}
