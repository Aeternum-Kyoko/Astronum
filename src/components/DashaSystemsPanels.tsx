"use client";

import SectionSkeleton from "@/components/SectionSkeleton";
import { useState } from "react";
import type { KundaliReport } from "@/lib/astrology/report";
import type { MahaInterpretation } from "@/lib/astrology/dashaInterpretation";
import { KARAKA_MEANING } from "@/lib/astrology/charaDasha";

// Report dates arrive from the API as ISO strings; wrap every one in new Date().
const monthYear = (d: Date | string) => new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short" });
const fullDate = (d: Date | string) => new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
const isNow = (s: Date | string, e: Date | string, now: Date) => new Date(s) <= now && now < new Date(e);
const TONE = { Supportive: "text-gold-bright", Mixed: "text-cream", Demanding: "text-rose" } as const;
const dms = (lon: number) => {
  const inSign = lon % 30;
  const d = Math.floor(inSign);
  const m = Math.floor((inSign - d) * 60);
  return `${d}°${String(m).padStart(2, "0")}′`;
};

function Missing() {
  return <SectionSkeleton />;
}

function H({ children }: { children: React.ReactNode }) {
  return <h4 className="text-xs font-semibold text-gold-bright">{children}</h4>;
}

// ——— Vimshottari in depth ——————————————————————————————————————————

export function VimshottariDetail({ report }: { report: KundaliReport | null }) {
  const now = report ? new Date(report.generatedAt) : new Date();
  const current = report?.dashaDetail?.findIndex((m) => isNow(m.start, m.end, now)) ?? -1;
  const [open, setOpen] = useState<number | null>(null);
  if (!report?.dashaDetail) return null;
  const shown = open ?? current;
  return (
    <section className="card-edge rounded-2xl p-6 md:col-span-2">
      <h3 className="text-xl font-bold text-gold-bright">Every Mahadasha, read in full</h3>
      <p className="mt-1 max-w-3xl text-sm text-muted">
        For each period: the lord&rsquo;s condition in your chart and why it matters, the houses it switches on, the yogas it carries, its effect on every area of life, and what to focus on. Open a period to read each Antardasha within it.
      </p>
      <ol className="mt-5 space-y-3">
        {report.dashaDetail.map((m, i) => (
          <MahaCard key={m.lord + m.start} m={m} open={shown === i} current={i === current} now={now} toggle={() => setOpen(shown === i ? -1 : i)} />
        ))}
      </ol>
    </section>
  );
}

function MahaCard({ m, open, current, now, toggle }: { m: MahaInterpretation; open: boolean; current: boolean; now: Date; toggle: () => void }) {
  const [antar, setAntar] = useState<number | null>(null);
  return (
    <li className={`rounded-xl border ${current ? "border-gold/60" : "border-border/70"}`}>
      <button type="button" onClick={toggle} aria-expanded={open} className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left">
        <span>
          <span className="text-lg font-bold text-cream">
            {m.lord} Mahadasha
            {current && <span className="ml-2 rounded-full bg-gold px-2 py-0.5 align-middle text-[10px] font-bold text-on-gold">Now</span>}
          </span>
          <span className="block text-xs text-muted">
            {monthYear(m.start)} – {monthYear(m.end)} · age {Math.floor(m.ageStart)}–{Math.floor(m.ageEnd)} · {Math.round(m.years)} years
          </span>
        </span>
        <span className={`text-sm font-semibold ${TONE[m.tone]}`}>{m.tone}</span>
      </button>
      {open && (
        <div className="space-y-5 border-t border-border px-4 pt-4 pb-5 text-sm leading-relaxed">
          <p className="text-cream">{m.overview}</p>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <H>The planet in your chart</H>
              <ul className="mt-1 space-y-1.5 text-muted">
                {m.condition.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
            <div>
              <H>What it switches on</H>
              <ul className="mt-1 space-y-1.5 text-muted">
                {m.lordship.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              {m.yogas.length > 0 && (
                <>
                  <div className="mt-3">
                    <H>Yogas that ripen in this period</H>
                  </div>
                  <ul className="mt-1 space-y-1.5 text-muted">
                    {m.yogas.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
          <div>
            <H>Effect on each area of life</H>
            <ul className="mt-2 grid gap-2 md:grid-cols-2">
              {m.areas.map((a) => (
                <li key={a.area} className="rounded-lg border border-border/60 p-3">
                  <span className={`font-semibold ${a.positive === true ? "text-gold-bright" : a.positive === false ? "text-rose" : "text-cream"}`}>{a.area}</span>
                  <span className="block text-muted">{a.effect}</span>
                </li>
              ))}
            </ul>
          </div>
          {m.sadeSati && <p className="rounded-lg border border-rose/40 bg-rose/5 p-3 text-cream">{m.sadeSati}</p>}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <H>Focus on</H>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-muted">
                {m.advice.focus.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <H>Avoid</H>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-muted">
                {m.advice.avoid.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <H>Remedies for {m.lord}</H>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-muted">
                {m.advice.remedies.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          </div>
          <div>
            <H>Antardashas within {m.lord}</H>
            <ol className="mt-2 space-y-2">
              {m.antars.map((a, i) => {
                const live = isNow(a.start, a.end, now);
                const o = antar === i || (antar === null && live);
                return (
                  <li key={a.lord + a.start} className={`rounded-lg border ${live ? "border-gold/60 bg-gold/5" : "border-border/60"}`}>
                    <button type="button" onClick={() => setAntar(o ? -1 : i)} aria-expanded={o} className="flex w-full flex-wrap items-baseline justify-between gap-2 p-3 text-left">
                      <span className="font-semibold text-cream">
                        {m.lord}–{a.lord}
                        {live && <span className="ml-2 text-xs text-gold-bright">running now</span>}
                        {a.events.length > 0 && <span className="ml-2 text-xs text-gold-bright">· {a.events.length} likely event{a.events.length > 1 ? "s" : ""}</span>}
                      </span>
                      <span className="font-tabular text-xs text-muted">
                        {fullDate(a.start)} – {fullDate(a.end)} · <span className={TONE[a.tone]}>{a.tone}</span>
                      </span>
                    </button>
                    {o && (
                      <div className="space-y-2 border-t border-border/60 px-3 pt-2 pb-3">
                        <p className="text-cream">{a.headline}.</p>
                        <ul className="space-y-1 text-muted">
                          {a.reasons.map((r) => (
                            <li key={r}>{r}</li>
                          ))}
                        </ul>
                        {a.events.length > 0 && (
                          <ul className="space-y-1">
                            {a.events.map((e) => (
                              <li key={e} className="text-gold-bright">
                                {e}
                              </li>
                            ))}
                          </ul>
                        )}
                        <ul className="space-y-1 text-muted">
                          {a.effects.map((e) => (
                            <li key={e}>{e}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}
    </li>
  );
}

// ——— Yogini ————————————————————————————————————————————————————————

export function YoginiPanel({ report }: { report: KundaliReport | null }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!report?.yogini) return <Missing />;
  const now = new Date(report.generatedAt);
  const current = report.yogini.findIndex((y) => isNow(y.start, y.end, now));
  const shown = open ?? current;
  const running = report.yogini[current];
  const sub = running?.subPeriods.find((s) => isNow(s.start, s.end, now));
  return (
    <div className="space-y-6">
      <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted">
        Yogini dasha runs eight Yoginis of 1 to 8 years — a 36-year cycle — starting from your birth nakshatra. Astrologers use it alongside Vimshottari to confirm timing: when both point to the same result, it is very likely.
      </p>
      {running && (
        <section className="card-edge rounded-2xl p-6">
          <p className="text-sm text-muted">Running now</p>
          <p className="mt-1 text-2xl font-bold text-cream">
            {running.yogini.name} ({running.yogini.lord}){sub && <span className="text-muted"> › {sub.yogini.name}</span>}
          </p>
          <p className={`mt-1 text-sm font-semibold ${running.yogini.nature === "Auspicious" ? "text-gold-bright" : running.yogini.nature === "Inauspicious" ? "text-rose" : "text-cream"}`}>{running.yogini.nature}</p>
          <p className="mt-2 text-sm text-muted">{running.yogini.meaning}</p>
          {sub && <p className="mt-2 text-sm text-muted">Sub-period {sub.yogini.name} ({sub.yogini.lord}): {sub.yogini.meaning}</p>}
        </section>
      )}
      <ol className="space-y-2">
        {report.yogini.map((y, i) => (
          <li key={y.yogini.name + y.start} className={`card-edge rounded-xl ${i === current ? "ring-1 ring-gold/60" : ""}`}>
            <button type="button" onClick={() => setOpen(shown === i ? -1 : i)} aria-expanded={shown === i} className="flex w-full flex-wrap items-center justify-between gap-2 p-4 text-left">
              <span>
                <span className="font-semibold text-cream">
                  {y.yogini.name} · {y.yogini.lord}
                </span>
                <span className="block text-xs text-muted">
                  {monthYear(y.start)} – {monthYear(y.end)} · {y.yogini.years} year{y.yogini.years > 1 ? "s" : ""}
                </span>
              </span>
              <span className={`text-sm font-semibold ${y.yogini.nature === "Auspicious" ? "text-gold-bright" : y.yogini.nature === "Inauspicious" ? "text-rose" : "text-cream"}`}>{y.yogini.nature}</span>
            </button>
            {shown === i && (
              <div className="border-t border-border px-4 pt-3 pb-4 text-sm">
                <p className="text-muted">{y.yogini.meaning}</p>
                <ul className="mt-3 divide-y divide-border/50">
                  {y.subPeriods.map((s) => (
                    <li key={s.yogini.name + s.start} className={`flex flex-wrap justify-between gap-2 py-1.5 ${isNow(s.start, s.end, now) ? "text-gold-bright" : "text-muted"}`}>
                      <span>
                        {y.yogini.name} › {s.yogini.name} ({s.yogini.lord}) — {s.yogini.nature.toLowerCase()}
                      </span>
                      <span className="font-tabular">
                        {fullDate(s.start)} – {fullDate(s.end)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

// ——— Chara (Jaimini) ——————————————————————————————————————————————

export function CharaPanel({ report }: { report: KundaliReport | null }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!report?.chara) return <Missing />;
  const now = new Date(report.generatedAt);
  const current = report.chara.periods.findIndex((p) => isNow(p.start, p.end, now));
  const shown = open ?? current;
  return (
    <div className="space-y-6">
      <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted">
        Jaimini&rsquo;s Chara dasha runs by sign rather than planet, starting from your Lagna. Each sign&rsquo;s period is read from its house, the planets in it, and the Chara karakas that sit in or aspect it.
      </p>
      <section className="card-edge overflow-x-auto rounded-2xl p-6">
        <h3 className="text-lg font-bold text-cream">Your Chara karakas</h3>
        <p className="mt-1 text-sm text-muted">The seven planets ranked by degree within their sign. Each becomes the significator of one area of life.</p>
        <table className="mt-3 w-full min-w-[32rem] text-left text-sm">
          <thead className="text-xs text-muted">
            <tr className="border-b border-border">
              <th className="py-2 pr-3">Karaka</th>
              <th className="py-2 pr-3">Planet</th>
              <th className="py-2 pr-3">Degree</th>
              <th className="py-2 pr-3">House</th>
              <th className="py-2">Signifies</th>
            </tr>
          </thead>
          <tbody>
            {report.chara.karakas.map((k) => (
              <tr key={k.karaka} className="border-b border-border/50 last:border-0">
                <td className="py-2 pr-3 font-semibold text-cream">{k.karaka}</td>
                <td className="py-2 pr-3 text-cream">{k.planet}</td>
                <td className="font-tabular py-2 pr-3 text-muted">{k.degree.toFixed(2)}°</td>
                <td className="py-2 pr-3 text-muted">{k.house}</td>
                <td className="py-2 text-muted">{KARAKA_MEANING[k.karaka]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <ol className="space-y-2">
        {report.chara.periods.map((p, i) => (
          <li key={p.sign + p.start} className={`card-edge rounded-xl ${i === current ? "ring-1 ring-gold/60" : ""}`}>
            <button type="button" onClick={() => setOpen(shown === i ? -1 : i)} aria-expanded={shown === i} className="flex w-full flex-wrap items-center justify-between gap-2 p-4 text-left">
              <span>
                <span className="font-semibold text-cream">
                  {p.sign} Chara dasha
                  {i === current && <span className="ml-2 rounded-full bg-gold px-2 py-0.5 align-middle text-[10px] font-bold text-on-gold">Now</span>}
                </span>
                <span className="block text-xs text-muted">
                  {monthYear(p.start)} – {monthYear(p.end)} · {p.years} years · your {p.house}
                  {p.house === 1 ? "st" : p.house === 2 ? "nd" : p.house === 3 ? "rd" : "th"} house
                </span>
              </span>
            </button>
            {shown === i && (
              <div className="border-t border-border px-4 pt-3 pb-4 text-sm">
                <ul className="space-y-1.5 text-muted">
                  {p.reading.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
                <p className="mt-3 text-xs font-semibold text-gold-bright">Sub-periods (antardashas)</p>
                <ul className="mt-1 grid gap-x-6 sm:grid-cols-2">
                  {p.subPeriods.map((s) => (
                    <li key={s.sign + s.start} className={`flex justify-between gap-2 py-1 text-xs ${isNow(s.start, s.end, now) ? "text-gold-bright" : "text-muted"}`}>
                      <span>{s.sign}</span>
                      <span className="font-tabular">
                        {monthYear(s.start)} – {monthYear(s.end)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

// ——— KP ——————————————————————————————————————————————————————————

export function KpPanel({ report }: { report: KundaliReport | null }) {
  if (!report?.kp) return <Missing />;
  const kp = report.kp;
  return (
    <div className="space-y-6">
      <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted">
        Krishnamurti Paddhati uses Placidus house cusps and divides every star into nine sub-portions. The sub lord of a house cusp decides whether that house&rsquo;s matters are promised; planets deliver results through the houses their star lords occupy and own. KP ayanamsa {kp.ayanamsa.toFixed(2)}°.
      </p>

      <section className="card-edge rounded-2xl p-6">
        <h3 className="text-lg font-bold text-cream">What your cusps promise</h3>
        <p className="mt-1 text-sm text-muted">The core KP judgement: which houses the sub lord of each key cusp signifies.</p>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {kp.promises.map((p) => (
            <li key={p.event} className="rounded-xl border border-border/70 p-4 text-sm">
              <p className="flex justify-between gap-2">
                <span className="font-semibold text-cream">{p.event}</span>
                <span className={`font-semibold ${p.verdict === "Promised" ? "text-gold-bright" : p.verdict === "Weak promise" ? "text-rose" : "text-cream"}`}>{p.verdict}</span>
              </p>
              <p className="mt-1 text-muted">{p.reason}</p>
              <p className="mt-1 text-xs text-muted">
                Gives it: {p.favourable.join(", ")} · denies or delays it: {p.negating.join(", ")}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <Table
        title="House cusps (Placidus)"
        head={["Cusp", "Sign", "Degree", "Sign lord", "Star lord", "Sub lord", "Sub-sub"]}
        rows={kp.cusps.map((c) => [String(c.house), c.sign, dms(c.longitude), c.signLord, c.starLord, c.subLord, c.subSubLord])}
      />
      <section className="card-edge overflow-x-auto rounded-2xl p-6">
        <h3 className="text-lg font-bold text-cream">Planets and what they signify</h3>
        <p className="mt-1 text-sm text-muted">Houses in gold come through the planet&rsquo;s star lord — its strongest results. The rest come from the planet itself.</p>
        <table className="mt-3 w-full min-w-[40rem] text-left text-sm">
          <thead className="text-xs text-muted">
            <tr className="border-b border-border">
              {["Planet", "KP house", "Sign · degree", "Star lord", "Sub lord", "Sub-sub", "Signifies houses"].map((h) => (
                <th key={h} className="py-2 pr-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {kp.planets.map((p) => (
              <tr key={p.planet} className="border-b border-border/50 last:border-0">
                <td className="py-2 pr-3 font-semibold text-cream">
                  {p.planet}
                  {p.retrograde && p.planet !== "Rahu" && p.planet !== "Ketu" && <span className="ml-1 text-xs text-rose">R</span>}
                </td>
                <td className="py-2 pr-3 text-cream">{p.house}</td>
                <td className="font-tabular py-2 pr-3 text-muted">
                  {p.sign} {dms(p.longitude)}
                </td>
                <td className="py-2 pr-3 text-muted">{p.starLord}</td>
                <td className="py-2 pr-3 text-muted">{p.subLord}</td>
                <td className="py-2 pr-3 text-muted">{p.subSubLord}</td>
                <td className="py-2">
                  <span className="font-semibold text-gold-bright">{p.levels.star.join(", ")}</span>
                  {p.levels.own.length > 0 && <span className="text-muted">, {p.levels.own.join(", ")}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="card-edge overflow-x-auto rounded-2xl p-6">
        <h3 className="text-lg font-bold text-cream">House significators</h3>
        <p className="mt-1 text-sm text-muted">Strongest first: A — planets in the star of the occupants; B — occupants; C — planets in the star of the cusp&rsquo;s lord; D — the cusp&rsquo;s lord.</p>
        <table className="mt-3 w-full min-w-[34rem] text-left text-sm">
          <thead className="text-xs text-muted">
            <tr className="border-b border-border">
              {["House", "A", "B", "C", "D"].map((h) => (
                <th key={h} className="py-2 pr-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {kp.houseSignificators.map((h) => (
              <tr key={h.house} className="border-b border-border/50 last:border-0">
                <td className="py-2 pr-3 font-semibold text-cream">{h.house}</td>
                {[h.a, h.b, h.c, h.d].map((xs, i) => (
                  <td key={i} className="py-2 pr-3 text-muted">
                    {xs.join(", ") || "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="card-edge rounded-2xl p-6">
        <h3 className="text-lg font-bold text-cream">Ruling planets now</h3>
        <p className="mt-1 text-sm text-muted">The planets ruling this moment at your birth place ({fullDate(kp.rulingPlanets.at)}). KP uses them to confirm which dasha periods will deliver an event and to answer questions.</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {kp.rulingPlanets.list.map((r) => (
            <li key={r.role} className="rounded-lg border border-border/60 px-3 py-2 text-sm">
              <span className="block text-xs text-muted">{r.role}</span>
              <span className={`font-semibold ${kp.rulingPlanets.strongest.includes(r.planet) ? "text-gold-bright" : "text-cream"}`}>{r.planet}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted">Strongest now: {kp.rulingPlanets.strongest.join(", ")} (repeated most often).</p>
      </section>
    </div>
  );
}

function Table({ title, head, rows }: { title: string; head: string[]; rows: string[][] }) {
  return (
    <section className="card-edge overflow-x-auto rounded-2xl p-6">
      <h3 className="text-lg font-bold text-cream">{title}</h3>
      <table className="mt-3 w-full min-w-[34rem] text-left text-sm">
        <thead className="text-xs text-muted">
          <tr className="border-b border-border">
            {head.map((h) => (
              <th key={h} className="py-2 pr-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]} className="border-b border-border/50 last:border-0">
              {r.map((c, i) => (
                <td key={i} className={`font-tabular py-2 pr-3 ${i === 0 ? "font-semibold text-cream" : "text-muted"}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

// ——— Life sectors ——————————————————————————————————————————————————

export function LifeSectorsPanel({ report }: { report: KundaliReport | null }) {
  const [key, setKey] = useState("career");
  if (!report?.sectors) return <Missing />;
  const s = report.sectors.find((x) => x.key === key) ?? report.sectors[0];
  const vClass = s.verdict === "Strong" ? "text-gold-bright" : s.verdict === "Needs effort" ? "text-rose" : "text-cream";
  return (
    <div className="space-y-6">
      <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted">
        Each area of your life as your kundli describes it — what the chart promises and why, what is specific to you, and how it develops through every stage of life.
      </p>
      <nav aria-label="Life sector" className="flex flex-wrap justify-center gap-1.5">
        {report.sectors.map((x) => (
          <button
            key={x.key}
            type="button"
            onClick={() => setKey(x.key)}
            aria-pressed={x.key === s.key}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${x.key === s.key ? "border-gold bg-gold text-on-gold" : "border-border text-muted hover:border-gold hover:text-cream"}`}
          >
            {x.title.split(" & ")[0].split(",")[0]}
          </button>
        ))}
      </nav>

      <section className="card-edge rounded-2xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="text-2xl font-bold text-cream">{s.title}</h3>
          <span className="text-right">
            <span className={`block text-lg font-bold ${vClass}`}>{s.verdict}</span>
            <span className="text-xs text-muted">{s.score}/100</span>
          </span>
        </div>
        <p className="mt-2 text-cream">{s.promise}</p>
        <ul className="mt-3 space-y-1.5 text-sm text-muted">
          {s.traits.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer font-semibold text-gold-bright">Why this verdict</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
            {s.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </details>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {s.peak && (
            <p className="rounded-lg border border-gold/40 bg-gold/5 p-3 text-sm">
              <span className="font-semibold text-gold-bright">Best window: </span>
              <span className="text-cream">{s.peak}</span>
            </p>
          )}
          {s.caution && (
            <p className="rounded-lg border border-rose/40 bg-rose/5 p-3 text-sm">
              <span className="font-semibold text-rose">Go carefully: </span>
              <span className="text-cream">{s.caution}</span>
            </p>
          )}
        </div>
      </section>

      <section className="card-edge rounded-2xl p-6">
        <h3 className="text-lg font-bold text-cream">How it develops with age</h3>
        <ol className="mt-4 space-y-4 border-l border-border pl-5">
          {s.stages.map((st) => (
            <li key={st.label} className="relative">
              <span className={`absolute top-1.5 -left-[25px] h-2.5 w-2.5 rounded-full ${st.tone === "Supportive" ? "bg-gold" : st.tone === "Demanding" ? "bg-rose" : st.tone ? "bg-cream" : "bg-border"}`} aria-hidden="true" />
              <p className="text-sm font-semibold text-cream">
                {st.label} <span className="font-tabular text-muted">· ages {st.ages[0]}–{st.ages[1]}</span>
                {st.tone && <span className={`ml-2 text-xs ${TONE[st.tone]}`}>{st.tone}</span>}
              </p>
              <p className="mt-1 text-sm text-muted">{st.text}</p>
              {st.windows.length > 0 && (
                <ul className="mt-1.5 space-y-1 text-sm">
                  {st.windows.map((w) => (
                    <li key={w.label + w.ages}>
                      <span className={`font-semibold ${w.label.includes("·") ? "text-gold-bright" : "text-cream"}`}>{w.label}</span>
                      <span className="text-muted">
                        {" "}
                        (age {w.ages}) — {w.why}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="card-edge rounded-2xl p-6">
        <h3 className="text-lg font-bold text-cream">Guidance</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
          {s.advice.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
