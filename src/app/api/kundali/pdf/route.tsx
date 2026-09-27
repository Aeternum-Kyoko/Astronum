import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import KundaliPdf from "@/lib/pdf/KundaliPdf";
import { calculateKundali } from "@/lib/astrology/kundali";
import { buildReport } from "@/lib/astrology/report";
import { computeRemedies } from "@/lib/astrology/remedies";
import { fromBirthQuery } from "@/lib/birthParams";
import type { KundaliChart } from "@/lib/astrology/types";

function reportDocument(chart: KundaliChart) {
  return <KundaliPdf chart={chart} report={buildReport(chart)} remedies={computeRemedies(chart)} />;
}

/** GET /api/kundali/pdf?name=…&date=…&time=…&place=…&lat=…&lon=…&tz=… → a downloadable PDF report. */
export async function GET(req: NextRequest) {
  const birth = fromBirthQuery(req.nextUrl.searchParams);
  if (!birth) return NextResponse.json({ error: "Missing or invalid birth details" }, { status: 400 });

  try {
    const chart = calculateKundali(birth);
    const pdf = await renderToBuffer(reportDocument(chart));
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
