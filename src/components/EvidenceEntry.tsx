"use client";
import type { ReadingEvidence } from "@/lib/astrology/readingEvidence";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { pick } from "@/lib/i18n/ui";
export default function EvidenceEntry({ evidence: e, go }: { evidence: ReadingEvidence; go?: (slug: string) => void }) {
  const L = pick(useLocale());
  return <details className="rounded-xl border border-border/70 p-3"><summary className="cursor-pointer text-sm leading-relaxed text-cream">{e.statement}<span className="ml-2 text-xs text-gold-bright">{L("Why?", "क्यों?")}</span></summary><dl className="mt-3 space-y-3 text-xs leading-relaxed text-muted"><div><dt className="font-semibold text-cream">{L("Measurement", "माप")}</dt><dd>{e.observation}</dd></div><div><dt className="font-semibold text-cream">{L("Rule", "नियम")} · {e.method}</dt><dd>{e.rule}</dd></div><div><dt className="font-semibold text-cream">{L("Interpretation limit", "व्याख्या की सीमा")}</dt><dd>{e.limitation}</dd></div></dl>{go && <button type="button" onClick={() => go(e.sourceTab)} className="mt-3 text-xs font-semibold text-gold-bright underline">{L("Open source section", "आधार भाग खोलें")}</button>}</details>;
}
