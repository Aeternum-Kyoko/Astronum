import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import KundaliPdf from "@/lib/pdf/KundaliPdf";
import { calculateKundali } from "@/lib/astrology/kundali";
import { buildReport } from "@/lib/astrology/report";
import { computeRemedies } from "@/lib/astrology/remedies";
import { fromBirthQuery } from "@/lib/birthParams";
import type { KundaliChart } from "@/lib/astrology/types";
import { DateTime } from "luxon";

function reportDocument(chart: KundaliChart, at: Date) {
  return <KundaliPdf chart={chart} report={buildReport(chart, at)} remedies={computeRemedies(chart)} />;
}

/** GET /api/kundali/pdf?name=…&date=…&time=…&place=…&lat=…&lon=…&tz=… → a downloadable PDF report. */
export async function GET(req: NextRequest) {
  const birth = fromBirthQuery(req.nextUrl.searchParams);
  if (!birth) return NextResponse.json({ error: "Missing or invalid birth details" }, { status: 400 });
  const selectedDate = req.nextUrl.searchParams.get("analysisDate");
  const selectedTime = req.nextUrl.searchParams.get("analysisTime") ?? "12:00";
  const selected = selectedDate ? DateTime.fromISO(`${selectedDate}T${selectedTime}`, { zone: birth.timezone }) : null;
  if (selectedDate && (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate) || !/^\d{2}:\d{2}$/.test(selectedTime) || !selected?.isValid))
    return NextResponse.json({ error: "Invalid analysis date or time" }, { status: 400 });

  try {
    const chart = calculateKundali(birth);
    const pdf = await renderToBuffer(reportDocument(chart, selected?.toJSDate() ?? new Date()));
    const filename = `kundli-${birth.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "report"}.pdf`;
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not generate the PDF" }, { status: 500 });
  }
}
