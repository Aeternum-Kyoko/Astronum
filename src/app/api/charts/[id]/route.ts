import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/charts/[id]">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const { id } = await ctx.params;

  // Scoped to the owner, so one user can never delete another's chart.
  const { count } = await prisma.savedChart.deleteMany({ where: { id, userId: user.id } });
  if (count === 0) return NextResponse.json({ error: "Chart not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
