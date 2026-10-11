import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { birthInputSchema } from "@/lib/birthSchema";
import { calculateKundali } from "@/lib/astrology/kundali";
import { annualReading } from "@/lib/astrology/annualReading";
import { checkRateLimit } from "@/lib/rateLimit";

const schema = z.object({ birth: birthInputSchema, year: z.number().int().min(1900).max(2100), at: z.iso.datetime({ offset: true }).optional() });
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!checkRateLimit(`annual:${ip}`, 30, 10 * 60 * 1000).allowed) return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter valid birth details, annual year and optional reading date." }, { status: 400 });
  try {
    const { birth, year, at } = parsed.data;
    return NextResponse.json(annualReading(calculateKundali(birth), year, at ? new Date(at) : undefined));
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not calculate annual reading." }, { status: 400 }); }
}
