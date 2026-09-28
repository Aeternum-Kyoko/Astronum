"use client";

import SectionSkeleton from "@/components/SectionSkeleton";
import { useState } from "react";
import type { KundaliReport } from "@/lib/astrology/report";
import type { HouseReading } from "@/lib/astrology/houseReadings";
import type { EventTheme, LifeEvent, TimelineMaha, TimelineYear, Tone } from "@/lib/astrology/lifeTimeline";
import type { EvidenceLayer } from "@/lib/astrology/lifeEvents";

// Report dates arrive from the API as ISO strings; wrap every one in new Date().
const monthYear = (d: Date | string) => new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short" });
const ordinal = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
const ageLabel = (a: number) => (a < 1 ? `${Math.max(0, Math.round(a * 12))} mo` : `${Math.floor(a)}`);

function Missing() {
  return <SectionSkeleton />;
}

const VERDICT_CLASS = { Strong: "text-gold-bright", Balanced: "text-cream", Weak: "text-rose" } as const;

// ——— Houses ————————————————————————————————————————————————————————

export function HousesPanel({ report }: { report: KundaliReport | null }) {
  const [open, setOpen] = useState<number | null>(1);
  if (!report?.houses) return <Missing />;
  return (
    <div className="space-y-4">
      <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted">
        All twelve bhavas, one by one. Each is judged from its lord and where it sits, the planets inside it, the planets aspecting it, its Ashtakavarga bindus and its natural significator — with the periods that bring it alive.
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-12" aria-label="House strength at a glance">
        {report.houses.map((h) => (
          <button
            key={h.house}
            type="button"
            onClick={() => setOpen(h.house)}
            aria-pressed={open === h.house}
            className={`rounded-xl border px-2 py-2 text-center ${open === h.house ? "border-gold bg-gold/10" : "border-border hover:border-gold"}`}
          >
            <span className="block text-sm font-bold text-cream">{ordinal(h.house)}</span>
            <span className={`block text-[11px] font-semibold ${VERDICT_CLASS[h.strength.verdict]}`}>{h.strength.score}</span>
          </button>
        ))}
      </div>
      <ul className="space-y-3">
        {report.houses.map((h) => (
          <HouseItem key={h.house} h={h} open={open === h.house} toggle={() => setOpen(open === h.house ? null : h.house)} />
        ))}
      </ul>
    </div>
  );
}

function HouseItem({ h, open, toggle }: { h: HouseReading; open: boolean; toggle: () => void }) {
  return (
    <li className="card-edge rounded-2xl">
      <button type="button" onClick={toggle} aria-expanded={open} className="flex w-full flex-wrap items-center justify-between gap-3 p-5 text-left">
        <span>
          <span className="text-lg font-bold text-cream">
            {ordinal(h.house)} house · {h.sanskrit}
          </span>
          <span className="block text-sm text-muted">
            {h.themes} · {h.sign} · lord {h.lord} in the {ordinal(h.lordHouse)}
          </span>
        </span>
        <span className={`text-sm font-semibold ${VERDICT_CLASS[h.strength.verdict]}`}>
          {h.strength.verdict} · {h.strength.score}/100
        </span>
      </button>
      {open && (
        <div className="space-y-4 border-t border-border px-5 pt-4 pb-6 text-sm leading-relaxed">
          <p className="font-medium text-cream">{h.summary}</p>
          <Block title="The lord and where it sits">{h.lordText}</Block>
          <Block title="Planets in this house">
            {h.occupants.length ? (
              <ul className="space-y-1.5">
                {h.occupants.map((o) => (
                  <li key={o.planet}>
                    <span className="font-semibold text-cream">{o.planet}:</span> {o.text} {o.note}
                  </li>
                ))}
              </ul>
            ) : (
              "No planet sits here; its lord carries its results."
            )}
          </Block>
          <Block title="Aspects on this house">{h.aspectText}</Block>
          <Block title="Natural significator">
            {h.karakas.map((k, i) => (
              <span key={i} className="block">
                {k.text}
              </span>
            ))}
          </Block>
          <div className="grid gap-4 md:grid-cols-2">
            <Block title="Ashtakavarga">{h.savText}</Block>
            <Block title="Body areas">{h.body[0].toUpperCase() + h.body.slice(1)}.</Block>
          </div>
          <Block title="Why this strength">{h.strength.rationale[0].toUpperCase() + h.strength.rationale.slice(1)}</Block>
          <p className="text-xs text-muted">Classification: {h.classification.join(", ")}</p>
          {h.periods.length > 0 && (
            <Block title="When it comes alive">
              <ul className="space-y-1">
                {h.periods.map((p) => (
                  <li key={p.label + p.start}>
                    <span className="font-semibold text-cream">{p.label}</span> · {monthYear(p.start)} – {monthYear(p.end)} · {p.why}
                  </li>
                ))}
              </ul>
            </Block>
          )}
        </div>
      )}
    </li>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-cream">{title}</h4>
      <div className="mt-1 text-muted">{children}</div>
    </div>
  );
}

// ——— Career ————————————————————————————————————————————————————————

export function CareerPanel({ report }: { report: KundaliReport | null }) {
  if (!report?.career) return <Missing />;
  const c = report.career;
  const max = Math.max(...c.influences.map((i) => i.weight));
  return (
    <div className="space-y-6">
      <section className="card-edge rounded-2xl p-6">
        <h3 className="text-xl font-bold text-cream">Your career in brief</h3>
        <dl className="mt-4 grid gap-3 sm:grid-cols-4">
          <Stat label="10th house" value={`${c.tenth.sign} · lord ${c.tenth.lord}`} />
          <Stat label="Amatyakaraka" value={c.amatyakaraka} />
          <Stat label="D10 ascendant" value={c.d10?.ascendant ?? "—"} />
          <Stat label="Better suited to" value={c.mode.verdict === "Either" ? "Job or business" : c.mode.verdict} />
        </dl>
        <p className="mt-4 text-sm text-muted">{c.signStyle}</p>
      </section>

      <section className="card-edge rounded-2xl p-6">
        <h3 className="text-lg font-bold text-cream">Fields that suit you</h3>
        <p className="mt-1 text-sm text-muted">Ranked by how strongly each planet connects to your career houses and charts.</p>
        <ol className="mt-4 grid gap-4 md:grid-cols-3">
          {c.fields.map((f, i) => (
            <li key={f.planet} className="rounded-xl border border-border/70 p-4">
              <p className="text-sm font-semibold text-gold-bright">
                {i + 1}. Through {f.planet}
              </p>
              <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-cream">
                {f.fields.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted">Why: {f.why}</p>
            </li>
          ))}
        </ol>
        <h4 className="mt-6 text-xs font-semibold text-cream">Every planet&rsquo;s pull on your career</h4>
        <ul className="mt-2 space-y-2">
          {c.influences.map((i) => (
            <li key={i.planet} className="grid grid-cols-[5rem_1fr] items-center gap-3 text-sm">
              <span className="font-semibold text-cream">{i.planet}</span>
              <span>
                <span className="block h-2 rounded-full bg-gold" style={{ width: `${(i.weight / max) * 100}%` }} aria-hidden="true" />
                <span className="text-xs text-muted">
                  {i.weight} pts — {i.why.join(", ")}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card-edge rounded-2xl p-6">
          <h3 className="text-lg font-bold text-cream">The 10th house</h3>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
            {c.tenth.text.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
        <section className="card-edge rounded-2xl p-6">
          <h3 className="text-lg font-bold text-cream">Dasamsa (D10) and Amatyakaraka</h3>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
            {c.d10?.text.map((t) => (
              <li key={t}>{t}</li>
            ))}
            <li>{c.amatyaText}</li>
            <li>
              Your Atmakaraka (the soul&rsquo;s planet, highest degree) is {c.atmakaraka} — the work that feels meaningful to you carries its colour.
            </li>
          </ul>
        </section>
      </div>

      <section className="card-edge rounded-2xl p-6">
        <h3 className="text-lg font-bold text-cream">Job or business?</h3>
        <div className="mt-3 grid max-w-md grid-cols-2 gap-3 text-sm">
          <Stat label="Employment score" value={String(c.mode.jobScore)} />
          <Stat label="Business score" value={String(c.mode.businessScore)} />
        </div>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
          {c.mode.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>

      <section className="card-edge rounded-2xl p-6">
        <h3 className="text-lg font-bold text-cream">Career timing ahead</h3>
        <p className="mt-1 text-sm text-muted">Sub-periods run by a career planet. &ldquo;Rise&rdquo; periods also involve the lords of gains or fortune; &ldquo;Change&rdquo; periods bring moves and new directions.</p>
        <ul className="mt-4 divide-y divide-border/60">
          {c.periods.map((p) => (
            <li key={p.label + p.start} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5 text-sm">
              <span>
                <span className="font-semibold text-cream">{p.label}</span> <span className="text-muted">— {p.why}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="font-tabular text-muted">
                  {monthYear(p.start)} – {monthYear(p.end)}
                </span>
                <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${p.kind === "Rise" ? "border-gold/50 text-gold-bright" : p.kind === "Change" ? "border-rose/50 text-rose" : "border-border text-muted"}`}>
                  {p.kind}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 px-4 py-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 font-semibold text-cream">{value}</dd>
    </div>
  );
}

// ——— Life timeline ————————————————————————————————————————————————

const THEME_ICON: Record<EventTheme, string> = {
  education: "Study",
  career: "Career",
  jobChange: "Job change",
  recognition: "Recognition",
  marriage: "Marriage",
  romance: "Romance",
  children: "Children",
  property: "Property",
  relocation: "Moving home",
  travel: "Abroad",
  wealth: "Wealth",
  loss: "Money caution",
  health: "Health",
  spiritual: "Spiritual",
};
const TONE_CLASS: Record<Tone, string> = { Supportive: "text-gold-bright", Mixed: "text-cream", Demanding: "text-rose" };
const ALL_THEMES = Object.keys(THEME_ICON) as EventTheme[];
const LAYER_CLASS: Record<EvidenceLayer, string> = {
  Dasha: "border-gold/50 text-gold-bright",
  Chart: "border-cream/40 text-cream",
  Transit: "border-gold/50 text-gold-bright",
  Ashtakavarga: "border-cream/40 text-cream",
  Yogini: "border-border text-muted",
  Chara: "border-border text-muted",
  KP: "border-border text-muted",
  Yoga: "border-gold/50 text-gold-bright",
  Age: "border-rose/40 text-rose",
};
const LEVEL_CLASS = { Strong: "bg-gold text-on-gold", Likely: "border border-gold/60 text-gold-bright", Possible: "border border-border text-muted" } as const;

export function TimelinePanel({ report }: { report: KundaliReport | null }) {
  const [filter, setFilter] = useState<EventTheme | "all">("all");
  const [view, setView] = useState<"dasha" | "years">("dasha");
  const [openMaha, setOpenMaha] = useState<number | null>(null);
  const [allYears, setAllYears] = useState(false);
  if (!report?.timeline) return <Missing />;
  const now = new Date(report.generatedAt);
  const t = report.timeline;
  const currentIdx = t.mahas.findIndex((m) => new Date(m.start) <= now && now < new Date(m.end));
  const shownMaha = openMaha ?? currentIdx;
  const currentYear = t.years.findIndex((y) => new Date(y.start) <= now && now < new Date(y.end));
  const years = allYears ? t.years : t.years.slice(Math.max(0, currentYear), Math.max(0, currentYear) + 12);
  const keys = t.keyWindows.filter((k) => filter === "all" || k.kind === filter);

  return (
    <div className="space-y-6">
      <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted">
        Your life by age. Every event is tested against seven independent techniques — the dasha lords, the divisional chart, month-by-month transits, Ashtakavarga, Yogini dasha, Chara dasha and KP — and the confidence shows how many of them agree. Tendencies to plan around, not certainties.
      </p>

      {t.keyWindows.length > 0 && (
        <section className="card-edge rounded-2xl p-6">
          <h3 className="text-lg font-bold text-cream">Key windows of your life</h3>
          <p className="mt-1 text-sm text-muted">The single most likely period for each kind of event.</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {keys.map((k) => (
              <li key={k.kind} className={`rounded-xl border p-4 ${k.nature === "caution" ? "border-rose/40" : "border-border/70"}`}>
                <p className="flex items-start justify-between gap-2">
                  <span className={`text-sm font-semibold ${k.nature === "caution" ? "text-rose" : "text-cream"}`}>{THEME_ICON[k.kind]}</span>
                  <span className="font-tabular text-sm font-bold text-gold-bright">{k.confidence}%</span>
                </p>
                <span className="mt-2 block h-1.5 rounded-full bg-border" aria-hidden="true">
                  <span className={`block h-1.5 rounded-full ${k.nature === "caution" ? "bg-rose" : "bg-gold"}`} style={{ width: `${k.confidence}%` }} />
                </span>
                <p className="mt-2 text-sm text-cream">
                  Age {k.ages} · {monthYear(k.start)} – {monthYear(k.end)}
                </p>
                <p className="text-xs text-muted">{k.dasha} period</p>
                {k.peak && (
                  <p className="mt-1 text-xs text-gold-bright">
                    Peak: {monthYear(k.peak.start)} – {monthYear(k.peak.end)} ({k.peak.why})
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-col items-center gap-3">
        <div className="inline-flex gap-1 rounded-full border border-border bg-ink-deep/80 p-1" role="group" aria-label="Timeline view">
          {(["dasha", "years"] as const).map((v) => (
            <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v} className={`rounded-full px-4 py-1.5 text-xs font-semibold ${view === v ? "bg-gold text-on-gold" : "text-muted hover:text-cream"}`}>
              {v === "dasha" ? "By dasha period" : "Year by year"}
            </button>
          ))}
        </div>
        <nav aria-label="Filter by theme" className="flex flex-wrap justify-center gap-1.5">
          {(["all", ...ALL_THEMES] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              aria-pressed={filter === k}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${filter === k ? "border-gold bg-gold text-on-gold" : "border-border text-muted hover:border-gold hover:text-cream"}`}
            >
              {k === "all" ? "All themes" : THEME_ICON[k]}
            </button>
          ))}
        </nav>
      </div>

      {view === "dasha" ? (
        <ol className="space-y-3">
          {t.mahas.map((m, i) => (
            <MahaItem key={m.lord + m.start} m={m} open={shownMaha === i} current={i === currentIdx} now={now} filter={filter} toggle={() => setOpenMaha(shownMaha === i ? -1 : i)} />
          ))}
        </ol>
      ) : (
        <section className="card-edge rounded-2xl p-6">
          <h3 className="text-lg font-bold text-cream">Year by year</h3>
          <p className="mt-1 text-sm text-muted">Birthday to birthday: the running periods, where Jupiter and Saturn are from your Lagna and Moon, Sade Sati, and the year&rsquo;s likely events.</p>
          <ol className="mt-4 divide-y divide-border/60">
            {years
              .filter((y) => filter === "all" || y.highlights.some((h) => h.kind === filter))
              .map((y) => (
                <YearRow key={y.age} y={y} current={t.years[currentYear]?.age === y.age} />
              ))}
          </ol>
          <button type="button" onClick={() => setAllYears(!allYears)} className="mt-4 text-sm font-semibold text-gold-bright hover:underline">
            {allYears ? "Show the next 12 years only" : "Show every year, birth to 90"}
          </button>
        </section>
      )}

      <section className="card-edge rounded-2xl p-6">
        <h3 className="text-lg font-bold text-cream">Milestones by age</h3>
        <p className="mt-1 text-sm text-muted">Fixed turning points: slow-planet returns, Sade Sati and the ages at which each planet classically matures.</p>
        <ol className="mt-4 divide-y divide-border/60">
          {t.milestones.map((ms) => (
            <li key={ms.label + ms.date} className={`grid gap-1 py-2.5 text-sm sm:grid-cols-[5rem_12rem_1fr] ${new Date(ms.date) < now ? "text-muted" : ""}`}>
              <span className="font-tabular font-semibold text-gold-bright">Age {Math.round(ms.age)}</span>
              <span className="font-semibold text-cream">{ms.label}</span>
              <span className="text-muted">
                {ms.text} <span className="text-xs">({monthYear(ms.date)})</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="card-edge rounded-2xl p-6">
        <h3 className="text-lg font-bold text-cream">How each event is judged</h3>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-muted">
          <li><span className="font-semibold text-cream">Dasha</span> — the Mahadasha and Antardasha lords must signify the event&rsquo;s houses: through their star lord (strongest), their own placement and lordship, or their aspects. Houses that deny the event count against it.</li>
          <li><span className="font-semibold text-cream">Divisional chart</span> — the event&rsquo;s varga (D9 marriage, D10 career, D7 children, D4 property, D24 education, D30 health) must link the running lords to its key house.</li>
          <li><span className="font-semibold text-cream">Transit</span> — checked month by month: Jupiter and Saturn together on the event house or its lord (the double transit).</li>
          <li><span className="font-semibold text-cream">Ashtakavarga</span> — transits through signs with many bindus deliver; weak signs dampen.</li>
          <li><span className="font-semibold text-cream">Yogini and Chara dasha</span> — two independent dasha systems; agreement raises confidence.</li>
          <li><span className="font-semibold text-cream">KP</span> — the event&rsquo;s cusp sub lord must promise it; a weak promise lowers every window.</li>
          <li><span className="font-semibold text-cream">Age and natal strength</span> — events outside their usual age and houses that are weak at birth are weighted down; Raj and Dhan yogas activated by the running lords add weight.</li>
        </ol>
        <p className="mt-3 text-sm text-muted">The peak months come from the Pratyantardasha that signifies the event most, overlapping the best transit months.</p>
      </section>
    </div>
  );
}

function YearRow({ y, current }: { y: TimelineYear; current: boolean }) {
  const [open, setOpen] = useState(current);
  return (
    <li className={`py-3 ${current ? "-mx-3 rounded-xl bg-gold/5 px-3" : ""}`}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full flex-wrap items-center justify-between gap-2 text-left">
        <span className="flex flex-wrap items-baseline gap-x-3">
          <span className="font-tabular font-semibold text-gold-bright">Age {y.age}</span>
          <span className="text-sm text-muted">
            {monthYear(y.start)} – {monthYear(y.end)}
          </span>
          <span className="text-sm text-cream">{y.dasha}</span>
          {current && <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-on-gold">This year</span>}
        </span>
        <span className="flex items-center gap-2">
          {y.saturnPhase && <span className="rounded-full border border-rose/40 px-2 py-0.5 text-[11px] text-rose">{y.saturnPhase}</span>}
          <span className="tracking-wider" role="img" aria-label={`${y.rating} out of 5`}>
            <span className="text-gold-bright">{"★".repeat(y.rating)}</span>
            <span className="text-border">{"★".repeat(5 - y.rating)}</span>
          </span>
        </span>
      </button>
      {y.highlights.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {y.highlights.map((h) => (
            <li key={h.label} className={`rounded-full border px-2.5 py-0.5 text-xs ${h.nature === "caution" ? "border-rose/40 text-rose" : "border-gold/40 text-gold-bright"}`}>
              {h.label} · {h.confidence}%
            </li>
          ))}
        </ul>
      )}
      {open && (
        <ul className="mt-2 space-y-1 text-sm text-muted">
          {y.text.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      )}
    </li>
  );
}

function MahaItem({ m, open, current, now, filter, toggle }: { m: TimelineMaha; open: boolean; current: boolean; now: Date; filter: EventTheme | "all"; toggle: () => void }) {
  const antars = m.antars.filter((a) => filter === "all" || a.events.some((e) => e.kind === filter));
  const count = m.antars.reduce((n, a) => n + a.events.filter((e) => filter === "all" || e.kind === filter).length, 0);
  return (
    <li className={`card-edge rounded-2xl ${current ? "ring-1 ring-gold/60" : ""}`}>
      <button type="button" onClick={toggle} aria-expanded={open} className="flex w-full flex-wrap items-center justify-between gap-3 p-5 text-left">
        <span>
          <span className="font-tabular text-sm text-gold-bright">
            Age {ageLabel(m.ageStart)}–{ageLabel(m.ageEnd)}
          </span>
          <span className="block text-lg font-bold text-cream">
            {m.lord} Mahadasha
            {current && <span className="ml-2 rounded-full bg-gold px-2 py-0.5 align-middle text-[10px] font-bold text-on-gold">Now</span>}
          </span>
          <span className="text-xs text-muted">
            {monthYear(m.start)} – {monthYear(m.end)}
          </span>
        </span>
        <span className="text-right text-sm">
          <span className={`block font-semibold ${TONE_CLASS[m.tone]}`}>{m.tone}</span>
          <span className="text-xs text-muted">
            {count} likely event{count === 1 ? "" : "s"}
          </span>
        </span>
      </button>
      {open && (
        <div className="border-t border-border px-5 pt-4 pb-5">
          <p className="text-sm leading-relaxed text-muted">{m.summary}</p>
          {antars.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No sub-period here clearly points to this theme.</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {antars.map((a) => {
                const live = new Date(a.start) <= now && now < new Date(a.end);
                const events = a.events.filter((e) => filter === "all" || e.kind === filter);
                return (
                  <li key={a.lord + a.start} className={`rounded-xl border p-4 ${live ? "border-gold/60 bg-gold/5" : "border-border/70"}`}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-semibold text-cream">
                        {m.lord}–{a.lord}
                        {live && <span className="ml-2 text-xs text-gold-bright">running now</span>}
                      </p>
                      <p className="font-tabular text-xs text-muted">
                        Age {ageLabel(a.ageStart)}–{ageLabel(a.ageEnd)} · {monthYear(a.start)} – {monthYear(a.end)} · <span className={TONE_CLASS[a.tone]}>{a.tone}</span>
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {a.note} Houses active: {a.houses.map(ordinal).join(", ")}.
                    </p>
                    {events.length > 0 && (
                      <ul className="mt-3 space-y-3">
                        {events.map((e) => (
                          <EventCard key={e.kind} e={e} />
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
    </li>
  );
}

function EventCard({ e }: { e: LifeEvent }) {
  const [open, setOpen] = useState(false);
  return (
    <li className={`rounded-lg border p-3 ${e.nature === "caution" ? "border-rose/40" : "border-border/60"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`text-sm font-semibold ${e.nature === "caution" ? "text-rose" : "text-gold-bright"}`}>{e.label}</span>
        <span className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${LEVEL_CLASS[e.level]}`}>{e.level}</span>
          <span className="font-tabular text-sm font-bold text-cream">{e.confidence}%</span>
        </span>
      </div>
      {e.peak && (
        <p className="mt-1 text-xs text-cream">
          Peak: {monthYear(e.peak.start)} – {monthYear(e.peak.end)} <span className="text-muted">({e.peak.why})</span>
        </p>
      )}
      <ul className="mt-2 flex flex-wrap gap-1" aria-label="Agreeing techniques">
        {[...new Set(e.evidence.filter((x) => x.points > 0).map((x) => x.layer))].map((l) => (
          <li key={l} className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${LAYER_CLASS[l]}`}>
            {l}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted">{e.advice}</p>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="mt-1 text-xs font-semibold text-gold-bright hover:underline">
        {open ? "Hide the evidence" : "Show the evidence"}
      </button>
      {open && (
        <ul className="mt-2 space-y-1 text-xs">
          {e.evidence.map((x, i) => (
            <li key={i} className="flex gap-2">
              <span className={`shrink-0 font-tabular font-semibold ${x.points > 0 ? "text-gold-bright" : "text-rose"}`}>
                {x.points > 0 ? "+" : ""}
                {x.points}
              </span>
              <span className="text-muted">
                <span className="font-semibold text-cream">{x.layer}:</span> {x.text}.
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
