"use client";

import { useMemo } from "react";
import { readingContext, SECTION_LENSES } from "@/lib/astrology/readingContext";
import type { KundaliChart } from "@/lib/astrology/types";
import type { KundaliReport } from "@/lib/astrology/report";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { term } from "@/lib/i18n/terms";
import { houseSignification } from "@/lib/astrology/content";

export default function ReadingContextPanel({ chart, report, section }: { chart: KundaliChart; report: KundaliReport | null; section: string }) {
  const locale = useLocale();
  const hi = locale === "hi";
  const words = (en: string, hindi: string) => hi ? hindi : en;
  const lens = SECTION_LENSES[section];
  const context = useMemo(() => lens ? readingContext(chart, lens.houses, lens.vargas, new Date(report?.generatedAt ?? chart.utcDate)) : [], [chart, lens, report?.generatedAt]);
  if (!lens || !lens.houses.length) return null;
  return <details className="mt-6 rounded-2xl border border-gold/25 bg-surface/40 p-4 sm:p-5">
    <summary className="cursor-pointer text-base font-semibold text-cream">{words("Connect this reading to your full chart", "इस व्याख्या को पूरी कुंडली से जोड़ें")}</summary>
    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">{words("Compare natal placement, strength, divisional context and timing below. Support and pressure can coexist; a strong planet does not guarantee a favourable event. These are traditional interpretive signals, not probabilities.", "नीचे जन्म स्थिति, बल, वर्ग कुंडली और समय-संदर्भ साथ देखें। सहारा और दबाव साथ हो सकते हैं; बलवान ग्रह अनुकूल घटना की गारंटी नहीं देता। ये पारंपरिक संकेत हैं, संभावनाओं के प्रतिशत नहीं।")}</p>
    {!report && <p className="mt-2 text-xs text-muted">{words("Timing uses the birth date until the current report loads.", "वर्तमान रिपोर्ट आने तक समय-संदर्भ जन्म तिथि पर आधारित है।")}</p>}
    <div className="mt-4 grid gap-4 md:grid-cols-2">{context.map((c) => {
      const transits = report?.transits.filter((t) => t.houseFromLagna === c.house) ?? [];
      const supported = ["Exalted", "Own Sign", "Moolatrikona"].includes(c.planet.dignity ?? "") || c.strength?.isStrong;
      const pressure = c.combust || c.planet.dignity === "Debilitated" || (c.strength && !c.strength.isStrong);
      return <article key={c.house} className="border-t border-border pt-3">
        <h3 className="font-semibold text-cream">{words(`House ${c.house}`, `भाव ${c.house}`)} <span className="font-normal text-muted">{houseSignification(c.house, locale).split(",").slice(0, 2).join(", ")}</span></h3>
        <p className="mt-2 text-sm text-cream">{term(locale, c.lord.lord)} · {term(locale, c.planet.sign)} · {words(`house ${c.planet.house}`, `भाव ${c.planet.house}`)}{c.planet.dignity ? ` · ${term(locale, c.planet.dignity)}` : ""}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">{term(locale, c.planet.nakshatra)} · {words("Pada", "पद")} {c.planet.pada}{c.planet.retrograde ? words(" · Retrograde", " · वक्री") : ""}{c.combust ? words(" · Combust", " · अस्त") : ""}. {words("SAV", "सर्वाष्टकवर्ग")} {c.bindus}{c.strength ? ` · ${words("Shadbala", "षड्बल")} ${c.strength.rupas.toFixed(2)} / ${c.strength.requiredRupas} ${words("required rupas", "आवश्यक रूपा")}` : ""}.</p>
        <p className="mt-2 text-sm text-muted">{supported && pressure ? words("Mixed evidence: strength and pressure both need attention.", "मिश्रित संकेत: बल और दबाव दोनों देखें।") : pressure ? words("The lord needs support; read its difficulties alongside the house context.", "भावेश को सहारे की ज़रूरत है; कठिनाइयों को भाव के संदर्भ में देखें।") : supported ? words("The lord has support; timing and other links still shape expression.", "भावेश को सहारा है; समय और अन्य संबंध भी फल को प्रभावित करते हैं।") : words("Read this through the lord’s placement and its supporting links.", "भावेश की स्थिति और सहायक संबंधों से इसे पढ़ें।")}</p>
        <dl className="mt-3 space-y-2 text-xs leading-relaxed text-muted">
          <div><dt className="inline font-semibold text-cream">{words("Occupants / aspects: ", "ग्रह / दृष्टि: ")}</dt><dd className="inline">{c.occupants.map((p) => term(locale, p.planet)).join(", ") || words("No occupants", "कोई ग्रह नहीं")} / {c.aspects.map((p) => term(locale, p.planet)).join(", ") || words("No full aspects", "कोई पूर्ण दृष्टि नहीं")}</dd></div>
          {c.chalitHouse !== c.planet.house && <div><dt className="inline font-semibold text-cream">{words("Bhava Chalit: ", "भाव चलित: ")}</dt><dd className="inline">{words(`The lord moves to bhava ${c.chalitHouse}; sign ownership stays with D1.`, `भावेश भाव ${c.chalitHouse} में जाते हैं; राशि स्वामित्व D1 से ही है।`)}</dd></div>}
          {c.vargas.length > 0 && <div><dt className="font-semibold text-cream">{words("D1 lord in the divisional charts", "वर्ग कुंडलियों में D1 भावेश")}</dt><dd>{c.vargas.map((v) => `${v.key}: ${term(locale, v.placement.sign)}, ${words("house", "भाव")} ${v.placement.house}${v.dignity ? ` (${term(locale, v.dignity)})` : ""}${v.vargottama ? words("; same sign as D1", "; D1 जैसी राशि") : ""}`).join(" · ")}</dd></div>}
          <div><dt className="inline font-semibold text-cream">{words("Vimshottari activation: ", "विंशोत्तरी सक्रियता: ")}</dt><dd className="inline">{c.activeLords.map((p) => term(locale, p)).join(" / ") || words("No direct lord, occupant or aspect link in the running three levels.", "वर्तमान तीन स्तरों में भावेश, ग्रह या दृष्टि का सीधा संबंध नहीं।")}</dd></div>
          {transits.length > 0 && <div><dt className="inline font-semibold text-cream">{words("Transiting this house: ", "इस भाव में गोचर: ")}</dt><dd className="inline">{transits.map((t) => term(locale, t.planet)).join(", ")}</dd></div>}
        </dl>
      </article>;
    })}</div>
    <p className="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-muted">{words("Divisional ascendants and Bhava Chalit depend on birth-time precision. Vimshottari context here is a separate lens alongside KP, Chara, Yogini or Lal Kitab; it does not replace their rules. Yoga and dosha findings remain in their dedicated section.", "वर्ग लग्न और भाव चलित जन्म-समय की सटीकता पर निर्भर हैं। यहाँ विंशोत्तरी संदर्भ KP, चर, योगिनी या लाल किताब के साथ अलग दृष्टिकोण है; यह उनके नियमों का विकल्प नहीं। योग और दोष के निष्कर्ष उनके अलग भाग में हैं।")}</p>
  </details>;
}
