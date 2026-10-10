"use client";
import { useMemo, useState } from "react";
import type { KundaliChart } from "@/lib/astrology/types";
import type { CurrentTransit } from "@/lib/astrology/transits";
import { transitContext } from "@/lib/astrology/transitContext";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { pick } from "@/lib/i18n/ui";
import { term } from "@/lib/i18n/terms";
import MaitriPanel from "./MaitriPanel";

export default function TransitModifiersPanel({ chart, transits, at, detailed = false }: { chart: KundaliChart; transits: CurrentTransit[]; at: Date; detailed?: boolean }) {
  const locale = useLocale(); const L = pick(locale);
  const context = useMemo(() => transitContext(chart, transits, at), [chart, transits, at]);
  const [matrix, setMatrix] = useState<"natal" | "transit">("transit");
  const date = (d: Date) => d.toLocaleString(locale === "hi" ? "hi-IN" : "en-GB", { timeZone: chart.input.timezone, day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return <div className="space-y-5">
    <section className="rounded-2xl border border-gold/25 bg-surface/30 p-5"><h3 className="text-xl font-bold text-cream">{L("Transit modifiers", "गोचर संशोधक")}</h3><p className="mt-2 text-sm leading-relaxed text-muted">{L("Compare separate traditional lenses. Moorti uses the Moon at the latest sign ingress, tara uses the natal Moon’s nakshatra, and Ashtakavarga uses natal D1 bindus in the transit sign. Agreement is interpretive support, not a prediction probability.", "अलग पारंपरिक संदर्भ साथ देखें। मूर्ति नवीनतम राशि प्रवेश के चंद्र से, तारा जन्म-चंद्र नक्षत्र से और अष्टकवर्ग गोचर राशि के जन्म D1 बिंदुओं से है। सहमति व्याख्या का सहारा है, घटना का प्रतिशत नहीं।")}</p></section>
    <div className="grid gap-4 lg:grid-cols-2">{context.map((c) => {
      const t = transits.find((t) => t.planet === c.planet)!;
      const bavTone = c.bav === null ? null : c.bav >= 5 ? "Supportive" : c.bav <= 3 ? "Demanding" : "Mixed";
      const savTone = c.sav >= 30 ? "Supportive" : c.sav <= 24 ? "Demanding" : "Mixed";
      const tones = [t.favourable ? "Supportive" : "Demanding", c.nakshatra.tone, c.moorti?.tone, bavTone, savTone].filter(Boolean);
      const mixed = tones.includes("Supportive") && tones.includes("Demanding");
      return <article key={c.planet} className="rounded-2xl border border-border bg-ink-deep/35 p-5">
        <div className="flex items-baseline justify-between gap-3"><h4 className="text-lg font-bold text-cream">{term(locale, c.planet)}</h4><span className="text-xs text-muted">{term(locale, t.sign)} {t.degree.toFixed(2)}°</span></div>
        <p className="mt-2 text-sm text-muted">{mixed ? L("Mixed signals: supporting and demanding modifiers coexist.", "मिश्रित संकेत: सहायक और कठिन संशोधक साथ हैं।") : L("Read these modifiers alongside the natal promise and running dasha.", "इन संशोधकों को जन्म संकेत और वर्तमान दशा के साथ पढ़ें।")}</p>
        <dl className="mt-4 space-y-3 text-sm">
          <div><dt className="font-semibold text-cream">{L("Nakshatra & tara", "नक्षत्र और तारा")}</dt><dd className="text-muted">{term(locale, c.nakshatra.name)} · {L("pada", "पद")} {c.nakshatra.pada} · {L("lord", "स्वामी")} {term(locale, c.nakshatra.lord)}<br />{locale === "hi" ? ({Janma:"जन्म",Sampat:"संपत",Vipat:"विपत",Kshema:"क्षेम",Pratyak:"प्रत्यक",Sadhana:"साधन",Naidhana:"नैधन",Mitra:"मित्र","Parama Mitra":"परम मित्र"}[c.nakshatra.tara]) : c.nakshatra.tara} ({c.nakshatra.count} {L("from Janma", "जन्म से")}) · {toneText(c.nakshatra.tone, locale)}</dd></div>
          <div><dt className="font-semibold text-cream">{L("Moorti Nirnaya", "मूर्ति निर्णय")}</dt><dd className="text-muted">{c.moorti ? <>{c.moorti.name} · {metalText(c.moorti.metal, locale)} · {toneText(c.moorti.tone, locale)}<span className="mt-1 block text-xs">{L("Latest sign entry", "नवीनतम राशि प्रवेश")}: {date(c.moorti.ingress)}<br />{L("Moon at entry", "प्रवेश पर चंद्र")}: {term(locale, c.moorti.moonSign)} · {L("house", "भाव")} {c.moorti.moonHouse} {L("from natal Moon", "जन्म-चंद्र से")}</span></> : L("Ingress not resolved in the bounded search.", "सीमित खोज में प्रवेश नहीं मिला।")}</dd></div>
          <div><dt className="font-semibold text-cream">{L("Ashtakavarga modifier", "अष्टकवर्ग संशोधक")}</dt><dd className="text-muted">{c.bav === null ? L("BAV not assigned to nodes", "राहु-केतु के लिए BAV नहीं") : `${L("Natal BAV", "जन्म BAV")} ${c.bav}/8 · ${toneText(bavTone!, locale)}`}<br />{L("Natal SAV", "जन्म SAV")} {c.sav} · {toneText(savTone, locale)}</dd></div>
          {detailed && <div><dt className="font-semibold text-cream">{L("Panchadha relation to transit sign lord", "गोचर राशि स्वामी से पंचधा संबंध")}</dt><dd className="text-muted">{term(locale, c.signLord)} · {term(locale, c.relationship)}<span className="block text-xs">{L("Temporary friendship is calculated from the transit chart.", "तात्कालिक मैत्री गोचर कुंडली से है।")}</span></dd></div>}
        </dl>
      </article>;
    })}</div>
    <details className="rounded-2xl border border-border p-5"><summary className="cursor-pointer font-semibold text-cream">{L("Ashtakavarga method and thresholds", "अष्टकवर्ग पद्धति और मानक")}</summary><p className="mt-3 text-sm leading-relaxed text-muted">{L("BAV: 5–8 bindus are treated as supporting, 4 as mixed, and 0–3 as demanding. SAV: 30+ supporting, 25–29 mixed, 24 or fewer demanding, using this app’s existing reference bands. These are reading conventions, not event probabilities. Points are indexed by zodiac sign, not by house number; natal D1 tables are used even when a different chart is displayed. Kakshya and shodhana refinements are not included.", "BAV में 5–8 सहायक, 4 मिश्रित और 0–3 कठिन माने जाते हैं। ऐप के मौजूदा मानकों अनुसार SAV में 30+ सहायक, 25–29 मिश्रित और 24 या कम कठिन हैं। ये व्याख्या के मानक हैं, घटना के प्रतिशत नहीं। बिंदु राशि से लिए जाते हैं, भाव संख्या से नहीं; अलग कुंडली दिखने पर भी जन्म D1 तालिका लागू है। कक्ष्या और शोधन परिष्कार शामिल नहीं हैं।")}</p></details>
    <details open={detailed} className="rounded-2xl border border-border p-5"><summary className="mb-3 cursor-pointer font-semibold text-cream">{L("Panchadha Maitri details", "पंचधा मैत्री विवरण")}</summary><label className="block text-sm text-cream">{L("Friendship matrix basis", "मैत्री तालिका का आधार")}<select value={matrix} onChange={(e) => setMatrix(e.target.value as typeof matrix)} className="input mt-2 max-w-xs"><option value="transit">{L("Transit positions", "गोचर स्थितियाँ")}</option><option value="natal">{L("Natal D1 positions", "जन्म D1 स्थितियाँ")}</option></select></label>
    <MaitriPanel placements={matrix === "natal" ? chart.planets : transits} title={L(`Panchadha Maitri · ${matrix === "natal" ? "natal" : "transit"}`, `पंचधा मैत्री · ${matrix === "natal" ? "जन्म" : "गोचर"}`)} />
    </details>
    <a className="text-xs text-gold-bright underline" href="https://www.vedicastrologer.org/articles/vedic_astro_textbook.pdf" target="_blank" rel="noreferrer">{L("Moorti and tara method: §26.2 and §26.4, Vedic Astrology: An Integrated Approach", "मूर्ति और तारा पद्धति: §26.2 और §26.4, Vedic Astrology: An Integrated Approach")}</a>
  </div>;
}
function toneText(value: string, locale: "en" | "hi") { return locale === "hi" ? ({ Supportive: "सहायक", Mixed: "मिश्रित", Demanding: "कठिन" }[value] ?? value) : value; }
function metalText(value: string, locale: "en" | "hi") { return locale === "hi" ? ({ Gold: "सोना", Silver: "चाँदी", Copper: "ताँबा", Iron: "लोहा" }[value] ?? value) : value; }
