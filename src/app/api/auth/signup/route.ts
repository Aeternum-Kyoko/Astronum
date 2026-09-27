import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/passwords";
import { checkRateLimit } from "@/lib/rateLimit";
import { createUserSessionToken, USER_COOKIE, userCookieOptions } from "@/lib/userSession";

const schema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(80),
  email: z.email("Please enter a valid email address.").trim().toLowerCase().max(200),
  password: z.string().min(8, "Use at least 8 characters for your password.").max(200),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!checkRateLimit(`signup:${ip}`, 10, 60 * 60 * 1000).allowed) {
    return NextResponse.json({ error: "Too many sign-ups from this network. Please try again later." }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { name, email, password } = parsed.data;

  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    return NextResponse.json({ error: "An account with this email already exists. Try signing in." }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: { name, email, passwordHash: await hashPassword(password) },
    select: { id: true, name: true, email: true },
  });

  const res = NextResponse.json({ user }, { status: 201 });
  res.cookies.set(USER_COOKIE, await createUserSessionToken(user.id, 0), userCookieOptions);
  return res;
}
