import { NextRequest, NextResponse } from "next/server";
import { calculateKundali } from "@/lib/astrology/kundali";
import { buildCoreReport } from "@/lib/astrology/report";
import { birthInputSchema } from "@/lib/birthSchema";
import type { Locale } from "@/lib/i18n/locale";

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = birthInputSchema.safeParse(json);
  const locale: Locale = json?.locale === "hi" ? "hi" : "en";
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  try {
    const chart = calculateKundali(parsed.data, locale);
    // Heavy sections (timeline, KP…) load per tab from /api/kundali/sections, so the chart appears fast.
    return NextResponse.json({ chart, report: buildCoreReport(chart, new Date(), locale) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not calculate chart" },
      { status: 400 }
    );
  }
}
