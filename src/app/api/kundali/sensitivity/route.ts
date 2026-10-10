import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { birthInputSchema } from "@/lib/birthSchema";
import { birthSensitivity } from "@/lib/astrology/birthSensitivity";
import { checkRateLimit } from "@/lib/rateLimit";
const schema = z.object({ birth: birthInputSchema, window: z.union([z.literal(0), z.literal(5), z.literal(15), z.literal(30)]) });
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const limit = checkRateLimit(`sensitivity:${ip}`, 20, 600000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid birth details or uncertainty window." }, { status: 400 });
  try { return NextResponse.json(birthSensitivity(parsed.data.birth, parsed.data.window)); }
  catch (err) { return NextResponse.json({ error: err instanceof Error ? err.message : "Could not compare times." }, { status: 400 }); }
}
