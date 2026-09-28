import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculateKundali } from "@/lib/astrology/kundali";
import { buildSections, HEAVY_SECTIONS, type HeavySection } from "@/lib/astrology/report";
import { birthInputSchema } from "@/lib/birthSchema";

const schema = z.object({
  birth: birthInputSchema,
  sections: z.array(z.enum(HEAVY_SECTIONS as unknown as [HeavySection, ...HeavySection[]])).min(1).max(HEAVY_SECTIONS.length),
});

/** Computes only the report sections a tab needs. */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  try {
    const chart = calculateKundali(parsed.data.birth);
    return NextResponse.json({ sections: buildSections(chart, parsed.data.sections) });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not calculate" }, { status: 400 });
  }
}
