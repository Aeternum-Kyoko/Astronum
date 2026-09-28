import { DateTime } from "luxon";
import { calculateKundali } from "@/lib/astrology/kundali";
import { computeDailyTransits } from "@/lib/astrology/horoscope";
import { personalDay } from "@/lib/astrology/personalDaily";
import { periodsAt } from "@/lib/astrology/dashaTree";
import { saturnCycles } from "@/lib/astrology/transits";
import { observancesForYear } from "@/lib/astrology/festivals";
import { escapeHtml } from "@/lib/email";
import { toBirthQuery } from "@/lib/birthParams";
import type { Profile } from "@/lib/profiles";

/**
 * The once-a-day digest email. Everything the user opted into that applies
 * today goes into one message — never several — and each dasha or transit
 * alert is sent once, remembered by a key.
 */

export interface AlertUser {
  name: string;
  email: string;
  notifyDaily: boolean;
  notifyDasha: boolean;
  notifyTransits: boolean;
  notifyFestivals: boolean;
  sentAlertKeys: string;
  unsubscribeToken: string | null;
}

export interface Digest {
  subject: string;
  text: string;
  html: string;
  newKeys: string[];
}

const DAY = 86400_000;

export function buildDigest(user: AlertUser, profiles: Profile[], siteUrl: string, now = new Date()): Digest | null {
  if (!profiles.length) return null;
  const sent = new Set(user.sentAlertKeys.split(",").filter(Boolean));
  const me = profiles[0];
  const local = DateTime.fromJSDate(now, { zone: me.timezone });
  const sections: { title: string; lines: string[]; link?: string }[] = [];
  const newKeys: string[] = [];

  if (user.notifyDaily) {
    const chart = calculateKundali(me);
    const day = personalDay(chart, computeDailyTransits(local.toISODate()!, me.timezone), now);
    const good = day.steps.filter((s) => s.points > 0).sort((a, b) => b.points - a.points)[0];
    const hard = day.steps.filter((s) => s.points < 0).sort((a, b) => a.points - b.points)[0];
    const running = periodsAt(chart.dashas, now, 3).map((p) => p.lord).join(" › ");
    sections.push({
      title: `Your day: ${"★".repeat(day.stars)}${"☆".repeat(5 - day.stars)} (${day.score}/100)`,
      lines: [
        `${day.tarabala.tara.name} tara — ${day.tarabala.tara.meaning}.`,
        good ? `Biggest help: ${good.label}.` : "",
        hard ? `Watch: ${hard.label}.` : "",
        `Running dasha: ${running}.`,
      ].filter(Boolean),
      link: `${siteUrl}/horoscope/personal?${toBirthQuery(me)}`,
    });
  }

  for (const p of profiles) {
    const needDasha = user.notifyDasha;
    const needTransit = user.notifyTransits;
    if (!needDasha && !needTransit) break;
    const chart = calculateKundali(p);
    if (needDasha) {
      // An Antardasha starting within the next week.
      for (const md of chart.dashas)
        for (const ad of md.subPeriods ?? []) {
          const start = new Date(ad.start).getTime();
          if (start <= now.getTime() || start > now.getTime() + 7 * DAY) continue;
          const key = `d:${p.id}:${start}`;
          if (sent.has(key)) continue;
          newKeys.push(key);
          sections.push({
            title: `${p.name}: a new dasha period begins`,
            lines: [`${md.lord}–${ad.lord} begins on ${DateTime.fromMillis(start).toFormat("d LLLL yyyy")} and runs until ${DateTime.fromJSDate(new Date(ad.end)).toFormat("LLLL yyyy")}.`],
            link: `${siteUrl}/kundali?${toBirthQuery(p)}&tab=dashas`,
          });
        }
    }
    if (needTransit) {
      const moon = chart.planets.find((x) => x.planet === "Moon")!;
      for (const c of saturnCycles(moon.signIndex, now, new Date(now.getTime() + 31 * DAY))) {
        const start = new Date(c.start).getTime();
        if (start <= now.getTime()) continue;
        const key = `s:${p.id}:${c.kind}:${start}`;
        if (sent.has(key)) continue;
        newKeys.push(key);
        sections.push({
          title: `${p.name}: ${c.kind} begins soon`,
          lines: [`Saturn's ${c.kind} begins on ${DateTime.fromMillis(start).toFormat("d LLLL yyyy")} and lasts until ${DateTime.fromJSDate(new Date(c.end)).toFormat("LLLL yyyy")}. Patience, discipline and Saturn's remedies help.`],
          link: `${siteUrl}/sade-sati?${toBirthQuery(p)}`,
        });
      }
    }
  }

  if (user.notifyFestivals) {
    const tomorrow = local.plus({ days: 1 }).toISODate()!;
    const fest = observancesForYear(local.plus({ days: 1 }).year, me).filter((o) => o.date === tomorrow);
    if (fest.length) sections.push({ title: "Tomorrow", lines: fest.map((f) => `${f.name}${f.description ? ` — ${f.description}` : ""}`), link: `${siteUrl}/festivals` });
  }

  if (!sections.length) return null;
  const unsubscribe = user.unsubscribeToken ? `${siteUrl}/unsubscribe?token=${user.unsubscribeToken}` : `${siteUrl}/account`;
  const date = local.toFormat("cccc, d LLLL");
  const text = [`Namaste ${user.name.split(" ")[0]},`, "", ...sections.flatMap((s) => [s.title, ...s.lines, s.link ? s.link : "", ""]), `Change or stop these emails: ${unsubscribe}`].join("\n");
  const html = `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;color:#1a1a1a">
<p>Namaste ${escapeHtml(user.name.split(" ")[0])},</p>
${sections
  .map(
    (s) => `<h2 style="font-size:17px;margin:24px 0 6px;color:#8a5d00">${escapeHtml(s.title)}</h2>
${s.lines.map((l) => `<p style="margin:4px 0">${escapeHtml(l)}</p>`).join("")}
${s.link ? `<p style="margin:8px 0"><a href="${escapeHtml(s.link)}">Open</a></p>` : ""}`
  )
  .join("\n")}
<p style="margin-top:32px;font-size:12px;color:#666"><a href="${escapeHtml(unsubscribe)}">Unsubscribe</a> or change your alerts in your account.</p>
</div>`;
  return { subject: `Astronum · ${date}`, text, html, newKeys };
}
