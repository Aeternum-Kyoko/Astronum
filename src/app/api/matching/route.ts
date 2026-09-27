import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculateKundali } from "@/lib/astrology/kundali";
import { compareManglik, computeGunaMilan, type CompatibilityResponse, type MatchPartner, type MatchResponse } from "@/lib/astrology/matching";
import { birthInputSchema } from "@/lib/birthSchema";
import { computeCompatibility } from "@/lib/astrology/compatibility";
import type { KundaliChart } from "@/lib/astrology/types";

// "boy"/"girl" are the classical Guna Milan roles; other relationship types treat them as first and second person.
const bodySchema = z.object({
  boy: birthInputSchema,
  girl: birthInputSchema,
  type: z.enum(["marriage", "romance", "business", "friendship"]).default("marriage"),
});

function partner(chart: KundaliChart): MatchPartner {
  const moon = chart.planets.find((p) => p.planet === "Moon")!;
  return {
    name: chart.input.name,
    date: chart.input.date,
    time: chart.input.time,
    place: chart.input.place,
    ascendant: chart.ascendant.sign,
    moonSign: moon.sign,
    nakshatra: moon.nakshatra,
    pada: moon.pada,
    mangalDosha: chart.mangalDosha,
  };
}

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const who = issue?.path[0] === "girl" ? "Second person" : "First person";
    return NextResponse.json({ error: issue ? `${who}: ${issue.message}` : "Invalid input" }, { status: 400 });
  }

  try {
    const boy = calculateKundali(parsed.data.boy);
    const girl = calculateKundali(parsed.data.girl);
    if (parsed.data.type !== "marriage") {
      const body: CompatibilityResponse = {
        type: parsed.data.type,
        a: partner(boy),
        b: partner(girl),
        compatibility: computeCompatibility(parsed.data.type, boy, girl),
      };
      return NextResponse.json(body);
    }
    const boyMoon = boy.planets.find((p) => p.planet === "Moon")!;
    const girlMoon = girl.planets.find((p) => p.planet === "Moon")!;
    const body: MatchResponse = {
      boy: partner(boy),
      girl: partner(girl),
      match: computeGunaMilan(boyMoon, girlMoon),
      manglik: compareManglik(boy.mangalDosha, girl.mangalDosha),
    };
    return NextResponse.json(body);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not calculate the match" },
      { status: 400 }
    );
  }
}
