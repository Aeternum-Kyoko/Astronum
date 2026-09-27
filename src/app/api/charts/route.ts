import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { birthInputSchema } from "@/lib/birthSchema";
import { getCurrentUser } from "@/lib/currentUser";

const MAX_CHARTS_PER_USER = 50;

const chartFields = {
  id: true,
  name: true,
  date: true,
  time: true,
  place: true,
  latitude: true,
  longitude: true,
  timezone: true,
  createdAt: true,
} as const;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const charts = await prisma.savedChart.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: chartFields,
  });
  return NextResponse.json({ charts });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in to save charts." }, { status: 401 });

  const parsed = birthInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const birth = parsed.data;

  // Saving the same birth details twice is a no-op rather than a duplicate.
  const existing = await prisma.savedChart.findFirst({
    where: { userId: user.id, name: birth.name, date: birth.date, time: birth.time, latitude: birth.latitude, longitude: birth.longitude },
    select: chartFields,
  });
  if (existing) return NextResponse.json({ chart: existing, alreadySaved: true });

  if ((await prisma.savedChart.count({ where: { userId: user.id } })) >= MAX_CHARTS_PER_USER) {
    return NextResponse.json({ error: `You can save up to ${MAX_CHARTS_PER_USER} charts. Delete one to make room.` }, { status: 409 });
  }

  const chart = await prisma.savedChart.create({ data: { ...birth, userId: user.id }, select: chartFields });
  return NextResponse.json({ chart }, { status: 201 });
}
