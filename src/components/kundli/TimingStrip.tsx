"use client";
import { useMemo } from "react";
import { DateTime } from "luxon";
import { useAnalysis } from "./AnalysisContext";
import { childPeriods, periodsAt, LEVEL_NAMES, type TreePeriod } from "@/lib/astrology/dashaTree";
import type { KundaliChart } from "@/lib/astrology/types";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { pick } from "@/lib/i18n/ui";
import { term } from "@/lib/i18n/terms";
export default function TimingStrip({ chart, go }: { chart: KundaliChart; go: (slug: string) => void }) {
  const a = useAnalysis()!; const locale = useLocale(); const L = pick(locale);
  const running = useMemo(() => periodsAt(chart.dashas, a.at, 3), [chart.dashas, a.at]);
  const roots: TreePeriod[] = chart.dashas.map(p => ({ ...p, start: new Date(p.start), end: new Date(p.end), chain: [p.lord] }));
  const fmt = (d: Date) => DateTime.fromJSDate(d).setZone(a.zone).setLocale(locale).toFormat("d LLL yyyy");
  const preview = (p: TreePeriod) => { const at = DateTime.fromMillis(Math.ceil(p.start.getTime() / 1000) * 1000).setZone(a.zone); a.update({ date: at.toISODate()!, time: at.toFormat("HH:mm:ss") }); };
  return <section className="workspace-timing" aria-label={L("Dasha timeline", "दशा समयरेखा")}><div className="flex flex-wrap items-center justify-between gap-2"><h3>{L("Periods at your analysis date", "विश्लेषण तिथि की दशाएँ")}</h3><button type="button" onClick={() => go("dashas")} className="text-xs text-gold-bright">{L("Explore all five levels", "सभी पाँच स्तर देखें")}</button></div>
    {!running.length && <p className="mt-2 text-sm text-muted">{L("This date is outside the calculated dasha range. Choose another date.", "यह तिथि गणना की दशा सीमा से बाहर है। दूसरी तिथि चुनें।")}</p>}
    {!!running.length && <div className="timing-current" aria-label={L("Current Dasha periods", "वर्तमान दशाएँ")}>{running.map((p, i) => <div key={i}><span>{term(locale, LEVEL_NAMES[i])}</span><strong>{term(locale, p.lord)}</strong><small>{fmt(p.start)} – {fmt(p.end)}</small></div>)}</div>}
    {running.map((p, i) => { const list = i === 0 ? roots.filter(x => x.end > new Date(p.start.getTime() - 20 * 365.25 * 86400000) && x.start < new Date(p.end.getTime() + 20 * 365.25 * 86400000)) : childPeriods(running[i - 1]); const start = list[0].start.getTime(); const span = list[list.length - 1].end.getTime() - start; return <div key={i} className="timing-track"><div className="flex flex-wrap justify-between gap-1 text-xs"><span className="text-cream">{term(locale, LEVEL_NAMES[i])}: <strong>{term(locale, p.lord)}</strong></span><span className="text-muted">{fmt(p.start)} – {fmt(p.end)}</span></div><div className="flex min-h-8 gap-px overflow-hidden rounded-md">{list.map(x => { const active = x.start <= a.at && a.at < x.end; return <button type="button" key={x.start.toISOString()} aria-pressed={active} title={`${x.lord}: ${fmt(x.start)} – ${fmt(x.end)}`} aria-label={`${L("Preview", "देखें")} ${x.lord}, ${fmt(x.start)} – ${fmt(x.end)}`} onClick={() => preview(x)} style={{ flex: (x.end.getTime() - x.start.getTime()) / span }} className={active ? "bg-gold px-1 text-[10px] font-semibold text-on-gold" : "bg-surface-raised px-1 text-[10px] text-muted hover:bg-gold/25"}><span className="block truncate">{term(locale, x.lord)}</span></button>; })}</div></div>; })}
    <p className="mt-3 text-xs text-muted">{L("The highlighted period contains your analysis date. Select a segment to inspect its start; Today restores the current date.", "चिह्नित दशा में आपकी विश्लेषण तिथि आती है। आरंभ देखने के लिए कोई खंड चुनें; आज से वर्तमान तिथि लौटेगी।")}</p>
  </section>;
}
