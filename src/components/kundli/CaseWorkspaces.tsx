"use client";
import { useState } from "react";
import Link from "next/link";
import { DateTime } from "luxon";
import type { KundaliChart } from "@/lib/astrology/types";
import type { BirthSensitivity } from "@/lib/astrology/birthSensitivity";
import {
  precisionKey,
  sensitivityKey,
  type SensitivityRecord,
} from "@/lib/birthReliability";
import { useDeviceStore } from "@/lib/useDeviceStore";
import {
  journalKey,
  journalSchema,
  journalEventSchema,
  type JournalEvent,
} from "@/lib/eventJournal";
import {
  EVENT_KEYS,
  EVENT_KINDS,
  type EventKind,
  type EventPrecision,
  type EventConfidence,
  type EventMatch,
} from "@/lib/astrology/rectificationEvents";
import { toBirthQuery } from "@/lib/birthParams";
import { VARGA_KEYS, type VargaKey } from "@/lib/astrology/constants";
import {
  chartRelationships,
  inspectChart,
  type InspectionPick,
} from "@/lib/astrology/chartInspection";
import { useCalculation } from "./useCalculation";
import { useAnalysis } from "./AnalysisContext";
import KundliChart from "../KundliChart";
import { ChartStyleButtons } from "./ChartPicker";
import ChartSelectionReading from "./ChartSelectionReading";
import {
  Research,
  Panel,
  Facts,
  Tabs,
  Table,
  Disclosure,
  Notes,
  Empty,
  useResearchCopy,
  useDateLabel,
} from "./ResearchUI";
type Props = { chart: KundaliChart };

export function CalculationWorkspace({ chart }: Props) {
  const [view, setView] = useState<"inputs" | "methods" | "positions">(
    "inputs",
  );
  return (
    <Research kind="calculations">
      <Facts
        items={[
          {
            label: "Sidereal ayanamsa",
            value: `${chart.ayanamsa.toFixed(6)}°`,
            note: "Lahiri",
          },
          { label: "D1 reference", value: "Whole sign" },
          { label: "Chalit reference", value: "Sripati" },
        ]}
      />
      <Tabs
        label="Calculation audit chapters"
        value={view}
        onChange={setView}
        items={[
          { key: "inputs", label: "Birth inputs" },
          { key: "methods", label: "Model & conventions" },
          { key: "positions", label: "Raw angular ledger" },
        ]}
      />
      {view === "inputs" ? (
        <Panel title="The input that defines this chart">
          <Table
            caption="Recorded birth input and resolved instant"
            columns={["Input", "Value"]}
            rows={[
              ["Local date & time", `${chart.input.date} ${chart.input.time}`],
              ["Birthplace", chart.input.place],
              ["IANA time zone", chart.input.timezone],
              ["UTC instant", chart.utcDate],
              ["Latitude", chart.input.latitude],
              ["Longitude", chart.input.longitude],
            ]}
          />
        </Panel>
      ) : view === "methods" ? (
        <Panel title="Use these conventions for comparisons">
          <Table
            caption="Calculation model"
            columns={["Method", "Convention"]}
            rows={[
              ["Planetary model", "Astronomy Engine · geocentric"],
              ["Sidereal zodiac", "Lahiri"],
              ["Lunar nodes", "Mean Rahu / Ketu"],
              ["D1 houses", "Whole sign"],
              ["Bhava Chalit", "Sripati"],
              ["Vimshottari year", "365.25 days"],
              ["KP", "Separate KP ayanamsa and Placidus cusp calculation"],
            ]}
          />
          <Notes
            items={[
              "Display precision is not observational accuracy. Divisional ascendants and fine dashas depend on the birth-time record.",
              "Interpretive scores measure implemented traditional rule support; they are not calibrated event probabilities.",
            ]}
          />
        </Panel>
      ) : (
        <Panel title="Ecliptic positions before interpretation">
          <Table
            caption="Sidereal longitudes and angles"
            columns={["Point", "Longitude", "Sign degree"]}
            rows={[
              [
                "Ascendant",
                `${chart.ascendant.siderealLongitude.toFixed(6)}°`,
                `${chart.ascendant.degreeInSign.toFixed(6)}°`,
              ],
              ["Midheaven", `${chart.midheaven.toFixed(6)}°`, "—"],
              ...chart.planets.map((p) => [
                p.planet,
                `${p.siderealLongitude.toFixed(6)}°`,
                `${p.sign} ${p.degreeInSign.toFixed(6)}°`,
              ]),
            ]}
          />
        </Panel>
      )}
    </Research>
  );
}

export function PrecisionWorkspace({ chart }: Props) {
  const { L } = useResearchCopy();
  const date = useDateLabel();
  const [precision, savePrecision] = useDeviceStore<string>(
    precisionKey(chart.input),
    "unknown",
  );
  const [, saveAssessment] = useDeviceStore<SensitivityRecord | null>(
    sensitivityKey(chart.input),
    null,
  );
  const [window, setWindow] = useState<number | null>(null);
  const [changesOnly, setChangesOnly] = useState(true);
  const [storageStatus, setStorageStatus] = useState("");
  const req = useCalculation<BirthSensitivity>(
    "/api/kundali/sensitivity",
    { birth: chart.input, window },
    window !== null,
  );
  const r = req.data;
  const changing = r?.fields.filter((f) => !f.stable) ?? [];
  return (
    <Research kind="precision">
      <Panel
        title={L(
          "Record uncertainty before interpreting detail",
          "व्याख्या से पहले अनिश्चितता दर्ज करें",
        )}
      >
        <Tabs
          label="Recorded birth-time precision"
          value={precision}
          onChange={(v) => {
            savePrecision(v);
            setWindow(null);
          }}
          items={[
            { key: "unknown", label: "Unknown" },
            { key: "0", label: "Recorded exact time" },
            { key: "5", label: "±5 minutes" },
            { key: "15", label: "±15 minutes" },
            { key: "30", label: "±30 minutes" },
          ]}
        />
        <Facts
          items={[
            {
              label: "Entered local time",
              value: `${chart.input.date} ${chart.input.time}`,
            },
            {
              label: "Uncertainty recorded",
              value:
                precision === "unknown"
                  ? "Unknown"
                  : precision === "0"
                    ? "Recorded exact time"
                    : `±${precision} minutes`,
            },
          ]}
        />
        <button
          type="button"
          disabled={precision === "unknown" || (window !== null && req.loading)}
          onClick={() => setWindow(Number(precision))}
        >
          {window !== null && req.loading
            ? "Testing nearby times…"
            : "Test this interval"}
        </button>
        <p className="research-caption">
          One-minute samples preserve recorded seconds. An exact-time selection
          tests only the entered instant.
        </p>
      </Panel>
      {window !== null &&
        (req.loading ? (
          <Empty text="Comparing ascendants, divisional signs and Chalit houses…" />
        ) : req.error ? (
          <div className="research-error" role="alert">
            {req.error}
            <button onClick={req.retry}>Retry</button>
          </div>
        ) : r ? (
          <>
            <Panel title="Which placements remain stable?">
              <Facts
                items={[
                  { label: "Sampled times", value: r.sampleCount },
                  {
                    label: "Stable fields",
                    value: r.fields.length - changing.length,
                  },
                  { label: "Changing fields", value: changing.length },
                ]}
              />
              <div className="research-controls">
                <label>
                  <input
                    type="checkbox"
                    checked={changesOnly}
                    onChange={(e) => setChangesOnly(e.target.checked)}
                  />
                  Show only changing fields
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const ok = saveAssessment({
                      precision: precision as SensitivityRecord["precision"],
                      sampleCount: r.sampleCount,
                      fields: r.fields.map((f) => ({
                        key: f.key,
                        stable: f.stable,
                      })),
                    });
                    setStorageStatus(
                      ok
                        ? "Reliability assessment saved on this device."
                        : "Storage unavailable; this result remains visible in this session.",
                    );
                  }}
                >
                  Save reliability assessment
                </button>
              </div>
              {storageStatus && (
                <p role="status" className="research-caption">
                  {storageStatus}
                </p>
              )}
              <Table
                caption="Minute-grid sensitivity, not continuous-time proof"
                columns={["Placement", "Observed values", "Result"]}
                rows={r.fields
                  .filter((f) => !changesOnly || !f.stable)
                  .map((f) => [
                    f.key,
                    f.values.join(" / "),
                    f.stable ? "Stable in samples" : "Time-sensitive",
                  ])}
              />
              <p className="research-caption">
                First Mahadasha balance ends between{" "}
                {date(r.dashaBalanceEndRange.from, true)} and{" "}
                {date(r.dashaBalanceEndRange.to, true)}.
              </p>
            </Panel>
            <Disclosure title="Inspect all sampled birth times">
              <Table
                caption="Candidate samples"
                columns={[
                  "Offset",
                  "Local date",
                  "Time",
                  "Lagna",
                  "D9 ascendant",
                ]}
                rows={r.samples.map((s) => [
                  s.offset,
                  s.date,
                  s.time,
                  s.lagna,
                  s.navamsa,
                ])}
              />
            </Disclosure>
          </>
        ) : null)}
      <Link
        className="research-action"
        href={`/rectification?${toBirthQuery(chart.input)}`}
      >
        Open event-based birth-time rectification
      </Link>
    </Research>
  );
}

export function JournalWorkspace({ chart }: Props) {
  const [stored, save] = useDeviceStore<JournalEvent[]>(
    journalKey(chart.input),
    [],
  );
  const parsed = journalSchema.safeParse(stored);
  const events = parsed.success ? parsed.data : [];
  const [kind, setKind] = useState<EventKind>("career");
  const [date, setDate] = useState("");
  const [precision, setPrecision] = useState<EventPrecision>("day");
  const [confidence, setConfidence] = useState<EventConfidence>("high");
  const [importance, setImportance] = useState(3);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [reviewBody, setReviewBody] = useState<unknown | null>(null);
  const req = useCalculation<{ runs: { best: { events: EventMatch[] } }[] }>(
    "/api/rectification",
    reviewBody,
    reviewBody !== null,
  );
  const matches = reviewBody ? req.data?.runs[0]?.best.events : [];
  const persist = (next: JournalEvent[]) => {
    const ok = save(next);
    setReviewBody(null);
    setStatus(
      ok
        ? "Saved on this device."
        : "Storage unavailable. Entries remain in the current session; keep a separate copy.",
    );
  };
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const result = journalEventSchema.safeParse({
      id: crypto.randomUUID(),
      kind,
      date,
      precision,
      confidence,
      importance,
      note,
    });
    if (!result.success) {
      setError("Enter a valid date and importance for the selected precision.");
      return;
    }
    const birth = chart.input.date.slice(
      0,
      precision === "year" ? 4 : precision === "month" ? 7 : 10,
    );
    if (date <= birth) {
      setError("Choose an event after the birth date or birth interval.");
      return;
    }
    if (events.length >= 12) {
      setError("The journal supports up to 12 milestones.");
      return;
    }
    if (
      events.some(
        (x) => x.kind === kind && x.date === date && x.precision === precision,
      )
    ) {
      setError("That event is already saved.");
      return;
    }
    persist([...events, result.data]);
    setDate("");
    setNote("");
  };
  return (
    <Research kind="journal">
      <Facts
        items={[
          { label: "Recorded milestones", value: `${events.length} / 12` },
          {
            label: "Documented dates",
            value: events.filter((e) => e.confidence === "high").length,
          },
          { label: "Personal notes", value: "Stay on this device" },
        ]}
      />
      <Panel
        title="Add a reliable milestone"
        description="Record what happened and how certain its date is. Personal notes are not sent to the calculation endpoint."
      >
        <form onSubmit={add}>
          <div className="research-grid">
            <label>
              Event
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as EventKind)}
              >
                {EVENT_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {EVENT_KINDS[k].label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Date precision
              <select
                value={precision}
                onChange={(e) => {
                  setPrecision(e.target.value as EventPrecision);
                  setDate("");
                }}
              >
                <option value="day">Exact day</option>
                <option value="month">Month only</option>
                <option value="year">Year only</option>
              </select>
            </label>
            <label>
              Event date
              <input
                required
                type={
                  precision === "day"
                    ? "date"
                    : precision === "month"
                      ? "month"
                      : "text"
                }
                inputMode={precision === "year" ? "numeric" : undefined}
                placeholder="YYYY"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label>
              Evidence reliability
              <select
                value={confidence}
                onChange={(e) =>
                  setConfidence(e.target.value as EventConfidence)
                }
              >
                <option value="high">Documented</option>
                <option value="medium">Remembered</option>
                <option value="low">Uncertain</option>
              </select>
            </label>
            <label>
              Importance · 1 to 5
              <input
                type="number"
                min={1}
                max={5}
                value={importance}
                onChange={(e) => setImportance(Number(e.target.value))}
              />
            </label>
            <label>
              Private note
              <textarea
                value={note}
                maxLength={500}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
          </div>
          <button type="submit" disabled={events.length >= 12}>
            Save milestone
          </button>
        </form>
        {error && (
          <p role="alert" className="research-error">
            {error}
          </p>
        )}
        {status && (
          <p role="status" className="research-caption">
            {status}
          </p>
        )}
      </Panel>
      <Panel title="Your dated event ledger">
        {events.length ? (
          <div className="research-stages">
            {events.map((e) => (
              <article key={e.id} className="research-stage">
                <h4>{EVENT_KINDS[e.kind].label}</h4>
                <small>
                  {e.date} · {e.precision} · {e.confidence} reliability ·
                  importance {e.importance}/5
                </small>
                {e.note && <p>{e.note}</p>}
                <button
                  type="button"
                  onClick={() => persist(events.filter((x) => x.id !== e.id))}
                >
                  Remove this milestone
                </button>
              </article>
            ))}
          </div>
        ) : (
          <Empty text="No events recorded yet. Add a milestone above." />
        )}
        <div className="research-controls">
          <button
            type="button"
            disabled={!events.length || (reviewBody !== null && req.loading)}
            onClick={() =>
              setReviewBody({
                birth: chart.input,
                window: 0,
                events: events.map(
                  ({ kind, date, precision, confidence, importance }) => ({
                    kind,
                    date,
                    precision,
                    confidence,
                    importance,
                  }),
                ),
              })
            }
          >
            Review links at the entered birth time
          </button>
          <Link
            className="research-action"
            href={`/rectification?${toBirthQuery(chart.input)}&journal=1`}
          >
            Use journal in rectification
          </Link>
        </div>
      </Panel>
      {reviewBody !== null &&
        (req.loading ? (
          <Empty text="Reviewing the recorded events…" />
        ) : req.error ? (
          <div className="research-error" role="alert">
            {req.error}
            <button onClick={req.retry}>Retry</button>
          </div>
        ) : matches?.length ? (
          <Panel title="Retrospective rule matches">
            {matches.map((m, i) => (
              <Disclosure
                key={i}
                title={`${m.date} · ${EVENT_KINDS[m.kind].label} · ${m.points} weighted points`}
              >
                <Notes items={m.reasons} />
              </Disclosure>
            ))}
            <p className="research-caption">
              A retrospective rule match does not validate the birth time.
            </p>
          </Panel>
        ) : null)}
    </Research>
  );
}

export function ComparisonWorkspace({ chart }: Props) {
  const a = useAnalysis()!;
  const [kind, setKind] = useState<"divisions" | "time">("divisions");
  const [left, setLeft] = useState<VargaKey>("D1");
  const [right, setRight] = useState<VargaKey>("D9");
  const [timeVarga, setTimeVarga] = useState<VargaKey>("D9");
  const [offset, setOffset] = useState(5);
  const [request, setRequest] = useState<unknown | null>(null);
  const [selected, setSelected] = useState<InspectionPick | null>(null);
  const [focus, setFocus] = useState(0);
  const [open, setOpen] = useState(false);
  const [aspects, setAspects] = useDeviceStore<boolean>(
    "kundli-show-aspects",
    false,
  );
  const { locale } = useResearchCopy();
  const req = useCalculation<{ chart: KundaliChart }>(
    "/api/kundali",
    request,
    request !== null,
  );
  const second =
    kind === "time"
      ? request && !req.loading
        ? req.data?.chart
        : null
      : chart;
  const keys: [VargaKey, VargaKey] =
    kind === "time" ? [timeVarga, timeVarga] : [left, right];
  const charts = second ? [chart, second] : [];
  const choose = (pick: InspectionPick, index: number) => {
    const same =
      selected?.kind === pick.kind &&
      (pick.kind === "planet"
        ? selected?.kind === "planet" && selected.planet === pick.planet
        : selected?.kind === "house" && selected.house === pick.house);
    if (same && focus === index && open) {
      setOpen(false);
      setSelected(null);
    } else {
      setSelected(pick);
      setFocus(index);
      setOpen(true);
    }
  };
  return (
    <Research kind="compare">
      <Panel title="Keep one reference and compare the same factor">
        <Tabs
          label="Comparison type"
          value={kind}
          onChange={(v) => {
            setKind(v);
            setOpen(false);
          }}
          items={[
            { key: "divisions", label: "Divisional charts" },
            { key: "time", label: "Birth-time candidates" },
          ]}
        />
        <div className="research-controls">
          {kind === "divisions" ? (
            <>
              {[
                { label: "First chart", value: left, set: setLeft },
                { label: "Second chart", value: right, set: setRight },
              ].map((c) => (
                <label key={c.label}>
                  {c.label}
                  <select
                    value={c.value}
                    onChange={(e) => c.set(e.target.value as VargaKey)}
                  >
                    {VARGA_KEYS.map((k) => (
                      <option key={k}>{k}</option>
                    ))}
                  </select>
                </label>
              ))}
            </>
          ) : (
            <>
              <label>
                Chart at both times
                <select
                  value={timeVarga}
                  onChange={(e) => setTimeVarga(e.target.value as VargaKey)}
                >
                  {VARGA_KEYS.map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </label>
              <label>
                Minutes from entered time
                <input
                  type="number"
                  min={-120}
                  max={120}
                  value={offset}
                  onChange={(e) => {
                    setOffset(Number(e.target.value));
                    setRequest(null);
                    setOpen(false);
                  }}
                />
              </label>
              <button
                type="button"
                disabled={
                  !Number.isInteger(offset) ||
                  Math.abs(offset) > 120 ||
                  (request !== null && req.loading)
                }
                onClick={() => {
                  const at = DateTime.fromISO(
                    `${chart.input.date}T${chart.input.time}`,
                    { zone: chart.input.timezone },
                  ).plus({ minutes: offset });
                  setRequest({
                    ...chart.input,
                    date: at.toISODate(),
                    time: at.toFormat(
                      chart.input.time.length > 5 ? "HH:mm:ss" : "HH:mm",
                    ),
                    locale,
                  });
                }}
              >
                Calculate candidate
              </button>
            </>
          )}
          <button
            type="button"
            aria-pressed={aspects}
            onClick={() => setAspects(!aspects)}
          >
            Show aspects · {aspects ? "On" : "Off"}
          </button>
          <ChartStyleButtons
            value={a.style}
            onChange={(style) => a.update({ style })}
          />
        </div>
      </Panel>
      {kind === "time" && request && req.loading ? (
        <Empty text="Calculating the alternative birth time…" />
      ) : kind === "time" && request !== null && req.error ? (
        <div role="alert" className="research-error">
          {req.error}
          <button onClick={req.retry}>Retry</button>
        </div>
      ) : !second ? (
        <Empty text="Calculate a candidate to open both charts. The original birth details stay unchanged." />
      ) : (
        <>
          <Panel title="Read the two charts together">
            <div className="research-grid">
              {charts.map((c, index) => {
                const key = keys[index];
                const division = c.divisionalCharts[key];
                return (
                  <article key={index}>
                    <h4>
                      {key} · {c.input.date} {c.input.time}
                    </h4>
                    <div className="research-chart">
                      <KundliChart
                        ascendantSignIndex={
                          key === "D1"
                            ? c.ascendant.signIndex
                            : division.ascendant.signIndex
                        }
                        planets={key === "D1" ? c.planets : division.planets}
                        style={a.style}
                        selected={selected}
                        relationships={
                          selected && open && aspects
                            ? chartRelationships(
                                inspectChart(c, key, selected, a.at),
                              )
                            : null
                        }
                        onPick={(pick) => choose(pick as InspectionPick, index)}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
            {open && selected && (
              <ChartSelectionReading
                chart={charts[focus]}
                lens={keys[focus]}
                pick={selected}
                mode="astrologer"
                id="comparison-selection-reading"
                onClose={() => {
                  setOpen(false);
                  setSelected(null);
                }}
              />
            )}
          </Panel>
          <Panel title="Planet-by-planet comparison">
            <Table
              caption="Positions belong to each named chart"
              columns={[
                "Planet",
                `${keys[0]} · original`,
                `${keys[1]} · ${kind === "time" ? "candidate" : "comparison"}`,
              ]}
              rows={chart.planets.map((p) => [
                p.planet,
                ...charts.map((c, i) => {
                  const key = keys[i];
                  const pos =
                    key === "D1"
                      ? c.planets.find((v) => v.planet === p.planet)!
                      : c.divisionalCharts[key].planets.find(
                          (v) => v.planet === p.planet,
                        )!;
                  return `${pos.sign} · house ${pos.house}${"degreeInSign" in pos ? ` · ${Number(pos.degreeInSign).toFixed(4)}°` : ""}`;
                }),
              ])}
            />
          </Panel>
        </>
      )}
      <p className="research-caption">
        A visual difference alone does not establish the correct birth time. Use
        documented events and the reliability assessment for that investigation.
      </p>
    </Research>
  );
}
