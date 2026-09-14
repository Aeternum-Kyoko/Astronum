import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculateKundali } from "@/lib/astrology/kundali";

const bodySchema = z.object({
  name: z.string().trim().min(1, "Please enter a name.").max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().min(1),
  place: z.string().trim().max(200),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  try {
    const chart = calculateKundali(parsed.data);
    return NextResponse.json({ chart });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not calculate chart" },
      { status: 400 }
    );
  }
}
