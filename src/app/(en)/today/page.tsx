import type { Metadata } from "next";
import Link from "next/link";
import { DateTime } from "luxon";
import ScoreArc from "@/components/ScoreArc";
import { getCurrentUser } from "@/lib/currentUser";
import { getProfiles, type Profile } from "@/lib/profiles";
import { calculateKundali } from "@/lib/astrology/kundali";
import { computeDailyTransits } from "@/lib/astrology/horoscope";
import { personalDay } from "@/lib/astrology/personalDaily";
import { periodsAt } from "@/lib/astrology/dashaTree";
import { lifeTimeline } from "@/lib/astrology/lifeTimeline";
import { computeDailyPanchang } from "@/lib/astrology/panchang";
import { computePanchangExtras } from "@/lib/astrology/panchangExtras";
import { observancesForYear } from "@/lib/astrology/festivals";
import { toBirthQuery } from "@/lib/birthParams";
import PullToRefresh from "@/components/PullToRefresh";

export const metadata: Metadata = { title: "Today for you", robots: { index: false } };


function dayFor(p: Profile, now: Date) {
  const chart = calculateKundali(p);
  const today = DateTime.fromJSDate(now, { zone: p.timezone }).toISODate()!;
  const t = computeDailyTransits(today, p.timezone);
  const day = personalDay(chart, t, now);
  const running = periodsAt(chart.dashas, now, 3);
  const nextChange = [...running].sort((a, b) => a.end.getTime() - b.end.getTime())[0];
  return { chart, day, running, nextChange };
}

export default async function TodayPage() {
  const user = await getCurrentUser();
  const now = new Date();

  if (!user) {
    return (
      <section className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-4xl font-bold text-cream">Your day, from your own kundli</h1>
        <p className="mt-4 text-muted">Sign in and save your kundli to see each morning how the day looks for you and your family — Tarabala, transits, running dasha and what&rsquo;s coming up.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/login?next=/today" className="rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-on-gold">
            Sign in
          </Link>
          <Link href="/horoscope/personal" className="rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-cream">
            Try it without an account
          </Link>
        </div>
      </section>
    );
  }

  const profiles = await getProfiles();
  if (!profiles.length) {
    return (
      <section className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-4xl font-bold text-cream">Namaste, {user.name.split(" ")[0]}</h1>
        <p className="mt-4 text-muted">Save your kundli once and this page will show your day every morning.</p>
        <Link href="/kundali" className="mt-6 inline-block rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-on-gold">
          Create and save your kundli
        </Link>
      </section>
    );
  }

  const [me, ...family] = profiles;
  const mine = dayFor(me, now);
  const timeline = lifeTimeline(mine.chart);
  const upcoming = timeline.keyWindows.filter((k) => new Date(k.end) > now).slice(0, 3);
  const local = DateTime.fromJSDate(now, { zone: me.timezone });
  const panchang = computeDailyPanchang(local.toISODate()!, me.latitude, me.longitude, me.timezone);
  const extras = computePanchangExtras(panchang, me.latitude, me.longitude);
  const t = (d: Date) => DateTime.fromJSDate(d, { zone: me.timezone }).toFormat("h:mm a");
  const festivals = observancesForYear(local.year, me)
    .filter((o) => o.date >= local.toISODate()!)
    .slice(0, 4);
  const good = mine.day.steps.filter((s) => s.points > 0).sort((a, b) => b.points - a.points)[0];
  const hard = mine.day.steps.filter((s) => s.points < 0).sort((a, b) => a.points - b.points)[0];

  return (
    <PullToRefresh>
    <section className="mx-auto max-w-6xl px-5 py-14 md:py-20">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gold-bright">{local.toFormat("cccc, d LLLL yyyy")}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-cream md:text-5xl">Namaste, {user.name.split(" ")[0]}</h1>
        </div>
        <Link href="/account" className="text-sm font-semibold text-gold-bright hover:underline">
          Profiles and email alerts
        </Link>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="card-edge rounded-3xl p-7">
          <div className="flex items-center gap-6">
            <ScoreArc score={mine.day.score} size={112} />
            <div>
              <p className="text-sm text-muted">
                {me.name}, {me.relation}
              </p>
              <p className="mt-1 text-2xl leading-tight font-bold text-cream">{mine.day.stars >= 4 ? "A strong day" : mine.day.stars === 3 ? "A balanced day" : "A day to go gently"}</p>
            </div>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <span className={`font-semibold ${mine.day.tarabala.tara.good ? "text-gold-bright" : "text-rose"}`}>{mine.day.tarabala.tara.name} tara</span>
              <span className="text-muted"> — {mine.day.tarabala.tara.meaning}.</span>
            </li>
            <li>
              <span className={`font-semibold ${mine.day.chandrabala.good ? "text-gold-bright" : "text-rose"}`}>Moon {mine.day.chandrabala.house}th from your Moon</span>
              <span className="text-muted"> — {mine.day.chandrabala.good ? "a supportive day for the mind" : "keep plans light"}.</span>
            </li>
            {good && (
              <li className="text-muted">
                <span className="font-semibold text-cream">Biggest help:</span> {good.label}
              </li>
            )}
            {hard && (
              <li className="text-muted">
                <span className="font-semibold text-cream">Watch:</span> {hard.label}
              </li>
            )}
          </ul>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={`/horoscope/personal?${toBirthQuery(me)}`} className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-on-gold">
              Full reading for today
            </Link>
            <Link href={`/kundali?${toBirthQuery(me)}`} className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-cream">
              Open kundli
            </Link>
          </div>
        </section>

        <div className="space-y-6">
          <section className="card-edge rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-muted">Running dasha</h2>
            <p className="mt-1 text-xl font-bold text-cream">{mine.running.map((p) => p.lord).join(" › ")}</p>
            {mine.nextChange && (
              <p className="mt-1 text-sm text-muted">
                Next change {DateTime.fromJSDate(mine.nextChange.end).toFormat("d LLL yyyy")} — the {["Mahadasha", "Antardasha", "Pratyantardasha"][mine.nextChange.chain.length - 1]} of {mine.nextChange.lord} ends.
              </p>
            )}
            <p className="mt-2 text-sm text-muted">{mine.chart.sadeSati.active ? `Sade Sati is running (${mine.chart.sadeSati.phase} phase).` : "Not in Sade Sati."}</p>
          </section>
          <section className="card-edge rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-muted">Coming up for you</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {upcoming.map((k) => (
                <li key={k.kind}>
                  <span className={`font-semibold ${k.nature === "caution" ? "text-rose" : "text-gold-bright"}`}>{k.label}</span>
                  <span className="block text-xs text-muted">
                    Age {k.ages} · {DateTime.fromJSDate(new Date(k.start)).toFormat("LLL yyyy")} – {DateTime.fromJSDate(new Date(k.end)).toFormat("LLL yyyy")} · {k.confidence}%
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <section className="card-edge mt-6 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-cream">Today&rsquo;s Panchang · {me.place.split(",")[0]}</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs text-muted">Tithi</dt>
            <dd className="text-cream">{panchang.tithi.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Nakshatra</dt>
            <dd className="text-cream">{panchang.nakshatra.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Rahu Kaal</dt>
            <dd className="text-rose">
              {t(panchang.rahuKaal.start)} – {t(panchang.rahuKaal.end)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Abhijit Muhurta</dt>
            <dd className="text-gold-bright">
              {t(panchang.abhijit.start)} – {t(panchang.abhijit.end)}
            </dd>
          </div>
        </dl>
        {extras.specialYogas.length > 0 && <p className="mt-3 text-sm text-gold-bright">{[...new Set(extras.specialYogas.map((y) => y.name))].join(" · ")}</p>}
        {festivals.length > 0 && (
          <p className="mt-3 text-sm text-muted">
            Coming festivals: {festivals.map((f) => `${f.name} (${DateTime.fromISO(f.date).toFormat("d LLL")})`).join(", ")}
          </p>
        )}
      </section>

      {family.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-bold text-cream">Your family today</h2>
          <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {family.slice(0, 9).map((p) => {
              const d = dayFor(p, now);
              return (
                <li key={p.id} className="card-edge rounded-2xl p-5">
                  <p className="font-semibold text-cream">
                    {p.name} <span className="text-xs font-normal text-muted">· {p.relation}</span>
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <ScoreArc score={d.day.score} size={56} label="" />
                    <span className="text-sm text-cream">{d.day.stars >= 4 ? "A strong day" : d.day.stars === 3 ? "A balanced day" : "A day to go gently"}</span>
                  </div>
                  <p className="text-xs text-muted">
                    {d.day.tarabala.tara.name} tara · {d.running.slice(0, 2).map((x) => x.lord).join("–")} dasha{d.chart.sadeSati.active ? " · Sade Sati" : ""}
                  </p>
                  <Link href={`/horoscope/personal?${toBirthQuery(p)}`} className="mt-2 inline-block text-xs font-semibold text-gold-bright hover:underline">
                    Their full day
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </section>
    </PullToRefresh>
  );
}
