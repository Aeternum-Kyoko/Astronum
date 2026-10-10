"use client";

import { useState } from "react";
import Link from "next/link";
import DatePicker from "@/components/DatePicker";
import TimePicker from "@/components/TimePicker";
import { haptic } from "@/lib/haptics";
import PlaceInput, { type PlaceSuggestion } from "@/components/PlaceInput";
import { readJournal } from "@/lib/eventJournal";
import { birthInputSchema } from "@/lib/birthSchema";
import { fromBirthQuery, toBirthQuery } from "@/lib/birthParams";
import { EVENT_KEYS, EVENT_KINDS, type CandidateRun, type EventConfidence, type EventKind, type EventPrecision } from "@/lib/astrology/rectificationEvents";

interface Response {
  runs: CandidateRun[];
  strip: { time: string; score: number; lagna: string }[];
  boundaries: { time: string; what: string }[];
  maxScore: number;
  confidence: "low" | "moderate" | "strong";
  confidenceReason: string;
  warnings: string[];
  leadingCandidateCount: number;
  scoreMargin: number;
}

const WINDOWS = [15, 30, 60, 120] as const;

export default function RectificationTool() {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState<PlaceSuggestion | null>(null);
  const [span, setSpan] = useState<(typeof WINDOWS)[number]>(60);
  const [events, setEvents] = useState<{ id: number; kind: EventKind; date: string; precision: EventPrecision; confidence: EventConfidence; importance: number }[]>([
    { id: 1, kind: "marriage", date: "", precision: "day", confidence: "high", importance: 4 },
    { id: 2, kind: "career", date: "", precision: "day", confidence: "high", importance: 4 },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Response | null>(null);
  const [open, setOpen] = useState(0);

  const birth = place && name.trim() && date && time ? { name: name.trim(), date, time, place: place.displayName, latitude: place.latitude, longitude: place.longitude, timezone: place.timezone } : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const filled = events.filter((ev) => ev.date);
    if (!birth) return setError("Enter the name, approximate birth time, date and place.");
    if (!filled.length) return setError("Add the date of at least one life event.");
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/rectification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birth, window: span, events: filled.map((event) => ({ kind: event.kind, date: event.date, precision: event.precision, confidence: event.confidence, importance: event.importance })) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      setResult(json);
      haptic("success");
      setOpen(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function importChart() {
    const query = new URLSearchParams(window.location.search);
    const parsed = birthInputSchema.safeParse(fromBirthQuery(query));
    if (!parsed.success) { setError("Open this tool from a Kundli birth precision or event journal section to import its details."); return; }
    const b = parsed.data; setName(b.name); setDate(b.date); setTime(b.time);
    setPlace({displayName:b.place, latitude:b.latitude, longitude:b.longitude, timezone:b.timezone});
    const journal = readJournal(b);
    if (query.get("journal") === "1" && journal.length) setEvents(journal.map((e,i)=>({id:i+1,kind:e.kind,date:e.date,precision:e.precision,confidence:e.confidence,importance:e.importance})));
    setResult(null); setError(null);
  }
  const update = (id: number, patch: Partial<{ kind: EventKind; date: string; precision: EventPrecision; confidence: EventConfidence; importance: number }>) => setEvents(events.map((ev) => (ev.id === id ? { ...ev, ...patch } : ev)));

  return (
    <div className="space-y-8">
      <button type="button" onClick={importChart} className="rounded-full border border-gold/40 px-5 py-2 text-sm font-semibold text-gold-bright">Import linked Kundli and saved events</button>
      <form onSubmit={submit} className="card-edge rounded-3xl p-6 md:p-8">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name">
            <input value={name} onChange={(e) => setName(e.target.value)} className="input" autoComplete="name" />
          </Field>
          <Field label="Place of birth">
            <PlaceInput selected={place} onSelect={setPlace} showTimezone={false} placeholder="City, town or village" />
          </Field>
          <Field label="Date of birth">
            <DatePicker value={date} onChange={setDate} />
          </Field>
          <Field label="Approximate time of birth">
            <TimePicker value={time} onChange={setTime} />
          </Field>
        </div>

        <fieldset className="mt-6">
          <legend className="text-xs font-semibold text-muted">How unsure is the time?</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {WINDOWS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setSpan(w)}
                aria-pressed={span === w}
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${span === w ? "border-gold bg-gold text-on-gold" : "border-border text-muted hover:border-gold hover:text-cream"}`}
              >
                ± {w < 60 ? `${w} min` : `${w / 60} hour${w > 60 ? "s" : ""}`}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="text-xs font-semibold text-muted">Life events — use 5 to 8 independent events when possible. Exact dates carry more weight; uncertain events remain useful but are not allowed to dominate.</legend>
          <ul className="mt-2 space-y-3">
            {events.map((ev) => (
              <li key={ev.id} className="rounded-2xl border border-border/70 p-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_11rem_auto] sm:items-center">
                <select value={ev.kind} onChange={(e) => update(ev.id, { kind: e.target.value as EventKind })} className="input" aria-label="Event">
                  {EVENT_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {EVENT_KINDS[k].label}
                    </option>
                  ))}
                </select>
                {ev.precision === "day" ? <DatePicker value={ev.date} onChange={(d) => update(ev.id, { date: d })} /> : <input type={ev.precision === "month" ? "month" : "number"} min={ev.precision === "year" ? "1900" : undefined} max={ev.precision === "year" ? String(new Date().getFullYear()) : undefined} placeholder={ev.precision === "month" ? "YYYY-MM" : "YYYY"} value={ev.date} onChange={(e) => update(ev.id, { date: e.target.value })} className="input" aria-label="Event date" />}
                <button
                  type="button"
                  onClick={() => setEvents(events.filter((x) => x.id !== ev.id))}
                  disabled={events.length === 1}
                  className="justify-self-start rounded-full px-3 py-1.5 text-xs font-semibold text-muted hover:text-rose disabled:opacity-40"
                >
                  Remove
                </button>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3"><Field label="Date precision"><select value={ev.precision} onChange={(e) => update(ev.id, { precision: e.target.value as EventPrecision, date: "" })} className="input"><option value="day">Exact day</option><option value="month">Month only</option><option value="year">Year only</option></select></Field><Field label="How sure is the date?"><select value={ev.confidence} onChange={(e) => update(ev.id, { confidence: e.target.value as EventConfidence })} className="input"><option value="high">High confidence</option><option value="medium">Fairly sure</option><option value="low">Rough memory</option></select></Field><Field label="Event importance"><select value={ev.importance} onChange={(e) => update(ev.id, { importance: Number(e.target.value) })} className="input"><option value={1}>1 · minor</option><option value={2}>2 · modest</option><option value={3}>3 · important</option><option value={4}>4 · major</option><option value={5}>5 · defining</option></select></Field></div>
              </li>
            ))}
          </ul>
          {events.length < 12 && (
            <button
              type="button"
              onClick={() => setEvents([...events, { id: Math.max(0, ...events.map((e) => e.id)) + 1, kind: "child", date: "", precision: "day", confidence: "high", importance: 3 }])}
              className="mt-3 text-sm font-semibold text-gold-bright hover:underline"
            >
              Add another event
            </button>
          )}
        </fieldset>

        {error && (
          <p role="alert" className="mt-5 rounded-xl border border-rose/30 bg-rose/5 px-4 py-2.5 text-sm text-rose">
            {error}
          </p>
        )}
        <button type="submit" disabled={loading} className="mt-6 rounded-full bg-gold px-7 py-3 text-base font-semibold text-on-gold hover:bg-gold-bright disabled:opacity-70">
          {loading ? "Testing every minute…" : "Find my birth time"}
        </button>
      </form>

      {result && birth && <Results result={result} birth={birth} open={open} setOpen={setOpen} />}
    </div>
  );
}

function Results({ result, birth, open, setOpen }: { result: Response; birth: NonNullable<Parameters<typeof toBirthQuery>[0]>; open: number; setOpen: (n: number) => void }) {
  const best = result.runs[0];
  const range = (r: CandidateRun) => (r.from === r.to ? r.from : `${r.from}–${r.to}`);
  const tied = result.runs.filter((r) => r.best.score === result.maxScore).length;

  return (
    <div className="space-y-6" aria-live="polite">
      <section className="card-edge rounded-3xl p-7">
        <p className="text-sm font-semibold text-muted">Leading candidate range</p>
        <p className="font-display mt-1 text-5xl text-gold-bright">{range(best)}</p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          {best.best.lagna} Lagna, {best.best.navamsaLagna} Navamsa lagna, Moon in {best.best.moonNakshatra}. Scores {best.best.score} points across your events
          {tied > 1 ? `, tied with ${tied - 1} other window${tied > 2 ? "s" : ""} — add another event to separate them` : ""}.
        </p>
        <p className={`mt-4 rounded-xl border px-4 py-3 text-sm ${result.confidence === "strong" ? "border-gold/50 bg-gold/5 text-cream" : result.confidence === "moderate" ? "border-border bg-surface/60 text-muted" : "border-rose/30 bg-rose/5 text-muted"}`}><strong className="text-cream">{result.confidence === "strong" ? "Stronger evidence" : result.confidence === "moderate" ? "Moderate evidence" : "Low evidence"}:</strong> {result.confidenceReason}</p>
        {result.warnings?.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">{result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>}
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={`/kundali?${toBirthQuery({ ...birth, date: best.best.date, time: best.best.time })}`} className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-on-gold hover:bg-gold-bright">
            Open the chart for {best.best.time}
          </Link>
          <Link href="/consultation" className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-cream hover:border-gold hover:text-gold-bright">
            Have an astrologer confirm it
          </Link>
        </div>
      </section>

      <section className="card-edge rounded-2xl p-6">
        <h3 className="text-lg font-bold text-cream">Score for every minute</h3>
        <p className="mt-1 text-sm text-muted">Taller bars fit the weighted event evidence better. Gold marks the leading score; it is not proof of an exact minute.</p>
        <div className="mt-4 flex h-28 items-end gap-px" role="img" aria-label={`Scores from ${result.strip[0].time} to ${result.strip[result.strip.length - 1].time}; best ${result.maxScore} at ${range(best)}`}>
          {result.strip.map((s) => (
            <div
              key={s.time}
              title={`${s.time} · ${s.lagna} · ${s.score}`}
              className={`flex-1 rounded-t-sm ${s.score === result.maxScore ? "bg-gold" : "bg-border"}`}
              style={{ height: `${Math.max(4, (s.score / Math.max(1, result.maxScore)) * 100)}%` }}
            />
          ))}
        </div>
        <div className="font-tabular mt-1 flex justify-between text-xs text-muted">
          <span>{result.strip[0].time}</span>
          <span>{birth.time} (given)</span>
          <span>{result.strip[result.strip.length - 1].time}</span>
        </div>
        {result.boundaries.some((b) => b.what.startsWith("Lagna")) && (
          <ul className="mt-4 space-y-1 text-sm text-cream">
            {result.boundaries
              .filter((b) => b.what.startsWith("Lagna"))
              .map((b) => (
                <li key={b.time + b.what}>
                  <span className="font-tabular font-semibold text-rose">{b.time}</span> {b.what}. Births on either side of this line have very different charts.
                </li>
              ))}
          </ul>
        )}
      </section>

      <section className="card-edge rounded-2xl p-6">
        <h3 className="text-lg font-bold text-cream">Best candidates and why</h3>
        <ol className="mt-3 divide-y divide-border">
          {result.runs.map((r, i) => (
            <li key={r.from} className="py-3">
              <button type="button" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i} className="flex w-full flex-wrap items-baseline justify-between gap-2 text-left">
                <span className="font-tabular text-lg font-semibold text-cream">{range(r)}</span>
                <span className="text-sm text-muted">
                  {r.best.lagna} Lagna · D9 {r.best.navamsaLagna} · <span className="font-semibold text-gold-bright">{r.best.score} pts</span>
                </span>
              </button>
              {open === i && (
                <ul className="mt-3 space-y-3">
                  {r.best.events.map((e, j) => (
                    <li key={`${e.kind}-${e.date}-${j}`} className="rounded-xl border border-border/70 p-4">
                      <p className="flex flex-wrap justify-between gap-2 text-sm">
                        <span className="font-semibold text-cream">
                          {EVENT_KINDS[e.kind].label} · {e.date}
                        </span>
                        <span className="text-muted">
                          Dasha {e.chain.join(" › ")} · <span className="font-semibold text-gold-bright">{e.points} weighted pts</span>
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-muted">Looks for natal promise, houses {EVENT_KINDS[e.kind].houses.join(", ")}, the {EVENT_KINDS[e.kind].varga}, dasha links, and slow-planet transits. Evidence weight: {Math.round(e.evidenceWeight * 100)}%.</p>
                      {e.reasons.length ? (
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
                          {e.reasons.map((why, k) => (
                            <li key={k}>{why}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-rose">Nothing in this chart points to the event on this date.</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted">{label}</span>
      {children}
    </label>
  );
}
