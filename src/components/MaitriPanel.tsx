"use client";
import { useMemo, useState } from "react";
import { MAITRI_PLANETS, panchadhaMaitri } from "@/lib/astrology/maitri";
import type { PlanetName } from "@/lib/astrology/constants";
import type { KundaliChart } from "@/lib/astrology/types";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { term } from "@/lib/i18n/terms";
import { pick } from "@/lib/i18n/ui";

export default function MaitriPanel({ placements, title }: { placements: KundaliChart["planets"] | { planet: PlanetName; signIndex: number }[]; title?: string }) {
  const locale = useLocale(); const L = pick(locale);
  const rows = useMemo(() => panchadhaMaitri(placements), [placements]);
  const [from, setFrom] = useState<PlanetName>("Sun"); const [to, setTo] = useState<PlanetName>("Moon");
  const selected = rows.find((r) => r.from === from && r.to === to);
  const label = (value: string) => locale === "hi" ? ({ "Great friend": "अधिमित्र", Friend: "मित्र", Neutral: "सम", Enemy: "शत्रु", "Great enemy": "अधिशत्रु" }[value] ?? value) : value;
  return <section className="rounded-2xl border border-border bg-surface/30 p-4 sm:p-5">
    <h3 className="text-xl font-bold text-cream">{title ?? L("Panchadha Maitri", "पंचधा मैत्री")}</h3>
    <p className="mt-2 text-sm leading-relaxed text-muted">{L("Read each row planet’s relationship toward the column planet. Natural friendship is directional; the reverse relationship may differ. Temporary friendship uses the signs in the selected chart.", "पंक्ति ग्रह का स्तंभ ग्रह से संबंध पढ़ें। नैसर्गिक मैत्री दिशात्मक है; उलटा संबंध अलग हो सकता है। तात्कालिक मैत्री चुनी कुंडली की राशियों से है।")}</p>
    <div className="mt-4 overflow-x-auto"><table className="w-full text-center text-xs"><thead><tr><th className="p-2 text-muted">{L("From / toward", "से / की ओर")}</th>{MAITRI_PLANETS.map((p) => <th key={p} className="p-2 text-cream">{term(locale, p)}</th>)}</tr></thead><tbody>{MAITRI_PLANETS.map((a) => <tr key={a} className="border-t border-border"><th className="p-2 text-left text-cream">{term(locale, a)}</th>{MAITRI_PLANETS.map((b) => { const r = rows.find((r) => r.from === a && r.to === b); return <td key={b} className="p-1">{r ? <button type="button" onClick={() => { setFrom(a); setTo(b); }} aria-pressed={from === a && to === b} className={`min-h-10 w-full rounded-lg px-2 py-2 focus-visible:outline-2 focus-visible:outline-gold ${r.compound.includes("enemy") || r.compound === "Enemy" ? "text-rose" : r.compound.includes("friend") || r.compound === "Friend" ? "text-sky-300" : "text-muted"} ${from === a && to === b ? "bg-gold/10 ring-1 ring-gold/40" : "hover:bg-surface-raised"}`}>{label(r.compound)}</button> : <span className="text-muted">—</span>}</td>; })}</tr>)}</tbody></table></div>
    {selected && <p className="mt-4 rounded-xl border border-gold/25 p-3 text-sm text-muted"><strong className="text-cream">{term(locale, from)} → {term(locale, to)}</strong>: {L("Natural", "नैसर्गिक")} {label(selected.natural)} + {L("temporary", "तात्कालिक")} {label(selected.temporary)} ({L("sign distance", "राशि दूरी")} {selected.distance}) = <strong className="text-cream">{label(selected.compound)}</strong>.</p>}
    <p className="mt-3 text-xs leading-relaxed text-muted">{L("Seven classical planets only. Rahu and Ketu friendship varies by school. Temporary friends are at sign distances 2, 3, 4, 10, 11 and 12. This matrix is an additional lens; it does not overwrite the existing natural-sign dignity calculations.", "केवल सात शास्त्रीय ग्रह। राहु-केतु की मैत्री पद्धति अनुसार बदलती है। तात्कालिक मित्र राशि दूरी 2, 3, 4, 10, 11 और 12 पर हैं। यह अतिरिक्त संदर्भ है; मौजूदा नैसर्गिक राशि बल गणना नहीं बदलती।")}</p>
    <a className="mt-2 inline-block text-xs text-gold-bright underline" href="https://www.vedicastrologer.org/articles/vedic_astro_textbook.pdf" target="_blank" rel="noreferrer">{L("Method: Vedic Astrology: An Integrated Approach, §3.4", "पद्धति: Vedic Astrology: An Integrated Approach, §3.4")}</a>
  </section>;
}
