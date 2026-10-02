"use client";

import { useState } from "react";
import SectionSkeleton from "@/components/SectionSkeleton";
import { haptic } from "@/lib/haptics";
import type { KundaliReport } from "@/lib/astrology/report";
import type { AreaForecast, MonthForecast, Reason, Verdict } from "@/lib/astrology/monthlyForecast";
import type { Grade } from "@/lib/astrology/planetDiagnosis";

const VERDICT_TEXT: Record<Verdict, string> = {
  Excellent: "text-gold-bright",
  Favourable: "text-gold-bright",
  Mixed: "text-cream",
  Challenging: "text-rose",
  Difficult: "text-rose",
};
const VERDICT_BAR: Record<Verdict, string> = {
  Excellent: "bg-gold",
  Favourable: "bg-gold/70",
  Mixed: "bg-muted/60",
  Challenging: "bg-rose/70",
  Difficult: "bg-rose",
};
const GRADE_TEXT: Record<Grade, string> = {
  Excellent: "text-gold-bright",
  Good: "text-gold-bright",
  Average: "text-cream",
  Weak: "text-rose",
  "Very weak": "text-rose",
};
const verdictOf = (s: number): Verdict => (s >= 68 ? "Excellent" : s >= 57 ? "Favourable" : s >= 45 ? "Mixed" : s >= 35 ? "Challenging" : "Difficult");

const day = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const shortMonth = (key: string) => new Date(`${key}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });

/** The next twelve months read from dasha, gochara, every divisional chart, numerology and planet strength together. */
export default function MonthlyForecastPanel({ report }: { report: KundaliReport | null }) {
  const [index, setIndex] = useState(0);
  const f = report?.monthly;
  if (!f) return <SectionSkeleton label="Working out your next twelve months…" />;
  const m = f.months[index];

  return (
    <div className="space-y-8">
      <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted">
        Each month reads your running Mahadasha, Antardasha and Pratyantardasha, every planet&rsquo;s transit (gochara) with
        vedha and Ashtakavarga, your divisional charts, your numbers and each planet&rsquo;s full strength — together, with every
        reason shown.
      </p>

      <section className="card-edge rounded-3xl p-5 md:p-6" aria-label="Twelve-month outlook">
        <h3 className="text-sm font-semibold text-cream">Your next 12 months</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted">{f.summary.text}</p>
        <div className="mt-5 flex h-36 items-end gap-1.5" role="tablist" aria-label="Choose a month">
          {f.summary.trend.map((t, i) => {
            const v = verdictOf(t.score);
            return (
              <button
                key={t.month}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`${t.label}: ${t.score}, ${v}`}
                onClick={() => {
                  haptic("selection");
                  setIndex(i);
                }}
                className="group flex h-full flex-1 flex-col items-center justify-end gap-1"
              >
                <span className={`text-[10px] font-tabular ${i === index ? "text-cream" : "text-muted"}`}>{t.score}</span>
                <span className={`w-full rounded-t-md transition ${VERDICT_BAR[v]} ${i === index ? "ring-2 ring-cream/80" : "opacity-80 group-hover:opacity-100"}`} style={{ height: `${Math.max(6, Math.min(100, ((t.score - 30) / 60) * 100))}%` }} />
                <span className={`text-[10px] ${i === index ? "font-semibold text-cream" : "text-muted"}`}>{shortMonth(t.month)}</span>
              </button>
            );
          })}
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
          {(
            [
              ["career", "Career"],
              ["money", "Money"],
              ["love", "Love"],
              ["health", "Health"],
              ["home", "Home"],
              ["growth", "Learning"],
            ] as const
          ).map(([k, label]) => (
            <div key={k} className="rounded-xl border border-border/70 px-3 py-2">
              <dt className="text-muted">Best for {label.toLowerCase()}</dt>
              <dd className="font-semibold text-cream">{f.summary.bestFor[k]}</dd>
            </div>
          ))}
        </dl>
      </section>

      <MonthView m={m} />

      <section aria-label="Planet diagnosis">
        <h3 className="text-xl font-bold tracking-tight text-cream">Full planet diagnosis</h3>
        <p className="mt-1 text-sm text-muted">
          Every strength measure weighed together — Shadbala, Vimshopaka, dignity in D1 and D9, vargottama, house, combustion and
          avastha. These grades decide how well each dasha period above can deliver.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {f.diagnosis.map((d) => (
            <details key={d.planet} className="card-edge group rounded-2xl p-4">
              <summary className="flex cursor-pointer list-none items-center gap-3">
                <span className="w-16 font-semibold text-cream">{d.planet}</span>
                <span className="relative h-2 flex-1 rounded-full bg-surface-raised">
                  <span className={`absolute inset-y-0 left-0 rounded-full ${d.score >= 57 ? "bg-gold" : d.score >= 43 ? "bg-muted/60" : "bg-rose"}`} style={{ width: `${d.score}%` }} />
                </span>
                <span className={`w-24 text-right text-xs font-semibold ${GRADE_TEXT[d.grade]}`}>
                  {d.grade} · {d.score}
                </span>
              </summary>
              <p className="mt-3 text-sm text-cream">{d.summary}</p>
              <ul className="mt-2 space-y-1 text-xs">
                {d.factors.map((x) => (
                  <li key={x.label} className="flex justify-between gap-3">
                    <span className="text-muted">{x.label}</span>
                    <span className={`font-tabular ${x.points > 0 ? "text-gold-bright" : x.points < 0 ? "text-rose" : "text-muted"}`}>
                      {x.points > 0 ? "+" : ""}
                      {x.points}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

function MonthView({ m }: { m: MonthForecast }) {
  return (
    <section className="space-y-6" aria-label={`Forecast for ${m.label}`}>
      <div className="card-edge rounded-3xl p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-3xl text-cream">{m.label}</h3>
          <span className={`text-sm font-semibold ${VERDICT_TEXT[m.verdict]}`}>
            {m.verdict} · {m.score}/100
          </span>
        </div>
        <p className="mt-2 text-lg text-cream">{m.headline}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-gold/50 bg-gold/10 px-3 py-1 text-cream">
            Mahadasha <b>{m.dasha.maha}</b>
          </span>
          <span className="rounded-full border border-gold/50 bg-gold/10 px-3 py-1 text-cream">
            Antardasha <b>{m.dasha.antar}</b>
          </span>
          {m.dasha.pratyantars.map((p) => (
            <span key={p.start} className="rounded-full border border-border px-3 py-1 text-muted">
              Pratyantar <b className="text-cream">{p.lord}</b> · {day(p.start)} – {day(p.end)}
            </span>
          ))}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted">{m.dasha.text}</p>
        <ul className="mt-4 space-y-1.5 text-sm text-cream">
          {m.focus.map((x) => (
            <li key={x} className="flex gap-2">
              <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" />
              {x}
            </li>
          ))}
        </ul>
        {m.remedy && <p className="mt-4 rounded-xl border border-gold/40 bg-gold/5 px-4 py-3 text-sm text-cream">Remedy: {m.remedy.text}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {m.areas.map((a) => (
          <AreaCard key={a.key} a={a} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card-edge rounded-2xl p-5" aria-label="Key dates">
          <h4 className="text-sm font-semibold text-cream">Key dates</h4>
          {m.keyDates.length === 0 ? (
            <p className="mt-2 text-sm text-muted">A quiet month — no sign changes, stations or eclipses.</p>
          ) : (
            <ol className="mt-3 space-y-2.5 text-sm">
              {m.keyDates.map((k, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-14 shrink-0 font-tabular text-xs text-muted">{day(k.date)}</span>
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${k.tone === "good" ? "bg-gold" : k.tone === "hard" ? "bg-rose" : "bg-muted/60"}`} aria-hidden="true" />
                  <span className="text-cream">{k.text}</span>
                </li>
              ))}
            </ol>
          )}
          {m.chandrashtama.length > 0 && (
            <p className="mt-4 text-xs text-muted">
              <span className="font-semibold text-rose">Chandrashtama</span> (Moon in the 8th from your Moon — keep these days light):{" "}
              {m.chandrashtama.map((c) => (c.start === c.end ? day(c.start) : `${day(c.start)} – ${day(c.end)}`)).join(", ")}
            </p>
          )}
        </section>

        <section className="space-y-3" aria-label="Signs and numbers">
          <Note title="Moon sign view" text={m.moonSign} />
          <Note title="Sun sign view" text={m.sunSign} />
          <Note title={`Numerology · personal month ${m.numerology.personalMonth}`} text={m.numerology.text} tone={m.numerology.supportive ? "good" : undefined} />
        </section>
      </div>

      <section className="card-edge overflow-x-auto rounded-2xl" aria-label="Gochara">
        <table className="w-full text-sm font-tabular">
          <caption className="px-4 pt-4 text-left">
            <span className="block font-semibold text-cream">Gochara this month (mid-month positions)</span>
            <span className="text-xs text-muted">Houses counted from your Lagna, Moon and Sun; bindus from the planet&rsquo;s own Ashtakavarga.</span>
          </caption>
          <thead>
            <tr className="border-b border-border text-left text-xs whitespace-nowrap text-muted">
              <th className="px-4 py-3">Planet</th>
              <th className="px-4 py-3">Sign</th>
              <th className="px-4 py-3">Lagna</th>
              <th className="px-4 py-3">Moon</th>
              <th className="px-4 py-3">Sun</th>
              <th className="px-4 py-3">Bindus</th>
              <th className="px-4 py-3">Kakshya</th>
              <th className="px-4 py-3">Gochara</th>
            </tr>
          </thead>
          <tbody className="whitespace-nowrap">
            {m.transits.map((t) => (
              <tr key={t.planet} className="border-b border-border/50 last:border-0">
                <td className="px-4 py-2.5 font-semibold text-cream">
                  {t.planet}
                  {t.retrograde && t.planet !== "Rahu" && t.planet !== "Ketu" && <span className="ml-1 text-xs text-rose">R</span>}
                </td>
                <td className="px-4 py-2.5 text-muted">
                  {t.sign} {Math.floor(t.degree)}°
                </td>
                <td className="px-4 py-2.5 text-muted">{t.houseFromLagna}</td>
                <td className="px-4 py-2.5 text-muted">{t.houseFromMoon}</td>
                <td className="px-4 py-2.5 text-muted">{t.houseFromSun}</td>
                <td className="px-4 py-2.5 text-muted">{t.bindus ?? "—"}</td>
                <td className="px-4 py-2.5 text-muted">{t.kakshya ? <span className={t.kakshya.good ? "text-gold-bright" : "text-rose"}>{t.kakshya.lord}</span> : "—"}</td>
                <td className="px-4 py-2.5">
                  {t.favourable ? (
                    t.vedhaBy ? (
                      <span className="text-cream">Good, blocked by {t.vedhaBy}</span>
                    ) : (
                      <span className="text-gold-bright">Good</span>
                    )
                  ) : (
                    <span className="text-rose">Unfavourable</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  );
}

function AreaCard({ a }: { a: AreaForecast }) {
  return (
    <details className="card-edge group rounded-2xl p-5">
      <summary className="cursor-pointer list-none">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-semibold text-cream">{a.label}</h4>
          <span className={`text-xs font-semibold ${VERDICT_TEXT[a.verdict]}`}>
            {a.verdict} · {a.score}
          </span>
        </div>
        <span className="relative mt-2 block h-1.5 rounded-full bg-surface-raised">
          <span className={`absolute inset-y-0 left-0 rounded-full ${VERDICT_BAR[a.verdict]}`} style={{ width: `${a.score}%` }} />
        </span>
        <p className="mt-3 text-sm leading-relaxed text-muted">{a.text}</p>
        <span className="mt-2 inline-block text-xs font-semibold text-gold-bright group-open:hidden">Show every factor</span>
      </summary>
      <ul className="mt-3 space-y-2 border-t border-border/50 pt-3 text-xs">
        {a.reasons.map((r, i) => (
          <ReasonRow key={i} r={r} />
        ))}
      </ul>
    </details>
  );
}

function ReasonRow({ r }: { r: Reason }) {
  return (
    <li className="flex gap-3">
      <span className={`w-10 shrink-0 text-right font-tabular font-semibold ${r.points > 0 ? "text-gold-bright" : r.points < 0 ? "text-rose" : "text-muted"}`}>
        {r.points > 0 ? "+" : ""}
        {r.points}
      </span>
      <span className="text-muted">
        <span className="font-semibold text-cream">{r.source}</span> · {r.text}
      </span>
    </li>
  );
}

function Note({ title, text, tone }: { title: string; text: string; tone?: "good" }) {
  return (
    <div className="card-edge rounded-2xl p-4">
      <p className={`text-xs font-semibold ${tone === "good" ? "text-gold-bright" : "text-muted"}`}>{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-cream">{text}</p>
    </div>
  );
}
