"use client";

import { useMemo } from "react";
import { DateTime } from "luxon";
import { useAnalysis } from "./AnalysisContext";
import { childPeriods, periodsAt, LEVEL_NAMES, type TreePeriod } from "@/lib/astrology/dashaTree";
import { timelineBoundaries, timelinePosition } from "@/lib/astrology/timelineNavigation";
import type { KundaliChart } from "@/lib/astrology/types";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { pick } from "@/lib/i18n/ui";
import { term } from "@/lib/i18n/terms";

export default function TimingStrip({ chart, go, mode }: { chart: KundaliChart; go: (slug: string) => void; mode: "user" | "astrologer" }) {
  const a = useAnalysis()!;
  const locale = useLocale();
  const L = pick(locale);
  const running = useMemo(() => periodsAt(chart.dashas, a.at, 3), [chart.dashas, a.at]);
  const boundaries = useMemo(() => timelineBoundaries(chart.dashas, a.at), [chart.dashas, a.at]);
  const fmt = (date: Date) => DateTime.fromJSDate(date).setZone(a.zone).setLocale(locale).toFormat("d LLL yyyy");
  const previewDate = (date: Date) => {
    const at = DateTime.fromMillis(Math.ceil(date.getTime() / 1000) * 1000).setZone(a.zone);
    a.update({ date: at.toISODate()!, time: at.toFormat("HH:mm:ss") });
  };
  const preview = (period: TreePeriod) => previewDate(period.start);
  const openObservations = () => {
    if (mode === "astrologer") { go("journal"); return; }
    go("summary");
    requestAnimationFrame(() => {
      const journal = document.querySelector<HTMLDetailsElement>("#overview-journal");
      if (journal) { journal.open = true; journal.scrollIntoView({ behavior: "smooth", block: "start" }); journal.querySelector("summary")?.focus(); }
    });
  };

  return <section className="workspace-timing" aria-label={L("Dasha timeline", "दशा समयरेखा")}>
    <header className="timing-heading"><div><h3>{L("Periods at your analysis date", "विश्लेषण तिथि की दशाएँ")}</h3><p>{fmt(a.at)} · {a.time.slice(0, 5)} · {a.zone}</p></div><button type="button" onClick={() => go("dashas")}>{L("All period levels", "सभी दशा स्तर")}</button></header>
    <div className="timing-navigation" role="group" aria-label={L("Move through periods", "दशाओं में जाएँ")}>
      <button type="button" disabled={!boundaries.previous} onClick={() => boundaries.previous && previewDate(boundaries.previous)}>{L("Previous boundary", "पिछली सीमा")}</button>
      <button type="button" onClick={() => { const now = DateTime.now().setZone(a.zone); a.update({ date: now.toISODate()!, time: now.toFormat("HH:mm") }); }}>{L("Today", "आज")}</button>
      <button type="button" disabled={!boundaries.next} onClick={() => boundaries.next && previewDate(boundaries.next)}>{L("Next boundary", "अगली सीमा")}</button>
    </div>
    {!running.length && <p className="mt-3 text-sm text-muted">{L("This date is outside the calculated dasha range. Choose another date.", "यह तिथि गणना की दशा सीमा से बाहर है। दूसरी तिथि चुनें।")}</p>}
    {!!running.length && <div className="timing-current" aria-label={L("Current Dasha periods", "वर्तमान दशाएँ")}>{running.map((period, index) => <div key={period.chain.join("-")}><span>{term(locale, LEVEL_NAMES[index])}</span><strong>{term(locale, period.lord)}</strong><small>{fmt(period.start)} – {fmt(period.end)}</small></div>)}</div>}
    {running.map((period, index) => {
      const list = index === 0 ? boundaries.roots : childPeriods(running[index - 1]);
      const start = list[0].start;
      const end = list[list.length - 1].end;
      const span = end.getTime() - start.getTime();
      return <div key={index} className="timing-track"><div className="timing-track-label"><span>{term(locale, LEVEL_NAMES[index])}: <strong>{term(locale, period.lord)}</strong></span><span>{fmt(period.start)} – {fmt(period.end)}</span></div>
        <div className="timing-track-scale"><div className="timing-track-segments">{list.map(item => { const active = item.start <= a.at && a.at < item.end; return <button type="button" key={item.start.toISOString()} aria-pressed={active} title={`${item.lord}: ${fmt(item.start)} – ${fmt(item.end)}`} aria-label={`${L("Preview", "देखें")} ${term(locale, item.lord)}, ${fmt(item.start)} – ${fmt(item.end)}`} onClick={() => preview(item)} style={{ flex: (item.end.getTime() - item.start.getTime()) / span }}><span>{term(locale, item.lord)}</span></button>; })}</div><span className="timing-date-marker" style={{ left: `${timelinePosition(start, end, a.at)}%` }} aria-hidden="true" /></div>
        <details className="timing-period-list"><summary>{L("Browse these periods", "ये दशाएँ देखें")}</summary><div>{list.map(item => <button type="button" key={`${item.chain.join("-")}-${item.start.toISOString()}`} aria-current={item.start <= a.at && a.at < item.end ? "date" : undefined} onClick={() => preview(item)}><span>{term(locale, item.lord)}</span><small>{fmt(item.start)} – {fmt(item.end)}</small></button>)}</div></details>
      </div>;
    })}
    <div className="timing-footer"><p>{L("The marker shows your selected instant. Periods describe activation, not a promised event; compare transits and recorded observations.", "चिह्नित रेखा चुना समय दिखाती है। दशा सक्रियता बताती है, निश्चित घटना नहीं; गोचर और दर्ज अनुभव भी देखें।")}</p><button type="button" onClick={openObservations}>{L("Open observations", "दर्ज अनुभव देखें")}</button></div>
  </section>;
}
