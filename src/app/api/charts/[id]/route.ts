import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { z } from "zod";
import { RELATIONS } from "@/lib/relations";

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/charts/[id]">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const { id } = await ctx.params;

  // Scoped to the owner, so one user can never delete another's chart.
  const { count } = await prisma.savedChart.deleteMany({ where: { id, userId: user.id } });
  if (count === 0) return NextResponse.json({ error: "Chart not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

const patchSchema = z.object({ relation: z.enum(RELATIONS).optional(), isDefault: z.literal(true).optional() });

/** Change a saved chart's relation, or make it the default profile. */
export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/charts/[id]">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const chart = await prisma.savedChart.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!chart) return NextResponse.json({ error: "Chart not found." }, { status: 404 });
  await prisma.$transaction([
    ...(parsed.data.isDefault ? [prisma.savedChart.updateMany({ where: { userId: user.id }, data: { isDefault: false } })] : []),
    prisma.savedChart.update({ where: { id }, data: { ...(parsed.data.relation ? { relation: parsed.data.relation } : {}), ...(parsed.data.isDefault ? { isDefault: true } : {}) } }),
  ]);
  return NextResponse.json({ ok: true });
}
