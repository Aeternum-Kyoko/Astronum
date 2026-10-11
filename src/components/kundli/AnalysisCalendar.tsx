"use client";
import { DateTime } from "luxon";
import { useAnalysis } from "./AnalysisContext";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { pick } from "@/lib/i18n/ui";
export default function AnalysisCalendar() {
  const a = useAnalysis(); const L = pick(useLocale());
  if (!a) return null;
  const step = (days: number) => a.update({ date: DateTime.fromISO(a.date, { zone: a.zone }).plus({ days }).toISODate()! });
  return <div className="analysis-calendar"><span className="text-xs text-muted">{L("Analysis date", "विश्लेषण तिथि")}</span><button type="button" onClick={() => step(-1)} aria-label={L("Previous day", "पिछला दिन")}>‹</button><input aria-label={L("Analysis date", "विश्लेषण तिथि")} type="date" value={a.date} onInput={e => { if (DateTime.fromISO(e.currentTarget.value).isValid) a.update({ date: e.currentTarget.value }); }} /><input aria-label={L("Analysis time", "विश्लेषण समय")} type="time" step={1} value={a.time} onInput={e => { if (e.currentTarget.value) a.update({ time: e.currentTarget.value }); }} /><button type="button" onClick={() => step(1)} aria-label={L("Next day", "अगला दिन")}>›</button><button type="button" onClick={() => a.update({ date: a.today, time: "12:00" })}>{L("Today", "आज")}</button><span className="text-[11px] text-muted">{a.zone}</span></div>;
}
