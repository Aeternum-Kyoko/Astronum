import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { escapeHtml, sendEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rateLimit";
import { newResetToken, RESET_TOKEN_TTL_MS } from "@/lib/resetTokens";
import { absoluteUrl } from "@/lib/site";

const schema = z.object({ email: z.string().trim().toLowerCase().max(200) });

// Same response whether or not the account exists, so this can't be used to discover emails.
const GENERIC = { ok: true, message: "If an account exists for that email, a reset link is on its way." };

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !parsed.data.email) {
    return NextResponse.json({ error: "Enter your email address." }, { status: 400 });
  }
  const { email } = parsed.data;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!checkRateLimit(`forgot:${ip}`, 5, 15 * 60 * 1000).allowed || !checkRateLimit(`forgot:${email}`, 3, 60 * 60 * 1000).allowed) {
    return NextResponse.json(GENERIC);
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true } });
  if (user) {
    const { token, tokenHash } = newResetToken();
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
    });
    const link = absoluteUrl(`/reset-password?token=${token}`);
    try {
      await sendEmail({
        to: email,
        subject: "Reset your Astronum password",
        text: `Namaste ${user.name},\n\nUse this link to set a new password (valid for 1 hour):\n${link}\n\nIf you didn't ask for this, you can ignore this email.`,
        html: `<p>Namaste ${escapeHtml(user.name)},</p><p><a href="${escapeHtml(link)}">Set a new password</a> — the link is valid for 1 hour.</p><p>If you didn't ask for this, you can ignore this email.</p>`,
      });
    } catch (err) {
      console.error("Password reset email failed:", err);
    }
  }
  return NextResponse.json(GENERIC);
}
