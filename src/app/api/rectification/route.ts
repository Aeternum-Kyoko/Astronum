import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { birthInputSchema } from "@/lib/birthSchema";
import { checkRateLimit } from "@/lib/rateLimit";
import { EVENT_CONFIDENCES, EVENT_KEYS, EVENT_PRECISIONS, rectify, type EventKind } from "@/lib/astrology/rectification";

const schema = z.object({
  birth: birthInputSchema,
  window: z.union([z.literal(0), z.literal(15), z.literal(30), z.literal(60), z.literal(120)]),
  events: z
    .array(z.object({
      kind: z.enum(EVENT_KEYS as [EventKind, ...EventKind[]]),
      date: z.string(),
      precision: z.enum(EVENT_PRECISIONS).default("day"),
      confidence: z.enum(EVENT_CONFIDENCES).default("high"),
      useFor: z.enum(["fit", "validation"]).default("fit"),
      importance: z.number().int().min(1).max(5).default(3),
    }).superRefine((event, context) => {
      const pattern = event.precision === "day" ? /^\d{4}-\d{2}-\d{2}$/ : event.precision === "month" ? /^\d{4}-\d{2}$/ : /^\d{4}$/;
      if (!pattern.test(event.date)) context.addIssue({ code: "custom", message: `Enter a valid ${event.precision}.` });
    }))
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
  const birthMonth = birth.date.slice(0, 7);
  const invalidChronology = events.some((event) => {
    if (event.precision === "day") return event.date <= birth.date;
    if (event.precision === "month") return event.date <= birthMonth;
    return event.date <= birth.date.slice(0, 4);
  });
  if (invalidChronology) return NextResponse.json({ error: "Every event must be after the birth date; month- and year-only events must be in a later month or year." }, { status: 400 });

  try {
    const result = rectify(birth, window, events);
    // The full minute-by-minute list is only needed for the score strip; send its scores, and details for the top runs.
    return NextResponse.json({
      runs: result.runs.slice(0, 8),
      strip: result.candidates.map((c) => ({ time: c.time, score: c.score, lagna: c.lagna })),
      boundaries: result.boundaries,
      maxScore: result.maxScore,
      confidence: result.confidence,
      confidenceReason: result.confidenceReason,
      warnings: result.warnings,
      leadingCandidateCount: result.leadingCandidateCount,
      scoreMargin: result.scoreMargin,
      validation: result.validation,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not rectify" }, { status: 400 });
  }
}
