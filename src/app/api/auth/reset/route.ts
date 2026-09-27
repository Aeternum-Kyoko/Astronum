import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/passwords";
import { hashResetToken } from "@/lib/resetTokens";
import { createUserSessionToken, USER_COOKIE, userCookieOptions } from "@/lib/userSession";

const schema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(8, "Use at least 8 characters for your password.").max(200),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  const { token, password } = parsed.data;

  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashResetToken(token) } });
  if (!record || record.expiresAt < new Date()) {
    return NextResponse.json({ error: "This reset link is invalid or has expired. Request a new one." }, { status: 400 });
  }

  // New password, every old session revoked, and every outstanding reset link for the account used up.
  const [user] = await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: await hashPassword(password), sessionVersion: { increment: 1 } },
      select: { id: true, sessionVersion: true },
    }),
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
  ]);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(USER_COOKIE, await createUserSessionToken(user.id, user.sessionVersion), userCookieOptions);
  return res;
}
