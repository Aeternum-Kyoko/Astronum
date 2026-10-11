"use client";
import { useAnalysis } from "./kundli/AnalysisContext";
import { useMemo, useState } from "react";
import { readingContext, SECTION_LENSES } from "@/lib/astrology/readingContext";
import { readingEvidence, type EvidenceTone } from "@/lib/astrology/readingEvidence";
import type { KundaliChart } from "@/lib/astrology/types";
import type { KundaliReport } from "@/lib/astrology/report";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { pick } from "@/lib/i18n/ui";
import { term } from "@/lib/i18n/terms";
import EvidenceEntry from "./EvidenceEntry";

export default function ReadingContextPanel({ chart, report, section, go }: { chart: KundaliChart; report: KundaliReport | null; section: string; go?: (slug: string) => void }) {
  const locale = useLocale(); const L = pick(locale); const n = (v: string) => term(locale, v);
  const analysis = useAnalysis();
  const at = useMemo(() => analysis?.at ?? new Date(report?.generatedAt ?? chart.utcDate), [analysis?.at, report?.generatedAt, chart.utcDate]);
  const transits = analysis?.transits ?? report?.transits ?? null;
  const lens = SECTION_LENSES[section];
  const [filter, setFilter] = useState<EvidenceTone | "all">("all");
  const evidence = useMemo(() => lens ? readingEvidence(chart, lens.houses, lens.vargas, at, transits, locale) : [], [chart, lens, at, transits, locale]);
  const context = useMemo(() => lens ? readingContext(chart, lens.houses, lens.vargas, at) : [], [chart, lens, at]);
  if (!lens || !lens.houses.length) return null;
  return <details className="mt-6 rounded-2xl border border-gold/25 bg-surface/40 p-4 sm:p-5">
    <summary className="cursor-pointer text-base font-semibold text-cream">{L("Why this reading? Explore the chart evidence", "यह व्याख्या क्यों? कुंडली का आधार देखें")}</summary>
    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">{L("Open a statement to inspect its measurement, rule and limits. These house-lord checks add evidence to this section; they do not audit every sentence produced by other astrology systems. Supporting and demanding checks can coexist.", "कथन खोलकर माप, नियम और सीमा देखें। ये भावेश जाँचें इस भाग का आधार देती हैं; अन्य पद्धतियों के हर वाक्य की जाँच नहीं करतीं। सहायक और कठिन संकेत साथ हो सकते हैं।")}</p>
    {!report && <p className="mt-2 text-xs text-muted">{L("Current report is loading. Dasha context temporarily uses the birth date; transits are unavailable.", "वर्तमान रिपोर्ट आ रही है। दशा में अभी जन्म समय का संदर्भ; गोचर उपलब्ध नहीं।")}</p>}
    <div className="mt-4 flex flex-wrap gap-2" aria-label={L("Evidence filters", "आधार फ़िल्टर")}>{(["all", "support", "pressure", "context"] as const).map(value => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`rounded-full border px-3 py-2 text-xs font-semibold ${filter === value ? "border-gold bg-gold/10 text-gold-bright" : "border-border text-muted"}`}>{({ all: L("All evidence", "सभी संकेत"), support: L("Supporting", "सहायक"), pressure: L("Needs attention", "ध्यान योग्य"), context: L("Context", "संदर्भ") })[value]}</button>)}</div>
    <div className="mt-5 grid gap-5 lg:grid-cols-2">{evidence.map((h, i) => { const c = context[i]; const items = h.items.filter(e => filter === "all" || e.tone === filter); return <article key={h.house} className="min-w-0 rounded-xl border border-border p-4">
      <h3 className="font-semibold text-cream">{L("House", "भाव")} {h.house} · {n(h.lord)}</h3>
      <p className="mt-2 text-xs leading-relaxed text-muted">{L("Occupants / full aspects", "ग्रह / पूर्ण दृष्टि")}: {c.occupants.map(p => n(p.planet)).join(", ") || "—"} / {c.aspects.map(p => n(p.planet)).join(", ") || "—"}{c.chalitHouse !== c.planet.house ? L(`. Lord moves to Chalit bhava ${c.chalitHouse}; D1 sign ownership is unchanged.`, `। भावेश चलित भाव ${c.chalitHouse} में; D1 राशि स्वामित्व वही।`) : ""}</p>
      {h.mixed && <p className="mt-3 rounded-lg border border-gold/25 p-3 text-xs leading-relaxed text-cream">{L("Mixed evidence: at least one supporting and one demanding condition apply to this house. Inspect both before forming a conclusion; the counts are not a vote or a probability.", "मिश्रित संकेत: इस भाव में सहायक और कठिन स्थिति दोनों हैं। निष्कर्ष से पहले दोनों देखें; संकेतों की संख्या मत या प्रतिशत नहीं।")}</p>}
      {h.missing.map(m => <p key={m} className="mt-2 text-xs text-muted">{m}</p>)}
      <div className="mt-3 space-y-2">{items.length ? items.map(e => <EvidenceEntry key={e.id} evidence={e} go={go} />) : <p className="text-xs text-muted">{L("No checks in this filter for this house.", "इस भाव के लिए इस फ़िल्टर में संकेत नहीं।")}</p>}</div>
    </article>; })}</div>
    <p className="mt-4 text-xs leading-relaxed text-muted">{L("Birth precision affects divisional houses and Bhava Chalit. Each method remains a separate lens. All timing observations show their reference instant, and strength is not an event probability.", "जन्म समय वर्ग भाव और चलित को प्रभावित करता है। हर पद्धति अलग दृष्टिकोण है। समय संकेतों में संदर्भ क्षण है; बल घटना का प्रतिशत नहीं।")}</p>
  </details>;
}
