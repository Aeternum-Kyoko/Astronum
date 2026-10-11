"use client";
import { useMemo } from "react";
import { useAnalysis } from "./AnalysisContext";
import { periodsAt } from "@/lib/astrology/dashaTree";
import { readingEvidence } from "@/lib/astrology/readingEvidence";
import type { KundaliChart } from "@/lib/astrology/types";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { pick } from "@/lib/i18n/ui";
import { term } from "@/lib/i18n/terms";
import EvidenceEntry from "../EvidenceEntry";
export default function WorkspaceOverview({ chart, expert, go }: { chart: KundaliChart; expert: boolean; go: (slug: string) => void }) {
  const a = useAnalysis()!; const locale = useLocale(); const L = pick(locale); const n = (s: string) => term(locale, s);
  const running = periodsAt(chart.dashas, a.at, 3);
  const evidence = useMemo(() => readingEvidence(chart, [1, 7, 10], ["D9", "D10"], a.at, null, locale), [chart, a.at, locale]);
  return <div className="workspace-overview"><header><h2>{expert ? L("Analysis desk", "विश्लेषण डेस्क") : L("Understand your chart", "अपनी कुंडली समझें")}</h2><p className="mt-2 text-sm text-muted">{expert ? L("Inspect a planet, compare charts, and follow its evidence and timing.", "ग्रह देखें, कुंडलियाँ तुलना करें और प्रमाण व समय जाँचें।") : L("Explore your birth chart through life areas, supporting evidence, and timing.", "जीवन क्षेत्रों, प्रमाण और समय से जन्म कुंडली जानें।")}</p></header>
    <section className="overview-period"><h3>{L("Period at the analysis date", "विश्लेषण तिथि की दशा")}</h3><p className="mt-2 text-xl text-gold-bright">{running.map(p => n(p.lord)).join(" › ") || L("Outside calculated range", "गणना सीमा से बाहर")}</p><button type="button" onClick={() => go("dashas")} className="mt-3 text-sm text-gold-bright underline">{L("Explore this period", "यह दशा देखें")}</button></section>
    <div className="overview-topics">{[["Career", "career", "D10"], ["Relationships", "relationships", "D9"], ["Wealth", "wealth", "D2"], ["Education", "education", "D24"], ["Property", "property", "D4"]].map(([title, slug, varga]) => <button type="button" key={slug} onClick={() => { a.update({ primary: "D1", secondary: varga as typeof a.primary, compare: expert }); go(slug); }}><span>{n(title)}</span><span className="text-xs text-muted">D1 + {varga}</span></button>)}</div>
    <section><h3>{L("Chart evidence to start with", "प्रारंभिक कुंडली प्रमाण")}</h3><div className="mt-3 space-y-4">{evidence.map(c => <div key={c.house}><p className="mb-2 text-xs text-muted">{L("House", "भाव")} {c.house} · {n(c.lord)}{c.mixed && ` · ${L("Mixed indicators", "मिश्रित संकेत")}`}</p>{c.items.slice(0, expert ? 4 : 2).map(e => <EvidenceEntry key={e.id} evidence={e} go={go} />)}</div>)}</div></section>
    <div className="mt-6 flex flex-wrap gap-3 text-xs text-gold-bright"><button type="button" onClick={() => go("precision")}>{L("Review birth-time precision", "जन्म-समय सटीकता जाँचें")}</button><button type="button" onClick={() => go("journal")}>{L("Record a life event", "जीवन घटना दर्ज करें")}</button><button type="button" onClick={() => go("calculations")}>{L("Calculation settings", "गणना सेटिंग्स")}</button></div>
  </div>;
}
