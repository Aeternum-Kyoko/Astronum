import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Turns off every email alert for the account holding this token. POST only, so link-scanners can't trigger it. */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const token = (form?.get("token") ?? req.nextUrl.searchParams.get("token") ?? "").toString();
  if (token) {
    await prisma.user.updateMany({ where: { unsubscribeToken: token }, data: { notifyDaily: false, notifyDasha: false, notifyTransits: false, notifyFestivals: false } });
  }
  return NextResponse.redirect(new URL("/unsubscribe?done=1", req.url), 303);
}
