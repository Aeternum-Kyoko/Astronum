"use client";

import { useMemo, useState } from "react";
import { inspectChart, type InspectionPick } from "@/lib/astrology/chartInspection";
import type { KundaliChart } from "@/lib/astrology/types";
import type { PlanetName, VargaKey } from "@/lib/astrology/constants";
import { vargaInfo } from "@/lib/astrology/content";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { pick } from "@/lib/i18n/ui";
import { term } from "@/lib/i18n/terms";
import { isCombust } from "@/lib/astrology/birthDetails";
import BirthReliabilityBadge from "./BirthReliabilityBadge";

const PRACTICE: Record<PlanetName, [string, string]> = {
  Sun: ["Choose one responsibility you can fulfil consistently; ask for feedback on how you lead.", "एक जिम्मेदारी नियमित निभाएँ; अपने नेतृत्व पर प्रतिक्रिया माँगें।"],
  Moon: ["Keep a short reflection journal and notice which routines help you feel settled.", "संक्षिप्त डायरी रखें और देखें कि किन दिनचर्याओं से मन स्थिर होता है।"],
  Mars: ["Break a difficult task into small actions; pause before responding during disagreements.", "कठिन काम छोटे चरणों में बाँटें; मतभेद में जवाब देने से पहले रुकें।"],
  Mercury: ["Write down decisions, verify assumptions, and practise explaining one idea clearly.", "निर्णय लिखें, धारणाएँ जाँचें और एक बात स्पष्ट समझाने का अभ्यास करें।"],
  Jupiter: ["Choose a subject to study regularly and seek feedback from a trusted teacher or mentor.", "एक विषय नियमित पढ़ें और विश्वसनीय शिक्षक या मार्गदर्शक से प्रतिक्रिया लें।"],
  Venus: ["Make time for creativity and discuss expectations openly in relationships.", "रचनात्मक कार्य के लिए समय निकालें और संबंधों में अपेक्षाओं पर खुलकर बात करें।"],
  Saturn: ["Choose a manageable commitment, track it weekly, and allow realistic time for progress.", "व्यावहारिक संकल्प चुनें, हर सप्ताह समीक्षा करें और प्रगति के लिए पर्याप्त समय दें।"],
  Rahu: ["Check sources before pursuing an exciting opportunity; write down its trade-offs.", "आकर्षक अवसर अपनाने से पहले स्रोत जाँचें और उसके लाभ-हानि लिखें।"],
  Ketu: ["Notice where you disengage; choose one small action that keeps you connected to your priorities.", "देखें कहाँ आपका ध्यान हटता है; अपनी प्राथमिकता से जुड़ने का एक छोटा कदम चुनें।"],
};

export default function SelectedChartAnalysis({ chart, chartKey, selected, onPick, at, go }: {
  chart: KundaliChart; chartKey: VargaKey; selected: InspectionPick | null;
  onPick: (pick: InspectionPick) => void; at: Date; go: (slug: string) => void;
}) {
  const [section, setSection] = useState("reading");
  const locale = useLocale(), L = pick(locale), n = (value: string) => term(locale, value);
  const detail = useMemo(() => inspectChart(chart, chartKey, selected, at), [chart, chartKey, selected, at]);
  const { planet, house, natal } = detail;
  const strength = chart.shadbala.find(s => s.planet === (planet?.planet ?? detail.lord));
  const sun = chart.planets.find(p => p.planet === "Sun")!;
  const practicePlanet = planet?.planet ?? detail.lord;
  const date = (value: Date) => new Date(value).toLocaleDateString(locale === "hi" ? "hi-IN" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: chart.input.timezone });
  const planetButton = (name: PlanetName) => <button type="button" key={name} onClick={() => onPick({ kind: "planet", planet: name })}>{n(name)}</button>;
  return <div className="selected-chart-analysis">
    <header><span className="text-gold-bright text-xs font-semibold">{chartKey} · {vargaInfo(chartKey, locale).title}</span><h3>{planet ? n(planet.planet) : `${L("House", "भाव")} ${house}`} · {n(detail.sign)}</h3><p>{L("Select a planet or house to follow its connections in this chart.", "इस कुंडली में संबंध देखने के लिए ग्रह या भाव चुनें।")}</p></header>
    <div className="inspector-picks" role="group" aria-label={L("Select planet", "ग्रह चुनें")}>{detail.planets.map(p => <button type="button" key={p.planet} aria-pressed={planet?.planet === p.planet} onClick={() => onPick({ kind: "planet", planet: p.planet })}>{n(p.planet)}</button>)}</div>
    <div className="inspector-picks" role="group" aria-label={L("Select house", "भाव चुनें")}>{Array.from({ length: 12 }, (_, i) => <button type="button" key={i} aria-pressed={!planet && house === i + 1} onClick={() => onPick({ kind: "house", house: i + 1 })}>{i + 1}</button>)}</div>
    {chartKey !== "D1" && <BirthReliabilityBadge chart={chart} varga={chartKey} planet={planet?.planet ?? detail.lord} go={go} />}
    <div className="inspection-chapters" role="group" aria-label={L("Analysis sections", "विश्लेषण खंड")}>
      {[["reading", L("Reading", "व्याख्या")], ["connections", L("Connections", "संबंध")], ["timing", L("Timing", "समय")], ["practice", L("Practice", "अभ्यास")]].map(([key, label]) => <button type="button" key={key} aria-pressed={section === key} onClick={() => setSection(key)}>{label}</button>)}
    </div>
    <section hidden={section !== "reading"} className="inspection-chapter"><h4>{L("Placement and meaning", "स्थिति और अर्थ")}</h4>
      {planet ? <p>{n(planet.planet)} · {n(detail.sign)} · {L("House", "भाव")} {house}{planet.dignity ? ` · ${n(planet.dignity)}` : ""}. <button type="button" onClick={() => onPick({ kind: "house", house })}>{L("Explore this house", "यह भाव देखें")} →</button></p> : <p>{L("House lord", "भावेश")}: {planetButton(detail.lord)} · {L("placed in house", "स्थित भाव")} <button type="button" onClick={() => onPick({ kind: "house", house: detail.lordPlacement.house })}>{detail.lordPlacement.house}</button></p>}
      {chartKey === "D2" ? <p>{L("This Hora convention groups planets into the Sun’s and Moon’s horas. The house numbers are chart geometry; a twelve-house life interpretation is not applied here.", "इस होरा पद्धति में ग्रह सूर्य और चंद्र की होरा में हैं। भाव संख्या चित्र की स्थिति है; यहाँ बारह भावों का जीवन-फल लागू नहीं है।")}</p> : <>
        {locale === "hi" && <small>{L("", "विस्तृत पारंपरिक व्याख्या फिलहाल अंग्रेज़ी में उपलब्ध है।")}</small>}
        <p lang="en">{planet ? detail.planetReading?.reading : detail.houseReading?.reading}</p>
        {detail.planetReading && <details><summary>{L("Factors behind this interpretation", "व्याख्या के आधार")}</summary><p lang="en">{detail.planetReading.basis}</p></details>}
      </>}
      <small>{L("This is a traditional interpretation of calculated placement, not a cause of personality or a guaranteed life event.", "यह गणितीय स्थिति की पारंपरिक व्याख्या है; व्यक्तित्व का कारण या निश्चित घटना नहीं।")}</small>
    </section>
    <section hidden={section !== "connections"} className="inspection-chapter"><h4>{L("Connections in this chart", "इस कुंडली के संबंध")}</h4>
      <p>{L("Planets sharing this house", "इस भाव में ग्रह")}: {detail.occupants.filter(p => p.planet !== planet?.planet).map(p => planetButton(p.planet))}{detail.occupants.filter(p => p.planet !== planet?.planet).length === 0 && (planet ? L("No other planets share this house.", "इस भाव में कोई अन्य ग्रह नहीं।") : L("None; an empty house still has a lord and aspects.", "कोई नहीं; रिक्त भाव का भी स्वामी और दृष्टियाँ होती हैं।"))}</p>
      <p>{L("Receiving aspects from", "दृष्टि देने वाले ग्रह")}: {detail.incoming.length ? detail.incoming.map(p => planetButton(p.planet)) : L("None in this convention", "इस पद्धति में कोई नहीं")}</p>
      {planet && <p>{L("Aspects houses", "इन भावों पर दृष्टि")}: {detail.outgoing.map(h => <button type="button" key={h} onClick={() => onPick({ kind: "house", house: h })}>{h}</button>)}</p>}
      {detail.planetReading && <p>{L("Rules houses", "इन भावों का स्वामी")}: {detail.planetReading.rules.length ? detail.planetReading.rules.map(h => <button type="button" key={h} onClick={() => onPick({ kind: "house", house: h })}>{h}</button>) : L("No sign ownership in this convention", "इस पद्धति में राशि स्वामित्व नहीं")}</p>}
      <small>{L("Whole-sign graha aspects in the selected chart; nodes use the seventh aspect. These are not degree-based or applying/separating aspects. Divisional aspect conventions differ by school.", "चुनी कुंडली में राशि-आधारित ग्रह दृष्टि; राहु-केतु की सप्तम दृष्टि। यह अंश-आधारित दृष्टि नहीं। वर्ग दृष्टि पर परंपराओं में भिन्नता है।")}</small>
    </section>
    <section hidden={section !== "connections"} className="inspection-chapter"><h4>{L("Birth-chart foundation", "जन्म कुंडली का आधार")}</h4>
      {natal && <><p>D1: {n(natal.sign)} · {natal.degreeInSign.toFixed(2)}° · {L("House", "भाव")} {natal.house} · {n(natal.nakshatra)} {L("pada", "पद")} {natal.pada}.</p><p>{natal.retrograde ? L("Retrograde at birth", "जन्म में वक्री") : L("Direct at birth", "जन्म में मार्गी")}{natal.planet !== "Sun" && isCombust(natal, sun) ? L(" · Combust in D1", " · D1 में अस्त") : ""}{chartKey !== "D1" ? L(`. Its natal longitude maps to ${detail.sign} in ${chartKey} under the selected division algorithm.`, `। जन्म अंश चुनी वर्ग-पद्धति में ${chartKey} की ${n(detail.sign)} राशि में जाता है।`) : ""}</p></>}
      {strength ? <p>{n(strength.planet)} · {L("Natal Shadbala", "जन्म षड्बल")}: {strength.rupas.toFixed(2)} / {strength.requiredRupas}. {L("This capacity measure belongs to the natal chart; it is not recalculated strength for this division.", "यह जन्म कुंडली का बल है; इस वर्ग के लिए अलग गणित बल नहीं।")}</p> : <p>{L("Shadbala is not available for this planet in this system.", "इस पद्धति में इस ग्रह का षड्बल उपलब्ध नहीं।")}</p>}
      <button type="button" onClick={() => go("shadbala")}>{L("Inspect strength calculations", "बल गणना देखें")} →</button>
    </section>
    <section hidden={section !== "timing"} className="inspection-chapter"><h4>{L("At the selected date", "चुनी तिथि पर")}</h4><p>{date(at)}</p>{detail.periods.length ? detail.periods.map(period => <p key={period.chain.join("-")}>{n(period.lord)} · {period.chain.length === 1 ? L("Mahadasha", "महादशा") : L("Antardasha", "अंतर्दशा")} · {date(period.start)} – {date(period.end)}</p>) : <p>{L("Neither of the two running period lords matches the selected planet, or this house’s lord, occupants and aspecting planets.", "वर्तमान दो दशा स्वामी चुने ग्रह या इस भाव के स्वामी, स्थित ग्रहों और दृष्टि ग्रहों से मेल नहीं खाते।")}</p>}<small>{L("These are natal period links, not a separate divisional dasha or a forecast of an event. Fine timing depends on birth-time accuracy.", "ये जन्म दशा संबंध हैं; अलग वर्ग दशा या घटना का पूर्वानुमान नहीं। सूक्ष्म समय जन्म-समय पर निर्भर है।")}</small><button type="button" onClick={() => go("dashas")}>{L("Open dasha evidence", "दशा प्रमाण खोलें")} →</button></section>
    <section hidden={section !== "practice"} className="inspection-chapter"><h4>{L("Practical reflection & remedies", "व्यावहारिक चिंतन और उपाय")}</h4><p>{L(...PRACTICE[practicePlanet])}</p><small>{L("A voluntary practice associated with this planet’s traditional themes. It is not a treatment or a promise to change planetary effects. A difficult placement alone is not a basis for buying gemstones or prescribing fasting.", "ग्रह के पारंपरिक विषय से जुड़ा स्वैच्छिक अभ्यास। यह उपचार या ग्रह-प्रभाव बदलने का वादा नहीं। कठिन स्थिति अकेले रत्न खरीदने या उपवास का आधार नहीं।")}</small><button type="button" onClick={() => go("remedies")}>{L("Review the full remedies context", "उपायों का पूरा संदर्भ देखें")} →</button></section>
  </div>;
}
