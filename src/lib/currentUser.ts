import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { USER_COOKIE, verifyUserSessionToken } from "@/lib/userSession";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

/** The signed-in user for this request, or null (also if the account is gone or the session was revoked). */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(USER_COOKIE)?.value;
  const session = await verifyUserSessionToken(token);
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, sessionVersion: true },
  });
  // A password reset bumps sessionVersion, signing out every older session.
  if (!user || user.sessionVersion !== session.version) return null;
  return { id: user.id, name: user.name, email: user.email };
}
