"use client";
import { useMemo, useState } from "react";
import { DateTime } from "luxon";
import type { KundaliChart } from "@/lib/astrology/types";
import type { KundaliReport } from "@/lib/astrology/report";
import type { AnnualReading } from "@/lib/astrology/annualReading";
import type { MonthlyForecast } from "@/lib/astrology/monthlyForecast";
import type { EventTheme } from "@/lib/astrology/lifeTimeline";
import { calendarSignals } from "@/lib/astrology/astrologerCalendar";
import { rawTransitModifiers } from "@/lib/astrology/transitModifiers";
import { ruleSupport } from "@/lib/astrology/ruleSupport";
import { houseSignification } from "@/lib/astrology/content";
import { term } from "@/lib/i18n/terms";
import { useAnalysis } from "./AnalysisContext";
import { useCalculation } from "./useCalculation";
import {
  Research,
  Panel,
  Facts,
  Table,
  Tabs,
  Disclosure,
  Notes,
  Empty,
  Meter,
  EvidenceList,
  useResearchCopy,
  useDateLabel,
} from "./ResearchUI";
import KundliChart from "../KundliChart";
import { ChartStyleButtons } from "./ChartPicker";
type Props = {
  chart: KundaliChart;
  report: KundaliReport | null;
  go: (slug: string) => void;
  mode: "user" | "astrologer";
  active?: boolean;
};

export function TransitWorkspace({ chart }: Props) {
  const a = useAnalysis()!;
  const { locale, L } = useResearchCopy();
  const date = useDateLabel();
  const [view, setView] = useState<"positions" | "support" | "ingresses">(
    "positions",
  );
  const positions = a.transits.map((p) => ({
    ...p,
    ...rawTransitModifiers(chart, p, a.transits),
  }));
  return (
    <Research kind="transits">
      <Panel
        title={L("Moving planets, natal references", "गोचर और जन्म संदर्भ")}
        description={L(
          "The transit controls live above the transit diagram. These ledgers use that same instant; D1 and D9 stay fixed.",
          "सारणियाँ गोचर कुंडली के ऊपर चुने उसी समय की हैं; जन्म कुंडलियाँ स्थिर हैं।",
        )}
      >
        <Facts
          items={[
            {
              label: L("Selected instant", "चुना समय"),
              value: `${a.date} · ${a.time.slice(0, 5)}`,
            },
            {
              label: L("House reference", "भाव आधार"),
              value: term(locale, chart.ascendant.sign),
              note: L("Fixed natal ascendant", "स्थिर जन्म लग्न"),
            },
            {
              label: L("Moon reference", "चंद्र आधार"),
              value: term(
                locale,
                chart.planets.find((p) => p.planet === "Moon")!.sign,
              ),
            },
          ]}
        />
        <Tabs
          label="Transit ledger view"
          value={view}
          onChange={setView}
          items={[
            { key: "positions", label: L("Positions", "स्थिति") },
            { key: "support", label: L("Vedha & bindus", "वेध और बिंदु") },
            {
              key: "ingresses",
              label: L("Next sign changes", "अगले राशि प्रवेश"),
            },
          ]}
        />
        {view === "positions" ? (
          <Table
            caption="Positions at the selected transit time"
            columns={[
              "Planet",
              "Sign",
              "Degree",
              "Motion",
              "From Lagna",
              "From Moon",
            ]}
            rows={positions.map((p) => [
              term(locale, p.planet),
              term(locale, p.sign),
              `${p.degree.toFixed(3)}°`,
              p.retrograde ? "Retrograde" : "Direct",
              p.houseFromLagna,
              p.houseFromMoon,
            ])}
          />
        ) : view === "support" ? (
          <Table
            caption="Raw gochara and Ashtakavarga context"
            columns={[
              "Planet",
              "Moon-house tone",
              "Vedha blockers",
              "Kakshya lord",
              "BAV contribution",
            ]}
            rows={positions.map((p) => [
              term(locale, p.planet),
              p.gochara.tone,
              p.gochara.blockers.map((n) => term(locale, n)).join(", ") || "—",
              p.kakshya?.lord ?? "—",
              p.kakshya ? (p.kakshya.good ? "1" : "0") : "—",
            ])}
          />
        ) : (
          <Table
            caption="Next calculated sign changes"
            columns={["Planet", "Next sign", "Approximate ingress"]}
            rows={positions.map((p) => [
              term(locale, p.planet),
              p.next ? term(locale, p.next.sign) : "—",
              p.next ? date(p.next.date, true) : "Not available",
            ])}
          />
        )}
      </Panel>
      <Panel title={L("Read a transit through its house", "भाव से गोचर पढ़ें")}>
        <div className="research-grid">
          {positions
            .filter((p) =>
              ["Jupiter", "Saturn", "Rahu", "Ketu"].includes(p.planet),
            )
            .map((p) => (
              <article className="research-stage" key={p.planet}>
                <h4>
                  {term(locale, p.planet)} · {term(locale, p.sign)}
                </h4>
                <p>{houseSignification(p.houseFromLagna, locale)}</p>
                <small>
                  House {p.houseFromLagna} from Lagna · {p.gochara.tone} from
                  Moon
                </small>
                <p>
                  {p.gochara.blockers.length
                    ? `Vedha: ${p.gochara.blockers.map((n) => term(locale, n)).join(", ")}`
                    : "No Vedha blocker under these checks."}
                </p>
              </article>
            ))}
        </div>
      </Panel>
    </Research>
  );
}

export function MonthlyWorkspace({ chart, active = true }: Props) {
  const a = useAnalysis()!;
  const { locale, L } = useResearchCopy();
  const [anchor, setAnchor] = useState(a.date.slice(0, 7));
  const [selected, setSelected] = useState(a.date.slice(0, 7));
  const [tab, setTab] = useState<"areas" | "dates" | "sky" | "diagnosis">(
    "areas",
  );
  const request = useCalculation<{ sections: { monthly: MonthlyForecast } }>(
    "/api/kundali/sections",
    {
      birth: chart.input,
      locale,
      sections: ["monthly"],
      at: DateTime.fromISO(`${anchor}-01T12:00`, { zone: a.zone }).toISO(),
    },
    active,
  );
  const f = request.data?.sections.monthly;
  const m = f?.months.find((m) => m.month === selected) ?? f?.months[0];
  return (
    <Research kind="monthly">
      <Panel
        title={L("Twelve months, one readable map", "बारह महीनों का नक्शा")}
        description={L(
          "The bars compare the engine’s rule-support scores. They are not event probabilities.",
          "बार नियम-सहारे की तुलना हैं, घटना के प्रतिशत नहीं।",
        )}
        actions={
          <label>
            {L("Start month", "आरंभ महीना")}
            <input
              type="month"
              value={anchor}
              onChange={(e) => {
                if (e.target.value) {
                  setAnchor(e.target.value);
                  setSelected(e.target.value);
                }
              }}
            />
          </label>
        }
      >
        {request.loading ? (
          <Empty />
        ) : request.error ? (
          <div className="research-error" role="alert">
            {request.error}
            <button onClick={request.retry}>Retry</button>
          </div>
        ) : f && m ? (
          <>
            <div className="research-trend" aria-label="Choose forecast month">
              {f.months.map((month) => (
                <button
                  type="button"
                  key={month.month}
                  aria-pressed={m.month === month.month}
                  onClick={() => {
                    setSelected(month.month);
                    a.update({ date: `${month.month}-15` });
                  }}
                >
                  <span>{month.score}</span>
                  <i style={{ height: `${Math.max(8, month.score)}px` }} />
                  <small>{month.label.split(" ")[0]}</small>
                </button>
              ))}
            </div>
            <Facts
              items={[
                { label: "Selected month", value: m.label },
                { label: "Rule-support verdict", value: m.verdict },
                {
                  label: "Mahadasha / Antardasha",
                  value: `${m.dasha.maha} › ${m.dasha.antar}`,
                },
              ]}
            />
            <p className="research-caption">{f.summary.text}</p>
            <Notes items={[m.headline, m.dasha.text]} />
          </>
        ) : null}
      </Panel>
      {f && m && !request.loading && (
        <>
          <Tabs
            label="Monthly reading chapters"
            value={tab}
            onChange={setTab}
            items={[
              { key: "areas", label: "Life areas" },
              { key: "dates", label: "Dates & focus" },
              { key: "sky", label: "Transit evidence" },
              { key: "diagnosis", label: "Planet diagnosis" },
            ]}
          />
          {tab === "areas" ? (
            <Panel title={L("Six life areas", "जीवन के छह क्षेत्र")}>
              <div className="research-grid">
                {m.areas.map((area) => (
                  <article key={area.key}>
                    <Meter
                      label={area.label}
                      value={area.score}
                      note={area.verdict}
                    />
                    <p className="research-caption">{area.text}</p>
                    <Disclosure
                      title={`${area.reasons.length} calculation factors`}
                    >
                      <EvidenceList items={area.reasons} />
                    </Disclosure>
                  </article>
                ))}
              </div>
            </Panel>
          ) : tab === "dates" ? (
            <>
              <Panel title="Dates to investigate">
                <div className="research-stages">
                  {m.keyDates.map((d, i) => (
                    <article className="research-stage" key={i}>
                      <h4>
                        {d.date} <span className="research-tone">{d.tone}</span>
                      </h4>
                      <p>{d.text}</p>
                    </article>
                  ))}
                </div>
              </Panel>
              <Panel title="Focus & practices">
                <Notes items={m.focus} />
                <Facts
                  items={[
                    {
                      label: "Personal year",
                      value: m.numerology.personalYear,
                    },
                    {
                      label: "Personal month",
                      value: m.numerology.personalMonth,
                    },
                  ]}
                />
                <p className="research-caption">{m.numerology.text}</p>
                {m.remedy && (
                  <Notes items={[`${m.remedy.planet}: ${m.remedy.text}`]} />
                )}
                <Disclosure title="Chandrashtama intervals">
                  <Notes
                    items={m.chandrashtama.map((x) => `${x.start} — ${x.end}`)}
                  />
                </Disclosure>
              </Panel>
            </>
          ) : tab === "sky" ? (
            <Panel title="Transit reasoning">
              <Table
                caption="Month midpoint transit context"
                columns={[
                  "Planet",
                  "Sign",
                  "From Lagna",
                  "From Moon",
                  "Vedha",
                  "BAV / SAV",
                  "Kakshya",
                ]}
                rows={m.transits.map((p) => [
                  p.planet,
                  `${p.sign} ${p.degree.toFixed(2)}°`,
                  p.houseFromLagna,
                  p.houseFromMoon,
                  p.vedhaBlockers.join(", ") || "—",
                  `${p.bindus ?? "—"} / ${p.sav}`,
                  p.kakshya
                    ? `${p.kakshya.lord}: ${p.kakshya.good ? "contributes" : "no contribution"}`
                    : "—",
                ])}
              />
              <EvidenceList items={m.gochara} />
            </Panel>
          ) : (
            <Panel title="Natal planet diagnosis">
              {f.diagnosis.map((p) => (
                <Disclosure
                  key={p.planet}
                  title={`${p.planet} · ${p.grade} · ${p.score}/100`}
                >
                  <Meter value={p.score} label={p.planet} note={p.summary} />
                  <EvidenceList
                    items={p.factors.map((x) => ({
                      text: x.label,
                      points: x.points,
                    }))}
                  />
                </Disclosure>
              ))}
            </Panel>
          )}
        </>
      )}
    </Research>
  );
}

export function AnnualWorkspace({ chart, active = true }: Props) {
  const a = useAnalysis()!;
  const { locale, L } = useResearchCopy();
  const date = useDateLabel();
  const [year, setYear] = useState(Number(a.date.slice(0, 4)));
  const [snapshot, setSnapshot] = useState("");
  const [tab, setTab] = useState<"areas" | "periods" | "positions">("areas");
  const req = useCalculation<AnnualReading>(
    "/api/kundali/annual",
    {
      birth: chart.input,
      year,
      ...(snapshot
        ? {
            at: DateTime.fromISO(`${snapshot}T12:00`, { zone: a.zone }).toISO(),
          }
        : {}),
    },
    active,
  );
  const d = req.data;
  return (
    <Research kind="annual">
      <Panel
        title={L(
          "From one solar return to the next",
          "एक सौर वापसी से अगली तक",
        )}
        actions={
          <div className="research-controls">
            <label>
              Return year
              <select
                value={year}
                onChange={(e) => {
                  setYear(Number(e.target.value));
                  setSnapshot("");
                }}
              >
                {Array.from(
                  { length: 2101 - Number(chart.input.date.slice(0, 4)) },
                  (_, i) => Number(chart.input.date.slice(0, 4)) + i,
                ).map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </label>
            <label>
              Snapshot within this return
              <input
                type="date"
                value={snapshot}
                onChange={(e) => setSnapshot(e.target.value)}
              />
            </label>
            <button type="button" onClick={() => setSnapshot("")}>
              Use exact return
            </button>
          </div>
        }
      >
        {req.loading ? (
          <Empty text="Calculating the sidereal solar return…" />
        ) : req.error ? (
          <div role="alert" className="research-error">
            {req.error}
            <button onClick={req.retry}>Retry</button>
          </div>
        ) : d ? (
          <Facts
            items={[
              {
                label: "Return starts",
                value: date(d.annual.returnMoment, true),
              },
              { label: "Return ends", value: date(d.end, true) },
              {
                label: "Muntha",
                value: term(locale, d.annual.muntha.sign),
                note: `House ${d.annual.muntha.house} · ${term(locale, d.annual.muntha.lord)}`,
              },
              {
                label: "Natal dasha at snapshot",
                value:
                  d.chain.map((p) => term(locale, p.lord)).join(" › ") ||
                  "Outside coverage",
              },
            ]}
          />
        ) : null}
      </Panel>
      {d && !req.loading && (
        <>
          <Panel title="Natal and annual chart">
            <ChartStyleButtons
              value={a.style}
              onChange={(style) => a.update({ style })}
            />
            <div className="research-grid">
              {[
                { title: "Natal D1", c: chart },
                { title: `Annual D1 · ${year}`, c: d.annual.chart },
              ].map(({ title, c }) => (
                <article key={title}>
                  <h4>{title}</h4>
                  <div className="research-chart">
                    <KundliChart
                      ascendantSignIndex={c.ascendant.signIndex}
                      planets={c.planets}
                      style={a.style}
                    />
                  </div>
                </article>
              ))}
            </div>
          </Panel>
          <Tabs
            label="Annual analysis chapters"
            value={tab}
            onChange={setTab}
            items={[
              { key: "areas", label: "Life-area comparison" },
              { key: "periods", label: "Overlapping periods" },
              { key: "positions", label: "Annual positions" },
            ]}
          />
          {tab === "areas" ? (
            <Panel title="Compare foundations and emphasis">
              <div className="research-stages">
                {d.areas.map((area) => (
                  <article key={area.key} className="research-stage">
                    <h4>
                      {area.key}{" "}
                      <span className="research-tone">{area.comparison}</span>
                    </h4>
                    <Facts
                      items={[
                        {
                          label: "Natal ruler",
                          value: term(locale, area.natal.lord.lord),
                          note: `${area.natal.planet.sign} · house ${area.natal.planet.house}`,
                        },
                        {
                          label: "Annual ruler",
                          value: term(locale, area.annual.lord.lord),
                          note: `${area.annual.planet.sign} · house ${area.annual.planet.house}`,
                        },
                      ]}
                    />
                    <Disclosure title="Dignity, strength, divisional and transit evidence">
                      <Notes
                        items={[
                          `Natal condition: ${area.natalTone}; annual condition: ${area.annualTone}.`,
                          ...area.natal.vargas.map(
                            (v) =>
                              `${v.key}: ${v.placement.sign}, house ${v.placement.house}${v.dignity ? `, ${v.dignity}` : ""}`,
                          ),
                          ...area.slowTransits.map(
                            (t) =>
                              `${t.planet} in ${t.sign}: ${t.gochara.tone}`,
                          ),
                        ]}
                      />
                    </Disclosure>
                  </article>
                ))}
              </div>
            </Panel>
          ) : tab === "periods" ? (
            <Panel title="Natal Antardashas crossing this return">
              <Table
                caption="Natal periods, not a new annual Vimshottari clock"
                columns={["Mahadasha", "Antardasha", "Start", "End"]}
                rows={d.periods.map((p) => [
                  p.maha,
                  p.lord,
                  date(p.start),
                  date(p.end),
                ])}
              />
            </Panel>
          ) : (
            <Panel title="Annual planetary ledger">
              <Table
                caption="Annual D1 positions"
                columns={["Planet", "Sign", "Degree", "House", "Dignity"]}
                rows={d.annual.chart.planets.map((p) => [
                  p.planet,
                  p.sign,
                  `${p.degreeInSign.toFixed(4)}°`,
                  p.house,
                  p.dignity ?? "—",
                ])}
              />
            </Panel>
          )}
          <p className="research-caption">
            Lahiri sidereal return at the birth location. Agreement describes
            these particular checks; relocation, Tajik yogas and Mudda Dasha are
            not included.
          </p>
        </>
      )}
    </Research>
  );
}

export function TimelineWorkspace({ report, go }: Props) {
  const a = useAnalysis()!;
  const { L } = useResearchCopy();
  const date = useDateLabel();
  const [view, setView] = useState<
    "chapters" | "windows" | "years" | "milestones"
  >("chapters");
  const [filter, setFilter] = useState("all");
  const t = report?.timeline;
  if (!t)
    return <Empty text="Preparing life chapters and their timing evidence…" />;
  return (
    <Research kind="timeline">
      <Tabs
        label="Life timeline view"
        value={view}
        onChange={setView}
        items={[
          { key: "chapters", label: "Planetary chapters" },
          { key: "windows", label: "Candidate windows" },
          { key: "years", label: "Year by year" },
          { key: "milestones", label: "Milestones" },
        ]}
      />
      {view === "chapters" ? (
        <Panel
          title={L("Chapters from birth onward", "जन्म से जीवन के अध्याय")}
        >
          <div className="research-stages">
            {t.mahas.map((m, i) => (
              <article
                className="research-stage"
                data-active={
                  new Date(m.start) <= a.at && a.at < new Date(m.end)
                }
                key={i}
              >
                <h4>
                  {m.lord} · {date(m.start)} — {date(m.end)}
                </h4>
                <small>
                  Age {m.ageStart.toFixed(0)}–{m.ageEnd.toFixed(0)} · {m.tone}
                </small>
                <p>{m.summary}</p>
                <Disclosure
                  title={`${m.antars.length} subperiods and their events`}
                >
                  {m.antars.map((p, j) => (
                    <Disclosure
                      key={j}
                      title={`${m.lord} › ${p.lord} · ${date(p.start)} — ${date(p.end)}`}
                    >
                      <Notes
                        items={[
                          p.note,
                          ...p.themes.map(
                            (x) => `${x.label}: ${x.why.join("; ")}`,
                          ),
                        ]}
                      />
                      {p.events.map((e, k) => (
                        <Disclosure
                          key={k}
                          title={`${e.label} · ${ruleSupport(e.confidence)}`}
                        >
                          <EvidenceList items={e.evidence} />
                        </Disclosure>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          a.update({
                            date: DateTime.fromJSDate(new Date(p.start))
                              .setZone(a.zone)
                              .toISODate()!,
                          });
                          go("transits");
                        }}
                      >
                        Inspect start-date transits
                      </button>
                    </Disclosure>
                  ))}
                </Disclosure>
              </article>
            ))}
          </div>
        </Panel>
      ) : view === "windows" ? (
        <Panel
          title="Windows to investigate"
          actions={
            <select
              aria-label="Filter timing windows"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All themes</option>
              {[...new Set(t.keyWindows.map((x) => x.kind))].map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          }
        >
          <div className="research-stages">
            {t.keyWindows
              .filter((w) => filter === "all" || w.kind === filter)
              .map((w, i) => (
                <article className="research-stage" key={i}>
                  <h4>{w.label}</h4>
                  <p>
                    {date(w.start)} — {date(w.end)} · {w.dasha}
                  </p>
                  <small>
                    {ruleSupport(w.confidence)} · ages {w.ages}
                  </small>
                  {w.peak && (
                    <Notes
                      items={[
                        `Stronger subwindow: ${date(w.peak.start)} — ${date(w.peak.end)}. ${w.peak.why}`,
                      ]}
                    />
                  )}
                </article>
              ))}
          </div>
        </Panel>
      ) : view === "years" ? (
        <Panel title="Year-by-year context">
          <div className="research-stages">
            {t.years.map((y) => (
              <Disclosure
                key={y.age}
                title={`Age ${y.age} · ${date(y.start)} · ${y.dasha}`}
              >
                <Notes items={y.text} />
                <Facts
                  items={[
                    {
                      label: "Jupiter from Lagna / Moon",
                      value: `${y.jupiter.fromLagna} / ${y.jupiter.fromMoon}`,
                    },
                    {
                      label: "Saturn from Lagna / Moon",
                      value: `${y.saturn.fromLagna} / ${y.saturn.fromMoon}`,
                    },
                    { label: "Saturn phase", value: y.saturnPhase ?? "None" },
                  ]}
                />
                <Notes
                  items={y.highlights.map(
                    (h) => `${h.label}: ${ruleSupport(h.confidence)}`,
                  )}
                />
              </Disclosure>
            ))}
          </div>
        </Panel>
      ) : (
        <Panel title="Returns and maturity milestones">
          <div className="research-stages">
            {t.milestones.map((m, i) => (
              <article className="research-stage" key={i}>
                <h4>{m.label}</h4>
                <small>
                  Age {m.age} · {date(m.date)}
                </small>
                <p>{m.text}</p>
              </article>
            ))}
          </div>
        </Panel>
      )}
      <p className="research-caption">
        Rankings describe agreement among the checked traditional rules, not
        calibrated event probabilities.
      </p>
    </Research>
  );
}

export function SignalCalendarWorkspace({ report, go }: Props) {
  const a = useAnalysis()!;
  const date = useDateLabel();
  const [theme, setTheme] = useState<EventTheme | "all">("all");
  const [horizon, setHorizon] = useState(12);
  const [selected, setSelected] = useState<string | null>(null);
  const timeline = report?.timeline;
  const signals = useMemo(
    () => (timeline ? calendarSignals(timeline, a.at, horizon, theme) : []),
    [timeline, a.at, horizon, theme],
  );
  const months = [
    ...new Set(
      signals.map((s) =>
        DateTime.fromJSDate(s.date).setZone(a.zone).toFormat("yyyy-MM"),
      ),
    ),
  ];
  const month = selected && months.includes(selected) ? selected : months[0];
  return (
    <Research kind="calendar">
      <Panel
        title="Choose a month, inspect its evidence"
        actions={
          <div className="research-controls">
            <select
              aria-label="Signal calendar horizon"
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))}
            >
              <option value={12}>12 months</option>
              <option value={24}>24 months</option>
            </select>
            <select
              aria-label="Signal calendar theme"
              value={theme}
              onChange={(e) => {
                setTheme(e.target.value as EventTheme | "all");
                setSelected(null);
              }}
            >
              {[
                "all",
                "career",
                "marriage",
                "wealth",
                "property",
                "education",
                "health",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
        }
      >
        {!report?.timeline ? (
          <Empty />
        ) : !months.length ? (
          <Empty text="No candidate windows for these filters. Try another theme or a longer horizon." />
        ) : (
          <div className="research-calendar">
            {months.map((m) => (
              <button
                type="button"
                key={m}
                aria-pressed={month === m}
                onClick={() => setSelected(m)}
              >
                <strong>
                  {DateTime.fromISO(`${m}-01`).toFormat("LLLL yyyy")}
                </strong>
                <small>
                  {
                    signals.filter(
                      (s) =>
                        DateTime.fromJSDate(s.date)
                          .setZone(a.zone)
                          .toFormat("yyyy-MM") === m,
                    ).length
                  }{" "}
                  candidate signals
                </small>
              </button>
            ))}
          </div>
        )}
      </Panel>
      {month && (
        <Panel title={`Candidate windows · ${month}`}>
          <div className="research-stages">
            {signals
              .filter(
                (s) =>
                  DateTime.fromJSDate(s.date)
                    .setZone(a.zone)
                    .toFormat("yyyy-MM") === month,
              )
              .map((s) => (
                <article key={s.key} className="research-stage">
                  <h4>{s.event.label}</h4>
                  <p>
                    {date(s.start)} — {date(s.end)} · {s.maha} › {s.antar}
                  </p>
                  <small>
                    {ruleSupport(s.event.confidence)} ·{" "}
                    {s.agreeingLayers.length} agreeing layers
                  </small>
                  <Disclosure title="Supporting evidence and counterpoints">
                    <EvidenceList items={s.event.evidence} />
                    <p className="research-caption">
                      Counterpoint:{" "}
                      {s.counterpoint ?? "None flagged by these checks."}
                    </p>
                  </Disclosure>
                  <button
                    type="button"
                    onClick={() => {
                      a.update({
                        date: DateTime.fromJSDate(s.date)
                          .setZone(a.zone)
                          .toISODate()!,
                      });
                      go("transits");
                    }}
                  >
                    Open this date in transits
                  </button>
                </article>
              ))}
          </div>
        </Panel>
      )}
    </Research>
  );
}

export function YoginiWorkspace({ report }: Props) {
  const a = useAnalysis()!;
  const date = useDateLabel();
  const [showAll, setShowAll] = useState(false);
  const periods = report?.yogini;
  if (!periods) return <Empty text="Calculating Yogini periods…" />;
  const current = periods.find(
    (p) => new Date(p.start) <= a.at && a.at < new Date(p.end),
  );
  return (
    <Research kind="yogini">
      <Panel
        title="The eight-Yogini cycle"
        actions={
          <label>
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
            />
            Include completed periods
          </label>
        }
      >
        <Facts
          items={[
            {
              label: "At the selected date",
              value: current?.yogini.name ?? "Outside coverage",
            },
            { label: "Period lord", value: current?.yogini.lord ?? "—" },
            { label: "Classical cycle", value: "36 years" },
          ]}
        />
        <div className="research-stages">
          {periods
            .filter((p) => showAll || new Date(p.end) > a.at)
            .map((p, i) => (
              <article
                className="research-stage"
                data-active={p === current}
                key={i}
              >
                <h4>
                  {p.yogini.name} · {p.yogini.lord}
                </h4>
                <small>
                  {date(p.start)} — {date(p.end)} · {p.yogini.nature}
                </small>
                <p>{p.yogini.meaning}</p>
                <Disclosure title="Eight proportional subperiods">
                  <Table
                    caption={`${p.yogini.name} subperiods`}
                    columns={["Yogini", "Lord", "Start", "End"]}
                    rows={p.subPeriods.map((s) => [
                      s.yogini.name,
                      s.yogini.lord,
                      date(s.start),
                      date(s.end),
                    ])}
                  />
                </Disclosure>
              </article>
            ))}
        </div>
      </Panel>
    </Research>
  );
}
export function CharaWorkspace({ report }: Props) {
  const a = useAnalysis()!;
  const date = useDateLabel();
  const [view, setView] = useState<"periods" | "karakas">("periods");
  const c = report?.chara;
  if (!c) return <Empty text="Calculating Chara periods and karakas…" />;
  return (
    <Research kind="chara">
      <Tabs
        label="Chara framework view"
        value={view}
        onChange={setView}
        items={[
          { key: "periods", label: "Sign-based periods" },
          { key: "karakas", label: "Seven chara karakas" },
        ]}
      />
      {view === "karakas" ? (
        <Panel title="Roles ranked by degree">
          <Table
            caption="Seven-planet chara karakas"
            columns={["Karaka", "Planet", "Degree in sign", "House"]}
            rows={c.karakas.map((k) => [
              k.karaka,
              k.planet,
              `${k.degree.toFixed(4)}°`,
              k.house,
            ])}
          />
        </Panel>
      ) : (
        <Panel title="Sign periods and their readings">
          <div className="research-stages">
            {c.periods.map((p, i) => (
              <article
                className="research-stage"
                key={i}
                data-active={
                  new Date(p.start) <= a.at && a.at < new Date(p.end)
                }
              >
                <h4>
                  {p.sign} · {p.years} years
                </h4>
                <small>
                  {date(p.start)} — {date(p.end)} · house {p.house}
                </small>
                <Notes items={p.reading} />
                <Disclosure title="Twelve sign subperiods">
                  <Table
                    caption={`${p.sign} subperiods`}
                    columns={["Sign", "Start", "End"]}
                    rows={p.subPeriods.map((s) => [
                      s.sign,
                      date(s.start),
                      date(s.end),
                    ])}
                  />
                </Disclosure>
              </article>
            ))}
          </div>
        </Panel>
      )}
    </Research>
  );
}
