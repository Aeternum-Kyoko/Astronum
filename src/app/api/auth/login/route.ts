import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/passwords";
import { checkRateLimit } from "@/lib/rateLimit";
import { createUserSessionToken, USER_COOKIE, userCookieOptions } from "@/lib/userSession";

const schema = z.object({
  email: z.string().trim().toLowerCase().max(200),
  password: z.string().max(200),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !parsed.data.email || !parsed.data.password) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const limit = checkRateLimit(`login:${ip}:${email}`, 8, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${Math.ceil(limit.retryAfterSec / 60)} minutes.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!(await verifyPassword(password, user?.passwordHash ?? null)) || !user) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  const res = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
  res.cookies.set(USER_COOKIE, await createUserSessionToken(user.id, user.sessionVersion), userCookieOptions);
  return res;
}
