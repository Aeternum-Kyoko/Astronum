"use client";
import { useAnalysis } from "./kundli/AnalysisContext";
import EvidenceEntry from "./EvidenceEntry";
import { useMemo } from "react";
import { topicReading, TOPICS, type TopicKey } from "@/lib/astrology/topicReading";
import type { KundaliChart } from "@/lib/astrology/types";
import type { KundaliReport } from "@/lib/astrology/report";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { pick } from "@/lib/i18n/ui";
import { term } from "@/lib/i18n/terms";

export default function TopicReadingPanel({ chart, report, topic, go }: { chart: KundaliChart; report: KundaliReport | null; topic: TopicKey; go?: (slug: string) => void }) {
  const locale = useLocale();
  const L = pick(locale);
  const n = (p: string) => term(locale, p);
  const analysis = useAnalysis();
  const at = useMemo(() => analysis?.at ?? new Date(report?.generatedAt ?? chart.utcDate), [analysis?.at, report?.generatedAt, chart.utcDate]);
  const transits = analysis?.transits ?? report?.transits ?? null;
  const reading = useMemo(() => topicReading(chart, topic, at, locale, transits), [chart, at, topic, locale, transits]);
  const date = (d: Date | string) => new Date(d).toLocaleDateString(locale === "hi" ? "hi-IN" : "en-GB", { month: "short", year: "numeric", timeZone: chart.input.timezone });
  const transit = transits?.filter((t) => (TOPICS[topic].houses as readonly number[]).includes(t.houseFromLagna)) ?? [];
  return <div className="space-y-6">
    <header><h2 className="text-3xl font-bold text-cream">{reading.title}</h2><p className="mt-3 max-w-3xl text-base leading-relaxed text-muted">{reading.summary}</p></header>
    <div className="grid gap-5 md:grid-cols-2">
      {[{ title: L("Supporting factors", "सहायक संकेत"), items: reading.supportEvidence, color: "border-sky-300/30" }, { title: L("Factors that need attention", "ध्यान योग्य संकेत"), items: reading.pressureEvidence, color: "border-rose/30" }].map((group) => <section key={group.title} className={`rounded-2xl border ${group.color} bg-surface/40 p-5`}><h3 className="text-lg font-semibold text-cream">{group.title}</h3><ul className="mt-3 space-y-3 text-sm leading-relaxed text-muted">{group.items.length ? group.items.map((e) => <li key={e.id}><EvidenceEntry evidence={e} go={go} /></li>) : <li>{L("No factors flagged by these specific checks. This does not mean the topic is fully resolved.", "इन विशेष जाँचों में कोई संकेत नहीं मिला; इससे पूरा विषय तय नहीं होता।")}</li>}</ul></section>)}
    </div>
    <section className="rounded-2xl border border-border p-5"><h3 className="text-lg font-semibold text-cream">{L("Natural significators", "नैसर्गिक कारक")}</h3><div className="mt-4 grid gap-4 sm:grid-cols-2">{reading.karakas.map((k) => <article key={k.planet}><p className="font-semibold text-cream">{n(k.planet)} · {n(k.placement.sign)} · {L("House", "भाव")} {k.placement.house}</p><p className="mt-1 text-sm text-muted">{n(k.placement.nakshatra)}, {L("pada", "पद")} {k.placement.pada}{k.combust ? L(" · Combust", " · अस्त") : ""}{k.strength ? ` · ${L("Shadbala", "षड्बल")} ${k.strength.rupas.toFixed(2)} / ${k.strength.requiredRupas}` : ""}</p><p className="mt-2 text-xs text-muted">{k.vargas.map((v) => `${v.key}: ${n(v.placement.sign)}, ${L("house", "भाव")} ${v.placement.house}${v.dignity ? ` (${n(v.dignity)})` : ""}`).join(" · ")}</p></article>)}</div></section>
    <section className="rounded-2xl border border-border p-5">{!analysis && !report && <p className="mb-3 text-xs text-muted">{L("Timing is based on the birth date until the current report loads.","वर्तमान रिपोर्ट आने तक जन्म तिथि का समय-संदर्भ।")}</p>}<h3 className="text-lg font-semibold text-cream">{L("Timing and current activation", "समय और वर्तमान सक्रियता")}</h3><p className="mt-2 text-sm text-muted">{reading.active.length ? reading.active.map((p) => `${n(p.lord)} (${date(p.start)} – ${date(p.end)})`).join(" / ") : L("No direct lord, occupant or natural-significator activation in the current three Vimshottari levels.", "वर्तमान तीन विंशोत्तरी स्तरों में भावेश, ग्रह या नैसर्गिक कारक की सीधी सक्रियता नहीं।")}</p><ul className="mt-4 divide-y divide-border">{reading.periods.map((p) => <li key={`${p.maha}-${p.lord}-${p.start}`} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span className="font-medium text-cream">{n(p.maha)}–{n(p.lord)}</span><span className="text-muted">{date(p.start)} – {date(p.end)}</span></li>)}</ul><p className="mt-3 text-xs text-muted">{L("These are activation windows, not promised dates for marriage, income, admission or property purchase.", "ये विषय की सक्रिय अवधियाँ हैं; विवाह, आय, प्रवेश या संपत्ति खरीद की निश्चित तिथियाँ नहीं।")}</p>{transit.length > 0 && <p className="mt-3 text-sm text-muted">{L("Transits through related houses", "संबंधित भावों में गोचर")}: {transit.map((t) => `${n(t.planet)} (${t.houseFromLagna})`).join(", ")}</p>}</section>
    {reading.yogas.length > 0 && <section><h3 className="text-lg font-semibold text-cream">{L("Related combinations", "संबंधित योग")}</h3><div className="mt-3 space-y-3">{reading.yogas.map((y) => <details key={y.id} className="rounded-xl border border-border p-4"><summary className="cursor-pointer font-medium text-cream">{y.name} · {n(y.strength)}</summary><p className="mt-2 text-sm text-muted">{y.formation}</p><p className="mt-2 text-sm text-muted">{y.effect}</p></details>)}</div></section>}
    <p className="text-xs leading-relaxed text-muted">{L("D1 is the foundation; divisional charts add topic-specific context. Their houses depend on birth-time precision. Strength and timing are traditional interpretive measures, not probabilities or personal advice.", "D1 आधार है; वर्ग कुंडलियाँ विषय का संदर्भ जोड़ती हैं। उनके भाव जन्म-समय की सटीकता पर निर्भर हैं। बल और समय पारंपरिक माप हैं, संभावनाओं के प्रतिशत या व्यक्तिगत सलाह नहीं।")}</p>
  </div>;
}
