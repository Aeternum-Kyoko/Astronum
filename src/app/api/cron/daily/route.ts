import { NextRequest, NextResponse } from "next/server";
import { DateTime } from "luxon";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { buildDigest } from "@/lib/alerts";
import { SITE_URL } from "@/lib/site";

/**
 * The daily digest job. Call it once a day (e.g. 06:00 IST) from a scheduler
 * with `Authorization: Bearer <CRON_SECRET>`. Each user gets at most one
 * email per day, and never the same dasha or transit alert twice.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = DateTime.now().setZone("Asia/Kolkata").toISODate()!;
  const users = await prisma.user.findMany({
    where: { OR: [{ notifyDaily: true }, { notifyDasha: true }, { notifyTransits: true }, { notifyFestivals: true }], NOT: { lastDailySentOn: today } },
    select: { id: true, name: true, email: true, notifyDaily: true, notifyDasha: true, notifyTransits: true, notifyFestivals: true, sentAlertKeys: true, unsubscribeToken: true },
  });

  let sent = 0;
  let skipped = 0;
  const failed: string[] = [];
  for (const u of users) {
    try {
      const profiles = await prisma.savedChart.findMany({
        where: { userId: u.id },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
        select: { id: true, name: true, date: true, time: true, place: true, latitude: true, longitude: true, timezone: true, relation: true, isDefault: true },
      });
      const digest = buildDigest(u, profiles, SITE_URL);
      if (digest) {
        const unsubscribe = u.unsubscribeToken ? `${SITE_URL}/unsubscribe?token=${u.unsubscribeToken}` : undefined;
        await sendEmail({
          to: u.email,
          subject: digest.subject,
          text: digest.text,
          html: digest.html,
          ...(unsubscribe ? { headers: { "List-Unsubscribe": `<${unsubscribe}>` } } : {}),
        });
        sent++;
      } else skipped++;
      // Keep the last 200 alert keys so the list doesn't grow forever.
      const keys = [...u.sentAlertKeys.split(",").filter(Boolean), ...(digest?.newKeys ?? [])].slice(-200).join(",");
      await prisma.user.update({ where: { id: u.id }, data: { lastDailySentOn: today, sentAlertKeys: keys } });
    } catch (err) {
      failed.push(`${u.id}: ${err instanceof Error ? err.message : "error"}`);
    }
  }
  return NextResponse.json({ users: users.length, sent, skipped, failed });
}
