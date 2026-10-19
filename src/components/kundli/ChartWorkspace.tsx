"use client";
import { useMemo } from "react";
import { useAnalysis } from "./AnalysisContext";
import KundliChart, { type ChartPoint } from "../KundliChart";
import type { KundaliChart } from "@/lib/astrology/types";
import { type VargaKey } from "@/lib/astrology/constants";
import { overlayPoints } from "@/lib/astrology/chartOverlay";
import { natalMarkers } from "@/lib/astrology/chartMarkers";
import { vargaInfo } from "@/lib/astrology/content";
import { useDeviceStore } from "@/lib/useDeviceStore";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { pick } from "@/lib/i18n/ui";
import { term } from "@/lib/i18n/terms";
import InspectorPanel from "./InspectorPanel";
import SelectedChartAnalysis from "./SelectedChartAnalysis";
import ChartPicker, { ChartStyleButtons } from "./ChartPicker";
import TransitModifiersPanel from "../TransitModifiersPanel";
import BirthReliabilityBadge from "./BirthReliabilityBadge";
import { chartRelationships, inspectChart, type InspectionPick } from "@/lib/astrology/chartInspection";

export default function ChartWorkspace({ chart, mode, go, transitOnly = false }: { chart: KundaliChart; mode: "user" | "astrologer"; go: (slug: string) => void; transitOnly?: boolean }) {
  const a = useAnalysis()!; const locale = useLocale(); const L = pick(locale); const n = (s: string) => term(locale, s);
  const { open: inspectorOpen, side: inspectionSide } = a.inspector;
  const setInspectorOpen = (open: boolean) => a.setInspector({ ...a.inspector, open });
  const setInspectionSide = (side: "primary" | "secondary") => a.setInspector({ ...a.inspector, side });
  const select = (selected: typeof a.selected) => { a.setFocusedEvidence(null); a.setInspector({ side: "primary", open: true }); a.update({ selected }); };
  const inspectedKey = a.compare && inspectionSide === "secondary" ? a.secondary : a.primary;
  const focus = a.focusedEvidence;
  const focusedPick = focus?.evidence.destination.pick;
  const showingFocus = focus && inspectedKey === focus.evidence.destination.chart && focusedPick?.kind === a.selected?.kind && (focusedPick?.kind === "planet" ? focusedPick.planet === (a.selected?.kind === "planet" ? a.selected.planet : null) : focusedPick?.house === (a.selected?.kind === "house" ? a.selected.house : null));
  const returnToReading = () => {
    if (!focus) return;
    const { returnTab, evidence } = focus;
    a.setFocusedEvidence(null);
    a.setInspector({ open: false, side: "primary" });
    go(returnTab);
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-evidence-id="${CSS.escape(evidence.id)}"] summary`)?.focus());
  };
  const transits = a.transits;
  const transitPoints = overlayPoints(transits, chart.ascendant.signIndex);
  const marks = useMemo(() => natalMarkers(chart), [chart]);
  const primaryRelations = useMemo(() => a.selected && (a.primary !== "D1" || a.reference === "lagna") ? chartRelationships(inspectChart(chart, a.primary, a.selected as InspectionPick, a.at)) : null, [chart, a.primary, a.reference, a.selected, a.at]);
  const secondaryRelations = useMemo(() => a.selected && a.secondary !== "transit" ? chartRelationships(inspectChart(chart, a.secondary, a.selected as InspectionPick, a.at)) : null, [chart, a.secondary, a.selected, a.at]);
  const points = (key: VargaKey): ChartPoint[] => key === "D1" ? chart.planets.map(p => ({ ...p, markers: marks[p.planet], layer: a.overlay ? "natal" : undefined })) : chart.divisionalCharts[key].planets;
  const selected = a.selected?.kind === "planet" ? a.selected.planet : null;
  const filtered = transitPoints.filter(p => a.filter === "all" || (a.filter === "slow" ? ["Mars", "Jupiter", "Saturn", "Rahu", "Ketu"].includes(p.planet) : p.planet === selected));
  const primary = a.primary;
  const referenceSign = primary !== "D1" ? chart.divisionalCharts[primary].ascendant.signIndex : a.reference === "moon" ? chart.planets.find(p => p.planet === "Moon")!.signIndex : a.reference === "lalkitab" ? 0 : chart.ascendant.signIndex;
  const natalPoints = points(primary).map(p => {
    if (primary !== "D1" || a.reference === "lagna") return p;
    const house = a.reference === "moon" ? ((p.signIndex - referenceSign + 12) % 12) + 1 : a.reference === "chalit" ? chart.chalitHouses.find(h => h.planet === p.planet)!.house : p.house;
    return { ...p, house, signIndex: a.reference === "chalit" || a.reference === "lalkitab" ? (referenceSign + house - 1) % 12 : p.signIndex };
  });
  const left = [...natalPoints, ...(a.overlay && primary === "D1" ? filtered : [])];
  const natal = chart.planets.find(p => p.planet === selected);
  const transit = transits.find(p => p.planet === selected);
  const house = a.selected?.kind === "house" ? a.selected.house : natal?.house ?? 1;
  const [notes, saveNotes] = useDeviceStore<Record<string, string>>(`kundli-notes:${chart.utcDate}:${chart.input.latitude}`, {});
  const noteKey = `${inspectedKey}:${selected ? `planet:${selected}` : `house:${house}`}`;
  const pickChart = (key: VargaKey, second?: VargaKey | "transit") => a.update({ primary: key, reference: "lagna", ...(second ? { secondary: second, compare: true } : {}) });
  const openPersonalChart = (slug: string, update: Parameters<typeof a.update>[0]) => { go(slug); a.update(update); };
  if (transitOnly) return <section className="chart-workspace transit-only-workspace" aria-label={L("Transit chart", "गोचर कुंडली")}>
    <div className="transit-chart-heading"><div><span className="transit-orbit" aria-hidden="true">◎</span><div><h2>{L("The sky in motion", "गतिमान आकाश")}</h2><p>{L("Transit positions in your natal houses", "जन्म भावों में गोचर स्थितियाँ")} · {a.date} {a.time}</p></div></div><ChartStyleButtons value={a.style} onChange={style => a.update({ style })} /></div>
    <div className="transit-filter" role="group" aria-label={L("Transit planets", "गोचर ग्रह")}>
      {(["all", "slow", "selected"] as const).map(filter => <button key={filter} type="button" aria-pressed={a.filter === filter} onClick={() => a.update({ filter })}>{filter === "all" ? L("All planets", "सभी ग्रह") : filter === "slow" ? L("Slow planets", "धीमे ग्रह") : L("Selected planet", "चुना ग्रह")}</button>)}
    </div>
    {a.filter === "selected" && !selected && <p className="transit-filter-hint">{L("Choose a planet below to see its transit.", "उसका गोचर देखने के लिए नीचे ग्रह चुनें।")}</p>}
    <div className="transit-solo-chart"><KundliChart ascendantSignIndex={chart.ascendant.signIndex} planets={filtered} style={a.style} selected={a.selected} onPick={select} ariaLabel={L("Transit-only chart in natal houses", "जन्म भावों में केवल गोचर कुंडली")} /></div>
    <div className="transit-planet-rail" role="group" aria-label={L("Inspect transit planet", "गोचर ग्रह देखें")}>{transits.map(p => <button type="button" key={p.planet} aria-pressed={selected === p.planet} onClick={() => select({ kind: "planet", planet: p.planet })}><strong>{n(p.planet)}</strong><span>{n(p.sign)} · {p.degree.toFixed(1)}°</span></button>)}</div>
    <button type="button" className="inspector-trigger" aria-expanded={inspectorOpen} onClick={() => setInspectorOpen(true)}>{L("Planet and house details", "ग्रह और भाव विवरण")}</button>
    <InspectorPanel open={inspectorOpen} onClose={() => setInspectorOpen(false)}><h3>{selected ? n(selected) : L("Transit details", "गोचर विवरण")}</h3>{transit && <p className="mt-3 text-sm text-muted">{n(transit.sign)} · {transit.degree.toFixed(2)}° · {L("Natal house", "जन्म भाव")} {transit.houseFromLagna}</p>}<TransitModifiersPanel chart={chart} transits={transits} at={a.at} detailed={mode === "astrologer"} selectedPlanet={selected ?? undefined} /></InspectorPanel>
  </section>;
  return <section className={`chart-workspace ${mode === "astrologer" ? "expert-charts" : ""}`} aria-label={L("Chart workspace", "कुंडली कार्यक्षेत्र")}>
    {mode === "user" ? (
      <div className="chart-workspace-toolbar user-chart-toolbar">
        <div className="user-chart-choices" role="group" aria-label={L("Choose chart", "कुंडली चुनें")}>
          <button type="button" aria-pressed={primary === "D1" && !a.overlay} onClick={() => openPersonalChart("rasi", { primary: "D1", reference: "lagna", overlay: false, compare: false })}>{L("Birth chart", "जन्म कुंडली")} <span>D1</span></button>
          <button type="button" aria-pressed={primary === "D9" && !a.overlay} onClick={() => openPersonalChart("navamsa", { primary: "D9", overlay: false, compare: false })}>{L("Navamsa", "नवांश")} <span>D9</span></button>
          <button type="button" aria-pressed={a.overlay} onClick={() => openPersonalChart("transits", { primary: "D1", reference: "lagna", overlay: true, compare: false })}>{L("Transits", "गोचर")}</button>

        </div>
        <ChartStyleButtons value={a.style} onChange={style => a.update({ style })} />
      </div>
    ) : (
    <div className="chart-workspace-toolbar">

      <ChartStyleButtons value={a.style} onChange={style => a.update({ style })} />
      <div className="chart-reference-buttons" role="group" aria-label={L("D1 reference", "D1 आधार")}>{([ ["lagna", L("Lagna", "लग्न")], ["moon", L("Moon", "चंद्र")], ["chalit", L("Bhava Chalit", "भाव चलित")], ["lalkitab", L("Lal Kitab", "लाल किताब")] ] as const).map(([reference, label]) => <button type="button" key={reference} disabled={primary !== "D1"} aria-pressed={a.reference === reference} onClick={() => a.update({ reference, overlay: false })}>{label}</button>)}</div>
      <label className="overlay-switch"><input type="checkbox" checked={a.overlay && primary === "D1"} onChange={e => a.update({ overlay: e.target.checked, primary: "D1", reference: "lagna" })} />{L("Transit overlay", "गोचर परत")}</label>
      <label className="overlay-switch"><input type="checkbox" checked={a.compare} onChange={e => a.update({ compare: e.target.checked })} />{L("Compare", "तुलना")}</label>
    </div>
    )}
    <ChartPicker value={primary} label={L("Choose a chart", "कुंडली चुनें")} onChange={key => {
      if (key === "transit") return;
      a.setInspector({ side: "primary", open: true });
      if (mode === "user") openPersonalChart(key === "D1" ? "rasi" : key === "D9" ? "navamsa" : "vargas", { primary: key, reference: "lagna", overlay: false, compare: false });
      else pickChart(key);
    }} />
    {mode === "astrologer" && <div className="workspace-presets">{[["D1 + D9", "D9"], [L("Career · D10", "करियर · D10"), "D10"], [L("D1 + Transit", "D1 + गोचर"), "transit"]].map(([label, key]) => <button key={key} type="button" onClick={() => pickChart("D1", key as VargaKey | "transit")}>{label}</button>)}</div>}
    {a.overlay && primary === "D1" && <div className="overlay-legend"><span className="text-gold-bright">● {L("Natal", "जन्म")}</span><span className="text-[#55B6A4]">◇ {L("Transit", "गोचर")}</span><div className="overlay-filter-buttons" role="group" aria-label={L("Transit planet filter", "गोचर ग्रह चयन")}>{(["all", "slow", "selected"] as const).map(filter => <button type="button" key={filter} aria-pressed={a.filter === filter} onClick={() => a.update({ filter })}>{filter === "all" ? L("All planets", "सभी ग्रह") : filter === "slow" ? L("Slow planets", "धीमे ग्रह") : L("Selected planet", "चुना ग्रह")}</button>)}</div><span className="text-xs text-muted">{a.date} {a.time}</span></div>}
    {a.overlay && a.filter === "selected" && !selected && <p className="px-4 pt-3 text-xs text-muted">{L("Select a natal planet to show its transit position.", "गोचर स्थिति देखने के लिए जन्म ग्रह चुनें।")}</p>}
    <div className={a.compare ? "workspace-chart-pair" : "workspace-chart-single"}>
      <div className="workspace-chart"><h3>{primary} {a.overlay && primary === "D1" ? L("with transits", "गोचर सहित") : primary === "D1" ? a.reference === "lagna" ? L("natal · Lagna", "जन्म · लग्न") : a.reference === "moon" ? L("natal · Moon reference", "जन्म · चंद्र आधार") : a.reference === "chalit" ? L("natal · Bhava Chalit", "जन्म · भाव चलित") : L("natal · Lal Kitab", "जन्म · लाल किताब") : L("natal", "जन्म")}</h3>{primary !== "D1" && <BirthReliabilityBadge chart={chart} varga={primary} go={go} />}<KundliChart ascendantSignIndex={referenceSign} planets={left} style={a.style} selected={a.selected} relationships={primaryRelations} onPick={select} ariaLabel={a.overlay && primary === "D1" ? L("D1 birth chart with transit positions", "गोचर स्थितियों सहित D1 जन्म कुंडली") : `${primary} ${vargaInfo(primary, locale).title} · ${a.style === "north" ? L("North Indian", "उत्तर भारतीय") : L("South Indian", "दक्षिण भारतीय")}`} /></div>
      {a.compare && <div className="workspace-chart"><ChartPicker value={a.secondary} label={L("Compare with", "तुलना करें")} transit onChange={secondary => a.update({ secondary })} />{a.secondary !== "D1" && a.secondary !== "transit" && <BirthReliabilityBadge chart={chart} varga={a.secondary} go={go} />}<KundliChart ascendantSignIndex={a.secondary === "transit" || a.secondary === "D1" ? chart.ascendant.signIndex : chart.divisionalCharts[a.secondary].ascendant.signIndex} planets={a.secondary === "transit" ? filtered : points(a.secondary)} style={a.style} selected={a.selected} relationships={secondaryRelations} onPick={selected => { a.setInspector({ side: "secondary", open: true }); a.update({ selected }); }} ariaLabel={a.secondary === "transit" ? L("Transit chart in natal houses", "जन्म भावों में गोचर कुंडली") : `${a.secondary} ${vargaInfo(a.secondary, locale).title} · ${L("comparison chart", "तुलना कुंडली")}`} /></div>}
    </div>
    <button type="button" className="inspector-trigger" aria-expanded={inspectorOpen} onClick={() => setInspectorOpen(!inspectorOpen)}>{L("Planet and house details", "ग्रह और भाव विवरण")}</button>
    <InspectorPanel open={inspectorOpen} onClose={() => setInspectorOpen(false)}>
      {showingFocus && <div className="evidence-focus"><span>{L("Following this claim", "इस कथन का आधार")}</span><p>{focus.evidence.statement}</p><small>{focus.evidence.observation}</small><div className="evidence-actions"><button type="button" onClick={() => { a.setFocusedEvidence(null); a.setInspector({ open: false, side: "primary" }); go(focus.evidence.sourceTab); }}>{L("Open calculation section", "गणना भाग खोलें")}</button><button type="button" onClick={returnToReading}>{L("Back to reading", "व्याख्या पर लौटें")}</button></div></div>}
      {a.compare && <div className="inspector-picks" role="group" aria-label={L("Inspection chart", "विश्लेषण कुंडली")}><button type="button" aria-pressed={inspectionSide === "primary"} onClick={() => setInspectionSide("primary")}>{primary}</button><button type="button" aria-pressed={inspectionSide === "secondary"} onClick={() => setInspectionSide("secondary")}>{a.secondary}</button></div>}
      {inspectedKey === "transit" ? <TransitModifiersPanel chart={chart} transits={transits} at={a.at} detailed={mode === "astrologer"} selectedPlanet={selected ?? undefined} /> : <>
        {inspectedKey === "D1" && inspectionSide === "primary" && a.reference !== "lagna" && <p className="mb-3 text-sm text-gold-bright">{L("Detailed interpretation below uses the natal Lagna houses. Return to that reference to align the chart and reading.", "नीचे विस्तृत व्याख्या जन्म लग्न के भावों से है। चित्र और व्याख्या मिलाने के लिए लग्न आधार चुनें।")} <button type="button" onClick={() => a.update({ reference: "lagna" })}>{L("Show Lagna", "लग्न देखें")}</button></p>}
        <SelectedChartAnalysis key={`${inspectedKey}:${selected ?? house}`} chart={chart} chartKey={inspectedKey} selected={a.selected?.kind === "house" ? a.selected : natal ? { kind: "planet", planet: natal.planet } : null} onPick={selected => { a.setFocusedEvidence(null); a.update({ selected }); }} at={a.at} go={go} />
      </>}
      {selected && a.overlay && inspectedKey === "D1" && <details className="mt-4"><summary className="cursor-pointer text-sm font-semibold text-[#55B6A4]">{L("Transit modifiers", "गोचर संशोधक")}</summary><div className="mt-3"><TransitModifiersPanel chart={chart} transits={transits} at={a.at} detailed={mode === "astrologer"} selectedPlanet={selected} /></div></details>}
      {mode === "astrologer" && <label className="mt-4 block text-xs text-muted">{L("Notes for this chart selection", "इस कुंडली चयन के नोट्स")}<textarea className="input mt-2 w-full" rows={3} value={notes[noteKey] ?? ""} onChange={e => saveNotes({ ...notes, [noteKey]: e.target.value })} /><span>{L("Saved on this device.", "इस उपकरण पर सहेजे गए।")}</span></label>}
    </InspectorPanel>
  </section>;
}
