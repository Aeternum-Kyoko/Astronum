import { NextRequest, NextResponse } from "next/server";
import { calculateKundali } from "@/lib/astrology/kundali";
import { buildReport } from "@/lib/astrology/report";
import { birthInputSchema } from "@/lib/birthSchema";

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = birthInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  try {
    const chart = calculateKundali(parsed.data);
    return NextResponse.json({ chart, report: buildReport(chart) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not calculate chart" },
      { status: 400 }
    );
  }
}
