import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";

const schema = z.object({ notifyDaily: z.boolean(), notifyDasha: z.boolean(), notifyTransits: z.boolean(), notifyFestivals: z.boolean() });

/** Save the signed-in user's email alert choices. */
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const existing = await prisma.user.findUnique({ where: { id: user.id }, select: { unsubscribeToken: true } });
  await prisma.user.update({
    where: { id: user.id },
    data: { ...parsed.data, unsubscribeToken: existing?.unsubscribeToken ?? randomBytes(24).toString("base64url") },
  });
  return NextResponse.json({ ok: true });
}
