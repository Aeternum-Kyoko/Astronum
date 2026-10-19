"use client";
import type { ReadingEvidence } from "@/lib/astrology/readingEvidence";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { pick } from "@/lib/i18n/ui";
import { useAnalysis } from "./kundli/AnalysisContext";
export default function EvidenceEntry({ evidence: e, go }: { evidence: ReadingEvidence; go?: (slug: string) => void }) {
  const L = pick(useLocale());
  const analysis = useAnalysis();
  const openFactor = () => {
    if (!analysis || !go) return;
    const { chart, pick } = e.destination;
    const returnTab = new URL(window.location.href).searchParams.get("tab") ?? "summary";
    go(chart === "D1" ? "rasi" : chart === "D9" ? "navamsa" : "vargas");
    analysis.update({ primary: chart, reference: "lagna", overlay: false, compare: false, selected: pick });
    analysis.setFocusedEvidence({ evidence: e, returnTab });
    analysis.setInspector({ open: true, side: "primary" });
  };
  return <details data-evidence-id={e.id} className="rounded-xl border border-border/70 p-3"><summary className="cursor-pointer text-sm leading-relaxed text-cream">{e.statement}<span className="ml-2 text-xs text-gold-bright">{L("Why?", "क्यों?")}</span></summary><dl className="mt-3 space-y-3 text-xs leading-relaxed text-muted"><div><dt className="font-semibold text-cream">{L("Measurement", "माप")}</dt><dd>{e.observation}</dd></div><div><dt className="font-semibold text-cream">{L("Rule", "नियम")} · {e.method}</dt><dd>{e.rule}</dd></div><div><dt className="font-semibold text-cream">{L("Interpretation limit", "व्याख्या की सीमा")}</dt><dd>{e.limitation}</dd></div></dl>{go && <div className="evidence-actions">{analysis && <button type="button" onClick={openFactor}>{L(`Show ${e.destination.chart} ${e.destination.pick.kind === "planet" ? e.destination.pick.planet : `house ${e.destination.pick.house}`} in chart`, `कुंडली में ${e.destination.chart} ${e.destination.pick.kind === "planet" ? e.destination.pick.planet : `भाव ${e.destination.pick.house}`} देखें`)}</button>}<button type="button" onClick={() => go(e.sourceTab)}>{L("Open calculation section", "गणना भाग खोलें")}</button></div>}</details>;
}
