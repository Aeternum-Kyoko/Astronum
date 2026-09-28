import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import type { BirthParams } from "@/lib/birthParams";

export interface Profile extends BirthParams {
  id: string;
  relation: string;
  isDefault: boolean;
}

/** The signed-in user's saved profiles, default first; empty when signed out. */
export async function getProfiles(): Promise<Profile[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const rows = await prisma.savedChart.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    select: { id: true, name: true, date: true, time: true, place: true, latitude: true, longitude: true, timezone: true, relation: true, isDefault: true },
  });
  return rows;
}
