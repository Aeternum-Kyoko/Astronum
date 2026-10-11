"use client";
import { useAnalysis } from "./kundli/AnalysisContext";
import { useState } from "react";
import { DateTime } from "luxon";
import KundliChart, { type ChartPick, type ChartStyle } from "./KundliChart";
import type { KundaliChart } from "@/lib/astrology/types";
import { VARGA_KEYS, type VargaKey } from "@/lib/astrology/constants";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { pick } from "@/lib/i18n/ui";
import { term } from "@/lib/i18n/terms";

export default function ChartComparisonPanel({ chart }: { chart: KundaliChart }) {
  const locale = useLocale(); const L = pick(locale);
  const analysis = useAnalysis();
  const [ownLeft, setOwnLeft] = useState<VargaKey>("D1"); const [ownRight, setOwnRight] = useState<VargaKey>("D9");
  const [ownStyle, setOwnStyle] = useState<ChartStyle>("north"); const [ownSelection, setOwnSelection] = useState<ChartPick | null>(null);
  const left = analysis?.primary ?? ownLeft; const right = analysis && analysis.secondary !== "transit" ? analysis.secondary : ownRight;
  const style = analysis?.style ?? ownStyle; const selection = analysis?.selected ?? ownSelection;
  const setLeft = (primary: VargaKey) => analysis ? analysis.update({ primary }) : setOwnLeft(primary);
  const setRight = (secondary: VargaKey) => analysis ? analysis.update({ secondary }) : setOwnRight(secondary);
  const setStyle = (style: ChartStyle) => analysis ? analysis.update({ style }) : setOwnStyle(style);
  const setSelection = (selected: ChartPick) => analysis ? analysis.update({ selected }) : setOwnSelection(selected);
  const [offset, setOffset] = useState(5); const [candidate, setCandidate] = useState<KundaliChart | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const [timeVarga, setTimeVarga] = useState<VargaKey>("D9");
  const [kind, setKind] = useState<"varga" | "time">("varga");
  async function compareTime() {
    setBusy(true); setError("");
    try {
      const at = DateTime.fromISO(`${chart.input.date}T${chart.input.time}`, { zone: chart.input.timezone }).plus({ minutes: offset });
      const res = await fetch("/api/kundali", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...chart.input, date: at.toISODate(), time: at.toFormat(chart.input.time.length > 5 ? "HH:mm:ss" : "HH:mm"), locale }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error); setCandidate(data.chart);
    } catch (err) { setError(err instanceof Error ? err.message : L("Could not compare times.", "समय की तुलना नहीं हो सकी।")); }
    finally { setBusy(false); }
  }
  const second = kind === "time" && candidate ? candidate : chart;
  const keys: [VargaKey, VargaKey] = kind === "time" ? [timeVarga, timeVarga] : [left, right];
  const charts = [chart, second];
  const selectedPlanet = selection?.kind === "planet" ? selection.planet : null;
  return <div className="space-y-6" data-no-swipe>
    <header><h2 className="text-3xl font-bold text-cream">{L("Compare charts", "कुंडलियों की तुलना")}</h2><p className="mt-2 text-sm text-muted">{L("Choose two divisional charts or compare the entered birth time with another candidate. Select a planet to highlight it in both.", "दो वर्ग कुंडलियाँ चुनें या दर्ज जन्म-समय की तुलना दूसरे समय से करें। ग्रह चुनने पर दोनों में दिखेगा।")}</p></header>
    <div className="flex flex-wrap items-end gap-4"><label className="text-sm text-cream">{L("Comparison", "तुलना")}<select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className="input mt-2"><option value="varga">{L("Divisional charts", "वर्ग कुंडलियाँ")}</option><option value="time">{L("Birth-time candidates", "संभावित जन्म-समय")}</option></select></label>
      {kind === "varga" ? <>{[[left, setLeft, L("Left chart", "बाईं कुंडली")], [right, setRight, L("Right chart", "दाईं कुंडली")]].map(([value, setter, label], i) => <label key={i} className="text-sm text-cream">{label as string}<select className="input mt-2" value={value as string} onChange={(e) => (setter as (key: VargaKey) => void)(e.target.value as VargaKey)}>{VARGA_KEYS.map((key) => <option key={key}>{key}</option>)}</select></label>)}</> : <><label className="text-sm text-cream">{L("Chart for both times", "दोनों समयों की कुंडली")}<select className="input mt-2" value={timeVarga} onChange={e=>setTimeVarga(e.target.value as VargaKey)}>{VARGA_KEYS.map(key=><option key={key}>{key}</option>)}</select></label><label className="text-sm text-cream">{L("Minutes from entered time", "दर्ज समय से मिनट")}<input disabled={busy} type="number" min={-120} max={120} step={1} value={offset} onChange={(e) => { setOffset(Number(e.target.value)); setCandidate(null); }} className="input mt-2 max-w-40" /></label><button type="button" disabled={busy || !Number.isInteger(offset) || Math.abs(offset) > 120} onClick={compareTime} className="rounded-full bg-gold px-5 py-3 text-sm font-semibold text-on-gold disabled:opacity-50">{busy ? L("Calculating…", "गणना…") : L("Compare time", "समय की तुलना")}</button></>}
    </div>
    {error && <p role="alert" className="text-sm text-rose">{error}</p>}
    {kind === "time" && !candidate ? <p className="rounded-xl border border-border p-5 text-sm text-muted">{L("Calculate a candidate to see the comparison.", "तुलना देखने के लिए संभावित समय की गणना करें।")}</p> : <>
      <div className="grid gap-6 xl:grid-cols-2">{charts.map((c, i) => { const key = keys[i]; const v = c.divisionalCharts[key]; return <section key={i} className="min-w-0 rounded-2xl border border-border p-4"><h3 className="mb-3 font-semibold text-cream">{key} · {c.input.date} {c.input.time}</h3><KundliChart ascendantSignIndex={key === "D1" ? c.ascendant.signIndex : v.ascendant.signIndex} planets={key === "D1" ? c.planets : v.planets} style={style} onStyleChange={setStyle} toggleId={`compare-${i}`} selected={selection} onPick={setSelection} /><p className="mt-3 text-sm text-muted">{L("Ascendant", "लग्न")}: {term(locale, key === "D1" ? c.ascendant.sign : v.ascendant.sign)}</p></section>; })}</div>
      <div className="overflow-x-auto rounded-2xl border border-border"><table className="w-full text-left text-sm"><caption className="p-4 text-left font-semibold text-cream">{L("Planet-by-planet comparison", "ग्रहों की तुलना")}</caption><thead className="text-xs text-muted"><tr><th className="p-3">{L("Planet", "ग्रह")}</th>{keys.map((key, i) => <th key={i} className="p-3">{key} · {charts[i].input.time}</th>)}</tr></thead><tbody>{chart.planets.map((p) => <tr key={p.planet} className={`border-t border-border ${selectedPlanet === p.planet ? "bg-gold/10" : ""}`}><th className="p-3"><button type="button" onClick={() => setSelection({ kind: "planet", planet: p.planet })} className="text-gold-bright">{term(locale, p.planet)}</button></th>{charts.map((c, i) => { const position = keys[i] === "D1" ? c.planets.find((v) => v.planet === p.planet)! : c.divisionalCharts[keys[i]].planets.find((v) => v.planet === p.planet)!; return <td key={i} className="p-3 text-muted">{term(locale, position.sign)} · {L("House", "भाव")} {position.house}{"degreeInSign" in position && typeof position.degreeInSign === "number" ? ` · ${position.degreeInSign.toFixed(4)}°` : ""}</td>; })}</tr>)}</tbody></table></div>
    </>}
    <p className="text-xs text-muted">{L("Changing a candidate here does not change the original chart. A visual difference alone does not establish the correct birth time.", "यहाँ संभावित समय बदलने से मूल कुंडली नहीं बदलती। केवल दृश्य अंतर से सही जन्म-समय तय नहीं होता।")}</p>
  </div>;
}
