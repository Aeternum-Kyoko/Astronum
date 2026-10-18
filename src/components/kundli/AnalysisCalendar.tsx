"use client";

import { useState } from "react";
import { DateTime } from "luxon";
import { useAnalysis } from "./AnalysisContext";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { pick } from "@/lib/i18n/ui";

export default function AnalysisCalendar({ compact = false }: { compact?: boolean }) {
  const a = useAnalysis();
  const locale = useLocale();
  const L = pick(locale);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [viewMonth, setViewMonth] = useState<string | null>(null);
  if (!a) return null;
  const selected = DateTime.fromISO(a.date, { zone: a.zone });
  const month = DateTime.fromISO(viewMonth ?? a.date, { zone: a.zone }).startOf("month");
  const step = (days: number) => a.update({ date: selected.plus({ days }).toISODate()! });
  const choose = (date: DateTime) => { a.update({ date: date.toISODate()! }); setOpen(false); setViewMonth(null); };
  const days = Array.from({ length: month.daysInMonth ?? 30 }, (_, i) => month.plus({ days: i }));
  const blanks = (month.weekday + 6) % 7;
  const setTime = (time: string) => a.update({ time });
  return <div className={`analysis-calendar${compact ? " analysis-calendar-compact" : ""}`} data-expanded={expanded} aria-label={L("Analysis date and time", "विश्लेषण तिथि और समय")}>
    {compact && <button className="analysis-compact-trigger" type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}><span>{L("Reading for", "विश्लेषण तिथि")} <strong>{selected.setLocale(locale).toFormat("d LLL yyyy")} · {a.time.slice(0, 5)}</strong></span><span>{expanded ? L("Done", "पूरा") : L("Change date", "तिथि बदलें")}</span></button>}
    <div className="analysis-date-main"><span>{L("Explore a date", "तिथि देखें")}</span><div className="analysis-date-actions"><button type="button" onClick={() => step(-1)} aria-label={L("Previous day", "पिछला दिन")}>‹</button><button className="analysis-date-current" type="button" onClick={() => { setViewMonth(a.date); setOpen(!open); }} aria-expanded={open} aria-controls="analysis-date-calendar">{selected.setLocale(locale).toFormat("ccc, d LLL yyyy")} <span aria-hidden="true">▦</span></button><button type="button" onClick={() => step(1)} aria-label={L("Next day", "अगला दिन")}>›</button></div></div>
    <div className="analysis-time-main"><span>{L("Time", "समय")}</span><div className="analysis-time-actions"><button type="button" aria-pressed={a.time === "06:00"} onClick={() => setTime("06:00")}>{L("Morning", "सुबह")}</button><button type="button" aria-pressed={a.time === "12:00"} onClick={() => setTime("12:00")}>{L("Noon", "दोपहर")}</button><button type="button" aria-pressed={a.time === "18:00"} onClick={() => setTime("18:00")}>{L("Evening", "शाम")}</button><label><span className="sr-only">{L("Exact analysis time", "सटीक विश्लेषण समय")}</span><input aria-label={L("Exact analysis time", "सटीक विश्लेषण समय")} type="time" step={60} value={a.time.slice(0, 5)} onChange={e => { if (e.currentTarget.value) setTime(e.currentTarget.value); }} /></label></div></div>
    <button className="analysis-today" type="button" onClick={() => { a.update({ date: a.today, time: "12:00" }); setOpen(false); }}>{L("Today", "आज")}</button>
    {open && <div className="analysis-date-popover" id="analysis-date-calendar"><div className="calendar-month"><button type="button" aria-label={L("Previous month", "पिछला महीना")} onClick={() => setViewMonth(month.minus({ months: 1 }).toISODate())}>‹</button><strong>{month.setLocale(locale).toFormat("LLLL yyyy")}</strong><button type="button" aria-label={L("Next month", "अगला महीना")} onClick={() => setViewMonth(month.plus({ months: 1 }).toISODate())}>›</button></div><div className="analysis-month-grid">{(locale === "hi" ? ["सो", "मं", "बु", "गु", "शु", "श", "र"] : ["M", "T", "W", "T", "F", "S", "S"]).map((day, i) => <span key={i}>{day}</span>)}{Array.from({ length: blanks }, (_, i) => <span key={`blank-${i}`} />)}{days.map(day => <button type="button" key={day.toISODate()} aria-pressed={day.toISODate() === a.date} onClick={() => choose(day)}>{day.day}</button>)}</div><p>{a.zone}</p></div>}
  </div>;
}
