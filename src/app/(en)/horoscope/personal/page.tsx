import type { Metadata } from "next";
import Link from "next/link";
import { DateTime } from "luxon";
import ToolShell, { birthFromParams } from "@/components/views/ToolShell";
import KundliChart from "@/components/KundliChart";
import { Stars } from "@/components/HoroscopeParts";
import ScoreArc from "@/components/ScoreArc";
import { calculateKundali } from "@/lib/astrology/kundali";
import { computeDailyTransits, resolveHoroscopeDay } from "@/lib/astrology/horoscope";
import { personalDay, HOUSE_TOPIC, TARAS } from "@/lib/astrology/personalDaily";
import { getDignity } from "@/lib/astrology/dignity";
import { transitMarkers } from "@/lib/astrology/chartMarkers";
import { SIGNS } from "@/lib/astrology/constants";
import { toBirthQuery } from "@/lib/birthParams";
import { formatSpan } from "@/lib/astrology/dashaTree";

export const metadata: Metadata = {
  title: "Personal Daily Horoscope — From Your Own Kundli",
  description:
    "A daily horoscope worked out from your birth chart, not just your sign: Tarabala, Chandrabala, every transit from your Lagna and Moon, Ashtakavarga bindus and your running dasha, each with its reason.",
  alternates: { canonical: "/horoscope/personal" },
};

const ordinal = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
const DAYS = ["yesterday", "today", "tomorrow"] as const;

export default async function PersonalHoroscopePage({ searchParams }: PageProps<"/horoscope/personal">) {
  const params = await searchParams;
  const birth = birthFromParams(params);
  let body: React.ReactNode = null;

  if (birth) {
    const chart = calculateKundali(birth);
    const { date, label } = resolveHoroscopeDay(typeof params.day === "string" ? params.day : undefined, birth.timezone);
    const transits = computeDailyTransits(date, birth.timezone);
    const noon = DateTime.fromISO(date, { zone: birth.timezone }).set({ hour: 12 }).toJSDate();
    const day = personalDay(chart, transits, noon);
    const moon = chart.planets.find((p) => p.planet === "Moon")!;
    const base = `/horoscope/personal?${toBirthQuery(birth)}`;
    const activeDay = label?.toLowerCase() ?? null;

    const marks = transitMarkers(transits.positions);
    const chartPoints = (from: number) =>
      day.transits.map((r) => ({
        planet: r.planet,
        house: ((r.signIndex - from + 12) % 12) + 1,
        signIndex: r.signIndex,
        retrograde: r.retrograde,
        markers: marks[r.planet],
        dignity: getDignity(r.planet, r.signIndex),
      }));
    const good = day.steps.filter((s) => s.points > 0).sort((a, b) => b.points - a.points);
    const hard = day.steps.filter((s) => s.points < 0).sort((a, b) => a.points - b.points);
    const tone = day.stars >= 4 ? "A strong day" : day.stars === 3 ? "A balanced day" : "A day to go gently";

    body = (
      <div className="space-y-6">
        <nav aria-label="Choose day" className="flex justify-center">
          <div className="inline-flex gap-1 rounded-full border border-border bg-ink-deep/80 p-1">
            {DAYS.map((d) => (
              <Link
                key={d}
                href={d === "today" ? base : `${base}&day=${d}`}
                aria-current={activeDay === d ? "page" : undefined}
                scroll={false}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize ${activeDay === d ? "bg-gold text-on-gold" : "text-muted hover:text-cream"}`}
              >
                {d}
              </Link>
            ))}
          </div>
        </nav>

        <section className="card-edge rounded-3xl p-5 sm:p-7 md:p-9">
          <div className="flex items-center gap-6 md:gap-8">
            <ScoreArc score={day.score} size={112} />
            <div>
              <p className="text-sm font-semibold text-gold-bright">{DateTime.fromISO(date).toFormat("cccc, d LLLL yyyy")}</p>
              <h2 className="mt-1.5 text-3xl leading-tight font-bold text-cream md:text-4xl">{tone}</h2>
              <Stars rating={day.stars} size="text-base" label={`${day.stars} out of 5`} />
            </div>
          </div>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted">
            Today&rsquo;s Moon passes through {SIGNS[transits.moonSignIndex]} ({transits.moonNakshatra}), your {ordinal(day.moonHouseFromLagna)} house from the Lagna, so{" "}
            <span className="text-cream">{HOUSE_TOPIC[day.moonHouseFromLagna]}</span> is where your attention goes today. {good[0] && (
              <>
                Biggest help: {good[0].label} (+{good[0].points}).{" "}
              </>
            )}
            {hard[0] && (
              <>
                Main thing to watch: {hard[0].label} ({hard[0].points}).
              </>
            )}
          </p>
          {transits.moonChange && (
            <p className="mt-4 rounded-xl border border-gold/30 bg-gold/5 px-5 py-3 text-sm text-cream">
              At {DateTime.fromJSDate(transits.moonChange.at, { zone: birth.timezone }).toFormat("h:mm a")} the Moon moves into {SIGNS[transits.moonChange.signIndex]}, your{" "}
              {ordinal(((transits.moonChange.signIndex - chart.ascendant.signIndex + 12) % 12) + 1)} house — the focus shifts to{" "}
              {HOUSE_TOPIC[((transits.moonChange.signIndex - chart.ascendant.signIndex + 12) % 12) + 1]}.
            </p>
          )}
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          <section className="card-edge rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-muted">Tarabala</h3>
            <p className={`mt-2 text-xl font-bold ${day.tarabala.tara.good ? "text-gold-bright" : "text-rose"}`}>{day.tarabala.tara.name} tara</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {day.tarabala.todayNakshatra} is the {ordinal(day.tarabala.count)} star from your {day.tarabala.birthNakshatra}. Every ninth star repeats the cycle, so it is tara{" "}
              {((day.tarabala.count - 1) % 9) + 1}: {day.tarabala.tara.meaning}.
            </p>
            <p className="mt-3 text-xs text-muted">Good taras: {TARAS.filter((t) => t.good).map((t) => t.name).join(", ")}.</p>
          </section>
          <section className="card-edge rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-muted">Chandrabala</h3>
            <p className={`mt-2 text-xl font-bold ${day.chandrabala.good ? "text-gold-bright" : "text-rose"}`}>
              {ordinal(day.chandrabala.house)} from your Moon {day.chandrabala.house === 8 && "(Chandrashtama)"}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Your natal Moon is in {moon.sign}; today&rsquo;s Moon is in {SIGNS[transits.moonSignIndex]}.{" "}
              {day.chandrabala.good ? "The Moon gives strength from the 1st, 3rd, 6th, 7th, 10th and 11th, and today is one of them." : "The Moon gives strength only from the 1st, 3rd, 6th, 7th, 10th and 11th, so today it doesn't back you."}
            </p>
          </section>
          <section className="card-edge rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-muted">Running dasha</h3>
            <p className="mt-2 text-xl font-bold text-cream">{day.dasha.chain.map((p) => p.lord).join(" › ")}</p>
            <ul className="mt-2 space-y-2 text-sm leading-relaxed text-muted">
              {day.dasha.chain.map((p, i) => (
                <li key={p.chain.join()}>
                  {day.dasha.lordNotes[i]} <span className="text-xs">(ends {DateTime.fromJSDate(p.end).toFormat("d LLL yyyy")}, {formatSpan(p.end.getTime() - noon.getTime())} left)</span>
                </li>
              ))}
            </ul>
            <Link href={`/kundali?${toBirthQuery(birth)}&tab=dashas`} className="mt-3 inline-block text-xs font-semibold text-gold-bright hover:underline">
              Open all dasha levels down to Prana
            </Link>
          </section>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="card-edge rounded-2xl p-6">
            <h3 className="text-lg font-bold text-cream">Today&rsquo;s planets from your Lagna</h3>
            <p className="mt-1 mb-5 text-sm text-muted">Your {chart.ascendant.sign} ascendant as the 1st house. Houses show which part of life each planet touches.</p>
            <KundliChart ascendantSignIndex={chart.ascendant.signIndex} planets={chartPoints(chart.ascendant.signIndex)} toggleId="personal-lagna" />
          </section>
          <section className="card-edge rounded-2xl p-6">
            <h3 className="text-lg font-bold text-cream">Today&rsquo;s planets from your Moon</h3>
            <p className="mt-1 mb-5 text-sm text-muted">Your {moon.sign} Moon as the 1st house. Gochara judges good and bad transits from here.</p>
            <KundliChart ascendantSignIndex={moon.signIndex} planets={chartPoints(moon.signIndex)} toggleId="personal-moon" />
          </section>
        </div>

        <section className="card-edge rounded-2xl p-6">
          <h3 className="text-lg font-bold text-cream">Every transit, and why</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="text-xs text-muted">
                <tr className="border-b border-border">
                  <th scope="col" className="py-2 pr-3 font-semibold">Planet</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">Sign</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">From Lagna</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">From Moon</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">Own bindus</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">SAV</th>
                  <th scope="col" className="py-2 font-semibold">Points</th>
                </tr>
              </thead>
              <tbody>
                {day.transits.map((r) => (
                  <tr key={r.planet} className="border-b border-border/60 align-top last:border-0">
                    <th scope="row" className="py-2 pr-3 font-semibold text-cream">
                      {r.planet}
                      {r.retrograde && r.planet !== "Rahu" && r.planet !== "Ketu" && <span className="ml-1 text-xs text-rose">R</span>}
                    </th>
                    <td className="font-tabular py-2 pr-3 text-muted">
                      {SIGNS[r.signIndex]} {Math.floor(r.degree)}°
                    </td>
                    <td className="py-2 pr-3 text-cream">{ordinal(r.houseFromLagna)}</td>
                    <td className={`py-2 pr-3 font-semibold ${r.favourable ? "text-gold-bright" : "text-rose"}`}>{ordinal(r.houseFromMoon)}</td>
                    <td className="font-tabular py-2 pr-3 text-muted">{r.bindus ?? "—"}</td>
                    <td className="font-tabular py-2 pr-3 text-muted">{r.sav}</td>
                    <td className={`font-tabular py-2 font-semibold ${r.points >= 0 ? "text-gold-bright" : "text-rose"}`}>
                      {r.points > 0 ? "+" : ""}
                      {r.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="mt-5 space-y-3 text-sm leading-relaxed text-muted">
            {day.transits.map((r) => (
              <li key={r.planet}>
                <span className="font-semibold text-cream">{r.planet}.</span> {r.reason}
              </li>
            ))}
          </ul>
        </section>

        <section className="card-edge rounded-2xl p-6">
          <h3 className="text-lg font-bold text-cream">How the score is worked out</h3>
          <p className="mt-1 text-sm text-muted">Every day starts at 46. Each factor adds or takes away points; the total is capped between 0 and 100.</p>
          <ol className="mt-4 divide-y divide-border/60">
            {day.steps.map((s) => (
              <li key={s.label} className="flex items-start justify-between gap-4 py-2.5 text-sm">
                <span>
                  <span className="font-semibold text-cream">{s.label}</span>
                  <span className="block text-xs leading-relaxed text-muted">{s.reason}</span>
                </span>
                <span className={`font-tabular shrink-0 font-semibold ${s.points > 0 ? "text-gold-bright" : s.points < 0 ? "text-rose" : "text-muted"}`}>
                  {s.points > 0 ? "+" : ""}
                  {s.points}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-sm font-semibold text-cream">Total: {day.score} of 100 · {day.stars} stars</p>
        </section>
      </div>
    );
  }

  return (
    <ToolShell
      eyebrow="Personal horoscope"
      title="Your daily horoscope, from your own kundli"
      intro="A sign horoscope is shared by one person in twelve. This one uses your birth star, Moon, Lagna, Ashtakavarga and running dasha — and shows the reason behind every point."
      path="/horoscope/personal"
      submit="Show my horoscope"
      birth={birth}
    >
      {body}
    </ToolShell>
  );
}
