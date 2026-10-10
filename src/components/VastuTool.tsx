"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { KundaliChart } from "@/lib/astrology/types";
import { evaluateVastu, personalizeVastu, VASTU_ROOM_PREFERENCES } from "@/lib/vastu/evaluate";
import { VASTU_ROOMS, VASTU_ZONES, type PropertyType, type VastuAssessmentInput, type VastuRoom, type VastuZone } from "@/lib/vastu/types";
import type { Locale } from "@/lib/i18n/locale";
import { term } from "@/lib/i18n/terms";

const GRID: (VastuZone | null)[][] = [["NW", "NNW", "N", "NNE", "NE"], ["WNW", null, null, null, "ENE"], ["W", null, "CENTER", null, "E"], ["WSW", null, null, null, "ESE"], ["SW", "SSW", "S", "SSE", "SE"]];
const ZONE_HI: Record<VastuZone, string> = { N: "उत्तर", NNE: "उत्तर-उत्तर-पूर्व", NE: "उत्तर-पूर्व", ENE: "पूर्व-उत्तर-पूर्व", E: "पूर्व", ESE: "पूर्व-दक्षिण-पूर्व", SE: "दक्षिण-पूर्व", SSE: "दक्षिण-दक्षिण-पूर्व", S: "दक्षिण", SSW: "दक्षिण-दक्षिण-पश्चिम", SW: "दक्षिण-पश्चिम", WSW: "पश्चिम-दक्षिण-पश्चिम", W: "पश्चिम", WNW: "पश्चिम-उत्तर-पश्चिम", NW: "उत्तर-पश्चिम", NNW: "उत्तर-उत्तर-पश्चिम", CENTER: "केंद्र" };
const DIRECTION_ANGLES: Record<VastuZone, number> = { N: 0, NNE: 22.5, NE: 45, ENE: 67.5, E: 90, ESE: 112.5, SE: 135, SSE: 157.5, S: 180, SSW: 202.5, SW: 225, WSW: 247.5, W: 270, WNW: 292.5, NW: 315, NNW: 337.5, CENTER: 0 };
const DIRECTION_TRADITION: Partial<Record<VastuZone, { deity: string; theme: string; hindiDeity: string; hindiTheme: string }>> = {
  N: { deity: "Kubera", theme: "North is linked with Kubera in many directional-deity lists. Contemporary home guides often discuss this side in relation to resources and openings.", hindiDeity: "कुबेर", hindiTheme: "कई दिशा-देवता सूचियों में उत्तर को कुबेर से जोड़ा जाता है। आधुनिक गृह मार्गदर्शिकाएँ इस ओर को संसाधनों और खुलाव से जोड़ती हैं।" },
  NE: { deity: "Īśāna", theme: "The north-east is associated with Īśāna in many traditions. Some contemporary schools prefer a lighter, quieter use here; the exact rules vary.", hindiDeity: "ईशान", hindiTheme: "कई परंपराओं में उत्तर-पूर्व को ईशान से जोड़ा जाता है। कुछ आधुनिक पद्धतियाँ यहाँ हल्का और शांत उपयोग पसंद करती हैं; नियम अलग-अलग हैं।" },
  E: { deity: "Indra", theme: "East is linked with Indra in common directional-deity mappings and with sunrise as a daily orientation cue. Daylight at a real home still depends on latitude, season, shading, and nearby buildings.", hindiDeity: "इंद्र", hindiTheme: "प्रचलित दिशा-देवता मानचित्रों में पूर्व को इंद्र और सूर्योदय से जोड़ा जाता है। घर में वास्तविक रोशनी अक्षांश, ऋतु, छाया और आसपास की इमारतों पर निर्भर करती है।" },
  SE: { deity: "Agni", theme: "South-east is associated with Agni, the fire deity. Contemporary Vāstu guides often place cooking or other heat-related functions in this sector; safe ventilation and appliance clearances come first.", hindiDeity: "अग्नि", hindiTheme: "दक्षिण-पूर्व को अग्नि से जोड़ा जाता है। आधुनिक वास्तु मार्गदर्शिकाएँ यहाँ रसोई या ऊष्मा-संबंधी उपयोग सुझाती हैं; सुरक्षित वेंटिलेशन और उपकरणों की दूरी पहले आती है।" },
  S: { deity: "Yama", theme: "South is linked with Yama in common directional-deity mappings. Room advice differs substantially among modern schools; do not read this direction alone as a good-or-bad verdict.", hindiDeity: "यम", hindiTheme: "प्रचलित दिशा-देवता मानचित्रों में दक्षिण को यम से जोड़ा जाता है। आधुनिक पद्धतियों में कमरे संबंधी सुझाव काफी अलग हैं; केवल दिशा को शुभ-अशुभ निर्णय न मानें।" },
  SW: { deity: "Nairṛti", theme: "South-west is linked with Nairṛti in many lists. Some contemporary guides prefer a heavier or more private use here, but this is a convention, not a universal building rule.", hindiDeity: "नैऋति", hindiTheme: "कई सूचियों में दक्षिण-पश्चिम को नैऋति से जोड़ा जाता है। कुछ आधुनिक मार्गदर्शिकाएँ यहाँ भारी या निजी उपयोग पसंद करती हैं; यह परंपरा है, सार्वभौमिक भवन नियम नहीं।" },
  W: { deity: "Varuṇa", theme: "West is associated with Varuṇa in common mappings. Sun exposure can be strong in late afternoon in many places, but local climate and shading determine actual comfort.", hindiDeity: "वरुण", hindiTheme: "प्रचलित मानचित्रों में पश्चिम को वरुण से जोड़ा जाता है। कई स्थानों पर दोपहर बाद धूप तेज हो सकती है, पर वास्तविक आराम स्थानीय जलवायु और छाया से तय होता है।" },
  NW: { deity: "Vāyu", theme: "North-west is linked with Vāyu in common directional-deity mappings. Contemporary room-placement advice varies; practical airflow depends on actual openings, wind, pollution, and security.", hindiDeity: "वायु", hindiTheme: "प्रचलित दिशा-देवता मानचित्रों में उत्तर-पश्चिम को वायु से जोड़ा जाता है। कमरों के सुझाव अलग-अलग हैं; वास्तविक हवा खिड़कियों, पवन, प्रदूषण और सुरक्षा पर निर्भर करती है।" },
  CENTER: { deity: "Brahmā / Brahmasthāna", theme: "The centre of a Vāstu-Puruṣa Maṇḍala is treated as a distinct central field. Many contemporary guides suggest keeping it open, but real structure, circulation, accessibility, and fire safety govern what is possible.", hindiDeity: "ब्रह्मा / ब्रह्मस्थान", hindiTheme: "वास्तु-पुरुष मंडल का केंद्र एक विशिष्ट मध्य क्षेत्र माना जाता है। कई आधुनिक मार्गदर्शिकाएँ इसे खुला रखने को कहती हैं; वास्तविक संरचना, आवागमन, सुगम्यता और अग्नि-सुरक्षा तय करती हैं कि क्या संभव है।" },
};
const ROOM_LABEL: Record<VastuRoom, [string, string]> = {
  living: ["Living area", "बैठक"], kitchen: ["Kitchen", "रसोई"], mainBedroom: ["Main bedroom", "मुख्य शयनकक्ष"], bedroom: ["Bedroom", "शयनकक्ष"],
  prayer: ["Prayer space", "पूजा स्थान"], bathroom: ["Bathroom", "स्नानघर"], toilet: ["Toilet", "शौचालय"], staircase: ["Staircase", "सीढ़ियाँ"],
  water: ["Water source", "जल स्रोत"], study: ["Study area", "पढ़ाई"], work: ["Work area", "कार्य स्थान"], dining: ["Dining area", "भोजन कक्ष"],
  storage: ["Storage", "भंडारण"], balcony: ["Balcony", "बालकनी"], open: ["Open space", "खुला स्थान"], other: ["Other", "अन्य"],
};

const INITIAL: VastuAssessmentInput = {
  propertyType: "apartment", northReference: "compass", entrance: "unknown", rooms: [], floors: 1, planBearing: 0,
  daylight: "unknown", ventilation: "unknown", dampness: "unknown", accessAndSafety: "unknown",
};

export default function VastuTool({ locale = "en", chart, transits }: { locale?: Locale; chart?: KundaliChart; transits?: { planet: string; sign: string; houseFromMoon: number; houseFromLagna: number }[] }) {
  const hi = locale === "hi";
  const [input, setInput] = useState<VastuAssessmentInput>(INITIAL);
  const [propertyName, setPropertyName] = useState("");
  const [guideDirection, setGuideDirection] = useState<VastuZone>("NE");
  const [saved, setSaved] = useState<{ name: string; input: VastuAssessmentInput; savedAt: string }[]>([]);
  const assessment = useMemo(() => evaluateVastu(input), [input]);
  const personal = useMemo(() => chart ? personalizeVastu(chart, transits, locale) : null, [chart, transits, locale]);
  const words = (en: string, hindi: string) => hi ? hindi : en;
  const set = <K extends keyof VastuAssessmentInput>(key: K, value: VastuAssessmentInput[K]) => setInput((old) => ({ ...old, [key]: value }));
  const zoneName = (zone: VastuZone) => hi ? ZONE_HI[zone] : zone === "CENTER" ? "Centre" : zone;
  const roomName = (room: VastuRoom) => ROOM_LABEL[room][hi ? 1 : 0];
  const directionProfile = DIRECTION_TRADITION[guideDirection];
  const roomAdvice = VASTU_ROOMS.filter((room) => VASTU_ROOM_PREFERENCES[room]?.includes(guideDirection));
  const intermediateDescription = (() => {
    if (guideDirection === "CENTER" || directionProfile) return null;
    const angle = DIRECTION_ANGLES[guideDirection];
    const anchors = (["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const).map((zone) => ({ zone, angle: DIRECTION_ANGLES[zone] }));
    const previous = [...anchors].reverse().find((a) => a.angle < angle) ?? anchors[anchors.length - 1];
    const next = anchors.find((a) => a.angle > angle) ?? anchors[0];
    return words(
      `${zoneName(guideDirection)} is a sub-sector between ${zoneName(previous.zone)} and ${zoneName(next.zone)}. Sixteen-sector maps are used by some modern practitioners, but the extra subdivisions do not have one universally agreed set of independent meanings. Treat this as a location label and follow a named tradition if you want a stricter reading.`,
      `${zoneName(guideDirection)} ${zoneName(previous.zone)} और ${zoneName(next.zone)} के बीच का उप-क्षेत्र है। कुछ आधुनिक विशेषज्ञ 16 क्षेत्रों का नक्शा उपयोग करते हैं, लेकिन इन अतिरिक्त उप-विभाजनों के स्वतंत्र अर्थों पर सर्वमान्य सहमति नहीं है। इसे स्थान-सूचक मानें; विस्तृत पारंपरिक अर्थ के लिए किसी स्पष्ट पद्धति का पालन करें।`,
    );
  })();
  const saveProperty = () => {
    let existing = saved;
    try { existing = JSON.parse(localStorage.getItem("papa-vastu-properties-v1") ?? "[]"); } catch { /* Ignore invalid local data. */ }
    const next = [{ name: propertyName.trim() || words("My home", "मेरा घर"), input, savedAt: new Date().toISOString() }, ...existing].slice(0, 8);
    setSaved(next); localStorage.setItem("papa-vastu-properties-v1", JSON.stringify(next));
  };
  const findingText = (f: (typeof assessment.findings)[number]) => {
    if (!hi) return f;
    const room = f.id.startsWith("center-")
      ? f.id.slice("center-".length).replace(/-\d+$/, "") as VastuRoom
      : VASTU_ROOMS.find((key) => f.id.startsWith(`${key}-`));
    const roomLabel = room ? roomName(room) : "";
    if (f.id.startsWith("center-")) return { ...f, title: `${roomLabel} केंद्र में`, tradition: "कई आधुनिक वास्तु पद्धतियाँ मध्य क्षेत्र को हल्का, खुला और अवरोधरहित रखने की सलाह देती हैं। परंपराएँ और नक्शे अलग हो सकते हैं।", practical: "देखें कि व्यवस्था आवागमन, रोशनी या उपयोगी जगह को रोकती तो नहीं।", action: "सुविधाजनक हो तो यहाँ भारी सामान या अवरोध कम करें। केवल इस सुझाव के कारण दीवार या पाइपलाइन न बदलें।" };
    if (f.id === "toilet-northeast") return { ...f, title: "उत्तर-पूर्व में शौचालय", tradition: "कुछ आधुनिक वास्तु पद्धतियाँ उत्तर-पूर्व में शौचालय से बचने की सलाह देती हैं। मत भिन्न हो सकते हैं।", practical: "दिशा से अलग, जलरोधक व्यवस्था, निकासी, हवादारी और स्वच्छता देखें।", action: "रखरखाव और हवादारी को प्राथमिकता दें। केवल दिशा के आधार पर पाइपलाइन न बदलें।" };
    if (room) return { ...f, title: `${roomLabel} ${zoneName(f.zone!) } में`, tradition: `${roomLabel} के लिए आधुनिक वास्तु परंपराओं में अलग-अलग दिशाएँ सुझाई जाती हैं। यह नियम सभी ग्रंथों, क्षेत्रों या विशेषज्ञों में समान नहीं है।`, practical: room === "kitchen" ? "हर दिशा में धुआँ निकासी, उपकरणों के आसपास सुरक्षित जगह और ज्वलनशील वस्तुओं से दूरी ज़रूरी है।" : "कोई बदलाव सोचने से पहले आराम, रोशनी, निजता और रोज़मर्रा के आवागमन पर विचार करें।", action: "इसे विचार का संकेत मानें। पहले फर्नीचर या उपयोग में सरल बदलाव देखें; संरचनात्मक बदलाव से पहले योग्य वास्तुकार से सलाह लें।" };
    const local: Record<string, { title: string; tradition: string; practical: string; action: string }> = {
      "entrance-unknown": { title: "प्रवेश दिशा उपलब्ध नहीं", tradition: "पारंपरिक प्रवेश मूल्यांकन में केवल दिशा नहीं, दीवार पर द्वार की सटीक स्थिति भी देखी जा सकती है।", practical: "नक्शे का ऊपरी किनारा उत्तर होना ज़रूरी नहीं। कम्पास या सही उत्तर दिशा वाले नक्शे से पुष्टि करें।", action: "पुष्टि होने पर प्रवेश दिशा भरें। अभी इस रिपोर्ट में प्रवेश का आकलन अधूरा है।" },
      "entrance-conventional": { title: `मुख्य प्रवेश ${zoneName(f.zone!)} दिशा में`, tradition: "कई आधुनिक वास्तु मार्गदर्शिकाएँ उत्तर, उत्तर-पूर्व और पूर्व को अनुकूल मानती हैं, हालांकि द्वार के विस्तृत नियम अलग हैं।", practical: "प्रवेश को रोशन, खुला, मौसम से सुरक्षित और आसानी से आने-जाने योग्य रखें।", action: "विस्तृत पारंपरिक मूल्यांकन के लिए दीवार पर द्वार की जगह और अपनाई जाने वाली पद्धति दर्ज करें।" },
      "entrance-context": { title: `मुख्य प्रवेश ${zoneName(f.zone!)} दिशा में`, tradition: "केवल प्रवेश दिशा से घर को शुभ या अशुभ नहीं कहा जा सकता। द्वार की स्थिति और वास्तु पद्धति से अर्थ बदल सकता है।", practical: "हर दिशा में सुरक्षित, स्पष्ट, मौसम से सुरक्षित प्रवेश और खुला रास्ता उपयोगी है।", action: "केवल दिशा के आधार पर किसी संरचनात्मक बदलाव की सलाह नहीं है।" },
      daylight: { title: "प्राकृतिक रोशनी कम", tradition: "पारंपरिक स्थापत्य में भवन की दिशा और भीतर आने वाली धूप पर विचार किया जाता है।", practical: "रोशनी, खिड़कियों की स्थिति, छाया और स्थानीय जलवायु के अनुसार डिज़ाइन महत्वपूर्ण हैं।", action: "खिड़कियों को खुला रखें और सुरक्षित, बिना निर्माण वाले तरीकों से रोशनी बढ़ाने पर विचार करें।" },
      ventilation: { title: "हवादारी कम", tradition: "पारंपरिक इमारतों में जलवायु के अनुकूल डिज़ाइन के हिस्से के रूप में हवा के रास्ते रखे जाते थे।", practical: "कम हवादारी से प्रदूषक और नमी जमा हो सकती है। प्राकृतिक हवा का लाभ बाहर की हवा की गुणवत्ता और सुरक्षा पर निर्भर करता है।", action: "बाहर की हवा और सुरक्षा को ध्यान में रखकर योग्य भवन विशेषज्ञ के साथ हवादारी और सीलन की समस्या देखें।" },
      dampness: { title: "सीलन या फफूंदी की सूचना", tradition: "यह कैलकुलेटर सीलन को वास्तु दोष नहीं मानता।", practical: "लगातार नमी के स्रोत, जल निकासी, रिसाव और हवादारी की जाँच ज़रूरी है।", action: "नमी का स्रोत ठीक करें। फफूंदी बनी रहे तो योग्य भवन या स्वास्थ्य विशेषज्ञ से सलाह लें।" },
      "safety-access": { title: "सुरक्षा या आवागमन पर ध्यान दें", tradition: "पारंपरिक व्याख्या भवन सुरक्षा जाँच की जगह नहीं लेती।", practical: "खुले रास्ते, सुरक्षित सीढ़ियाँ, सुलभ सुविधाएँ और सुरक्षित बिजली व अग्नि व्यवस्था प्राथमिक हैं।", action: "तत्काल जोखिम पहले दूर करें और स्थानीय भवन तथा अग्नि सुरक्षा नियमों का पालन करें।" },
    };
    const translated = local[f.id];
    return translated ? { ...f, ...translated } : f;
  };
  const northNote = hi
    ? input.northReference === "estimated" ? "उत्तर का अनुमान लगाया गया है, इसलिए दिशाओं से जुड़े सुझाव बदल सकते हैं। कम्पास या उत्तर दिशा वाले नक्शे से दोबारा जाँचें।" : input.northReference === "plan" ? "दिशाएँ आपके नक्शे के उत्तर चिह्न पर आधारित हैं। दिशा-आधारित सुझावों से पहले चिह्न की पुष्टि करें।" : "दिशाएँ आपके कम्पास माप पर आधारित हैं। पास की धातु और इलेक्ट्रॉनिक उपकरण कम्पास को प्रभावित कर सकते हैं।"
    : assessment.northNote;
  const levelLabel = (level: "priority" | "consider" | "note") => level === "priority" ? words("Priority", "प्राथमिकता") : level === "consider" ? words("Consider", "विचार करें") : words("Note", "ध्यान दें");

  return (
    <div className="space-y-7">
      <header className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold tracking-wide text-gold-bright">{words("VĀSTU · HOME & SPACE", "वास्तु · घर और स्थान")}</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-cream md:text-5xl">{chart ? words("Your home, read with your Kundli", "आपका घर, आपकी कुंडली के साथ") : words("Understand your home with Vāstu", "वास्तु से अपने घर को समझें")}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted">
          {words("Map the home by its real north direction, then review room placement and practical conditions. With a Kundli, see your personal home and property themes alongside the layout.", "घर को वास्तविक उत्तर दिशा के अनुसार मैप करें और कमरों की स्थिति व व्यावहारिक परिस्थितियाँ देखें। कुंडली जोड़ने पर लेआउट के साथ आपके व्यक्तिगत गृह और संपत्ति संकेत भी दिखेंगे।")}
        </p>
      </header>

      {personal && chart && <section className="card-edge rounded-2xl p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-sm font-semibold text-gold-bright">{words("PERSONAL JYOTISH CONTEXT", "व्यक्तिगत ज्योतिष संदर्भ")}</p><h2 className="mt-1 text-xl font-bold text-cream">{words("Your chart’s home themes", "आपकी कुंडली के गृह संकेत")}</h2></div>
          <span className="rounded-full border border-border px-3 py-1.5 text-xs text-muted">{words("D1 · D4 · Dasha · Shadbala", "D1 · D4 · दशा · षड्बल")}</span>
        </div>
        <p className="mt-4 rounded-xl bg-surface/70 p-4 text-sm leading-relaxed text-cream">
          <strong>{words("Birth details:", "जन्म विवरण:")}</strong> {chart.input.name} · {chart.input.date} {words("at", "समय")} {chart.input.time} · {chart.input.place} · {words("Lagna", "लग्न")} {term(locale, chart.ascendant.sign)}.
          <br /><strong>{words("4th house:", "चतुर्थ भाव:")}</strong> {term(locale, personal.fourthHouse.sign)} · {term(locale, personal.fourthHouse.lord)} {words("in", "")}{term(locale, personal.fourthHouse.lordSign)}, {words("house", "भाव")} {personal.fourthHouse.lordHouse} · {personal.fourthHouse.condition}{personal.fourthHouse.occupants.length ? ` · ${words("occupied by", "स्थित ग्रह")}: ${personal.fourthHouse.occupants.map((p) => term(locale, p)).join(", ")}` : ""}.
          <br /><strong>{words("Moon:", "चंद्र:")}</strong> {term(locale, personal.moon.sign)}, {term(locale, personal.moon.nakshatra)} · {personal.moon.condition}.
          <br /><strong>{words("D4 Chaturthāṁśa:", "D4 चतुर्थांश:")}</strong> {term(locale, personal.homeVarga.ascendant)} {words("rising; 4th house", "लग्न; चतुर्थ भाव")} {term(locale, personal.homeVarga.fourthHouseSign)}; {term(locale, personal.homeVarga.fourthLord)} {words("in house", "भाव में")} {personal.homeVarga.fourthLordHouse}.
          <br /><strong>{words("Current period:", "वर्तमान दशा:")}</strong> {personal.runningPeriod}.
        </p>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {personal.priorities.map((item) => <li key={item.title} className="rounded-xl border border-border/70 p-4">
            <h3 className="font-semibold text-cream">{item.title}</h3><p className="mt-1 text-sm leading-relaxed text-muted">{item.detail}</p><p className="mt-2 text-[11px] text-gold-bright">{words("Chart basis", "कुंडली आधार")}: {item.source}</p>
          </li>)}
        </ul>
        <p className="mt-4 text-xs leading-relaxed text-muted">{personal.note}</p>
      </section>}

      <section id="vastu-guide" className="relative overflow-hidden rounded-[2rem] border border-gold/25 bg-[radial-gradient(ellipse_at_12%_10%,color-mix(in_oklab,var(--color-gold),transparent_91%),transparent_42%),linear-gradient(145deg,var(--color-surface),var(--color-ink-deep))] p-5 shadow-[0_24px_70px_var(--floating-shadow)] md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full border border-gold/10" /><div className="pointer-events-none absolute -right-12 -top-16 size-56 rounded-full border border-gold/10" />
        <div className="relative">
          <div className="max-w-3xl"><p className="text-xs font-bold tracking-[.22em] text-gold-bright">{words("A READER’S GUIDE", "पाठक मार्गदर्शिका")}</p><h2 className="mt-2 text-3xl font-bold text-cream md:text-4xl">{words("Learn the Vāstu map", "वास्तु दिशा-मानचित्र समझें")}</h2><p className="mt-3 text-sm leading-relaxed text-muted">{words("Vāstuśāstra is a family of Indian architectural and planning traditions. This guide separates historical spatial ideas, common contemporary room conventions, and practical building observations so you can see what kind of claim you are reading.", "वास्तुशास्त्र भारतीय स्थापत्य और योजना की अनेक परंपराओं का समूह है। यह मार्गदर्शिका ऐतिहासिक स्थानिक विचारों, प्रचलित आधुनिक कमरे-संबंधी मान्यताओं और व्यावहारिक भवन अवलोकनों को अलग रखती है।")}</p></div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <TheoryCard index="01" title={words("Maṇḍala · a planning diagram", "मंडल · योजना का आरेख")} body={words("The Vāstu-Puruṣa Maṇḍala is a square planning framework divided into padas (cells). Different texts and building types use different grid counts and rules. It is a way to organize space, not a universal modern apartment checklist.", "वास्तु-पुरुष मंडल पदों (खानों) में विभाजित वर्गाकार योजना-रूप है। अलग ग्रंथ और भवन प्रकार अलग ग्रिड और नियम अपनाते हैं। यह स्थान व्यवस्थित करने का तरीका है, हर आधुनिक अपार्टमेंट के लिए एक जैसा नियम-पत्र नहीं।")} />
            <TheoryCard index="02" title={words("Pañca mahābhūta · five elements", "पंचमहाभूत · पाँच तत्व")} body={words("Earth, water, fire, air, and space form a traditional philosophical vocabulary used in many interpretations. Here they are presented as symbolic ideas; they are not measured forces or engineering diagnostics.", "पृथ्वी, जल, अग्नि, वायु और आकाश कई पारंपरिक व्याख्याओं की दार्शनिक भाषा हैं। यहाँ इन्हें प्रतीकात्मक विचारों के रूप में रखा गया है; ये मापी हुई शक्तियाँ या भवन-जाँच के उपकरण नहीं हैं।")} />
            <TheoryCard index="03" title={words("A useful reading order", "उपयोगी अध्ययन क्रम")} body={words("First establish true north and the property boundary. Then map room functions and the entrance. Read directional conventions as one interpretive lens; separately check light, airflow, moisture, access, structure, and local codes.", "पहले वास्तविक उत्तर और संपत्ति की सीमा तय करें। फिर कमरों के उपयोग और प्रवेश को नक्शे पर रखें। दिशा-संबंधी मान्यताओं को एक व्याख्या की तरह पढ़ें; रोशनी, हवा, नमी, आवागमन, संरचना और स्थानीय नियम अलग से जाँचें।")} />
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(18rem,.9fr)]">
            <div className="rounded-3xl border border-border/80 bg-ink-deep/55 p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-bold tracking-widest text-gold-bright">{words("16 SECTORS + CENTRE", "16 दिशाएँ + केंद्र")}</p><h3 className="mt-1 text-lg font-bold text-cream">{words("Select a direction to read", "पढ़ने के लिए दिशा चुनें")}</h3></div><span aria-hidden="true" className="grid size-10 place-items-center rounded-full border border-gold/35 text-lg text-gold-bright">✧</span></div>
              <div className="mx-auto grid max-w-[34rem] grid-cols-5 gap-1.5 sm:gap-2" role="group" aria-label={words("Interactive Vastu direction guide", "इंटरैक्टिव वास्तु दिशा मार्गदर्शिका")}>
                {GRID.flatMap((row, ri) => row.map((zone, ci) => {
                  if (!zone) return <span key={`guide-gap-${ri}-${ci}`} className="aspect-square" aria-hidden="true" />;
                  const major = ["N", "E", "S", "W", "CENTER"].includes(zone);
                  return <button key={zone} type="button" aria-pressed={guideDirection === zone} onClick={() => setGuideDirection(zone)} className={`group relative flex aspect-square min-w-0 flex-col items-center justify-center overflow-hidden rounded-2xl border transition duration-200 focus-visible:scale-[1.04] ${guideDirection === zone ? "border-gold bg-gold text-on-gold shadow-[0_0_28px_color-mix(in_oklab,var(--color-gold),transparent_68%)]" : major ? "border-gold/30 bg-gold/5 text-cream hover:border-gold/70 hover:bg-gold/10" : "border-border/80 bg-surface/65 text-muted hover:border-gold/45 hover:text-cream"}`}>
                    <span className={`text-[10px] font-extrabold sm:text-sm ${major ? "" : "font-semibold"}`}>{zone === "CENTER" ? "✺" : zone}</span>
                    <span className={`mt-0.5 text-[8px] leading-tight sm:text-[10px] ${guideDirection === zone ? "opacity-80" : "opacity-65"}`}>{zone === "CENTER" ? words("CORE", "केंद्र") : `${DIRECTION_ANGLES[zone]}°`}</span>
                  </button>;
                }))}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted"><span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-gold" />{words("Cardinal anchors", "मुख्य दिशाएँ")}</span><span>{words("Angles clockwise from north", "उत्तर से घड़ी की दिशा में कोण")}</span></div>
            </div>
            <article aria-live="polite" className="relative flex min-h-64 flex-col justify-between overflow-hidden rounded-3xl border border-gold/25 bg-[linear-gradient(150deg,color-mix(in_oklab,var(--color-gold),transparent_91%),var(--color-surface)_60%)] p-5 sm:p-6">
              <div className="pointer-events-none absolute -right-7 -top-7 size-32 rounded-full border border-gold/15" />
              <div className="relative"><p className="text-xs font-bold tracking-widest text-gold-bright">{words("DIRECTION PROFILE", "दिशा परिचय")}</p><div className="mt-3 flex items-end justify-between gap-3"><h3 className="text-3xl font-extrabold text-cream">{zoneName(guideDirection)}</h3><span className="font-tabular rounded-full border border-border px-3 py-1 text-xs text-muted">{guideDirection === "CENTER" ? "—" : `${DIRECTION_ANGLES[guideDirection]}°`}</span></div>
                {directionProfile ? <><p className="mt-3 text-sm font-semibold text-gold-bright">{words("Traditional association", "पारंपरिक संबंध")}: {hi ? directionProfile.hindiDeity : directionProfile.deity}</p><p className="mt-2 text-sm leading-relaxed text-muted">{hi ? directionProfile.hindiTheme : directionProfile.theme}</p></> : <><p className="mt-3 text-sm font-semibold text-gold-bright">{words("Sub-sector · interpretive detail varies", "उप-दिशा · अर्थ पद्धति के अनुसार बदलता है")}</p><p className="mt-2 text-sm leading-relaxed text-muted">{intermediateDescription}</p></>}
                <div className="mt-4"><p className="text-xs font-bold uppercase tracking-wider text-cream">{words("Common room preferences in this tool", "इस टूल में प्रचलित कमरे-संबंधी सुझाव")}</p>{roomAdvice.length ? <div className="mt-2 flex flex-wrap gap-1.5">{roomAdvice.map((room) => <span key={room} className="rounded-full border border-gold/30 bg-gold/5 px-2.5 py-1 text-xs text-gold-bright">{roomName(room)}</span>)}</div> : <p className="mt-2 text-xs text-muted">{words("No room is assigned a preference for this zone in the current rule set.", "वर्तमान नियम-संग्रह में इस दिशा के लिए किसी कमरे का सुझाव नहीं है।")}</p>}<p className="mt-2 text-xs leading-relaxed text-muted">{words("These are contemporary conventions, not a single rule shared by all Vāstu texts or practitioners. The calculator offers a reflection point, not a property grade.", "ये आधुनिक प्रचलन हैं; सभी वास्तु ग्रंथों या विशेषज्ञों का एकमत नियम नहीं। कैलकुलेटर चिंतन-बिंदु देता है, संपत्ति का ग्रेड नहीं।")}</p></div>
              </div><div className="relative mt-5 rounded-xl border border-border/70 bg-ink-deep/45 p-3"><p className="text-xs font-bold uppercase tracking-wider text-cream">{words("How to apply it", "इसे कैसे समझें")}</p><p className="mt-1 text-xs leading-relaxed text-muted">{words("An orientation does not make a home or room inherently auspicious or harmful. Check the actual use, occupants, climate, daylight, ventilation, access, and building constraints.", "कोई दिशा अपने आप घर या कमरे को शुभ या हानिकारक नहीं बनाती। वास्तविक उपयोग, रहने वालों, जलवायु, रोशनी, हवा, आवागमन और भवन की सीमाएँ देखें।")}</p></div>
            </article>
          </div>
          <div className="mt-5 grid gap-3 rounded-2xl border border-border/70 bg-surface/40 p-4 md:grid-cols-3"><div><p className="text-xs font-bold text-gold-bright">{words("Traditional framework", "पारंपरिक ढाँचा")}</p><p className="mt-1 text-xs leading-relaxed text-muted">{words("A symbolic map for ordering and interpreting space.", "स्थान को व्यवस्थित और समझने का प्रतीकात्मक मानचित्र।")}</p></div><div><p className="text-xs font-bold text-gold-bright">{words("Contemporary conventions", "आधुनिक प्रचलन")}</p><p className="mt-1 text-xs leading-relaxed text-muted">{words("Room directions differ among schools; this tool identifies them as conventions.", "कमरों की दिशाओं पर पद्धतियों में मतभेद हैं; यह टूल इन्हें मान्यता कहता है।")}</p></div><div><p className="text-xs font-bold text-gold-bright">{words("Practical building checks", "व्यावहारिक भवन जाँच")}</p><p className="mt-1 text-xs leading-relaxed text-muted">{words("Moisture, ventilation, daylight, and safe circulation are observable conditions.", "नमी, हवादारी, प्राकृतिक रोशनी और सुरक्षित आवागमन प्रत्यक्ष स्थितियाँ हैं।")}</p></div></div>
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            <TheoryCard index="04" title={words("How to read a plan", "नक्शा कैसे पढ़ें")} body={words("Start with a correctly oriented boundary. Divide the usable plan into a consistent square or rectangular grid, mark the centre, and locate walls, doors, windows, stairs, wet areas, and open spaces. A compass reading can be distorted indoors; compare it with a survey or north arrow where possible. For an apartment, assess the unit separately from the building or society gate.", "सही दिशा वाले भूखंड से शुरू करें। उपयोगी नक्शे को एक समान वर्ग या आयताकार ग्रिड में बाँटें, केंद्र चिह्नित करें और दीवार, दरवाज़े, खिड़कियाँ, सीढ़ियाँ, गीले क्षेत्र और खुले स्थान दर्ज करें। इमारत के भीतर कम्पास प्रभावित हो सकता है; संभव हो तो सर्वे या उत्तर-चिह्न से मिलाएँ। अपार्टमेंट में फ्लैट के प्रवेश को सोसायटी द्वार से अलग देखें।")} />
            <TheoryCard index="05" title={words("Entrance · direction and pada", "प्रवेश · दिशा और पद")} body={words("Facing direction is only a first description. Some Vāstu methods divide a side of the building into padas and consider the door’s position within that side. The side length, chosen grid, start point, building type, and textual tradition affect the count. This calculator records a broad direction only; it does not claim a pada-level verdict.", "मुख-दिशा केवल प्रारंभिक विवरण है। कुछ वास्तु पद्धतियाँ भवन की एक भुजा को पदों में बाँटकर उस भुजा पर द्वार की जगह देखती हैं। भुजा की लंबाई, चुना ग्रिड, शुरुआती बिंदु, भवन-प्रकार और ग्रंथ परंपरा गणना बदलते हैं। यह कैलकुलेटर केवल सामान्य दिशा दर्ज करता है; पद-स्तरीय निर्णय नहीं देता।")} />
            <TheoryCard index="06" title={words("Room use · people · climate", "कमरे · रहने वाले · जलवायु")} body={words("A room map is only useful when it reflects how people actually live. Consider privacy, accessibility, family routines, cooking safety, plumbing, daylight, heat, cross-ventilation, noise, and local weather. Where a traditional preference conflicts with safe or accessible use, practical needs and building codes take priority.", "कमरों का नक्शा तभी उपयोगी है जब वह वास्तविक जीवन को दिखाए। निजता, सुगम्यता, परिवार की दिनचर्या, रसोई सुरक्षा, पाइपलाइन, रोशनी, गर्मी, हवा का प्रवाह, शोर और स्थानीय मौसम देखें। पारंपरिक सुझाव सुरक्षित या सुगम उपयोग से टकराए तो व्यावहारिक ज़रूरतें और भवन नियम पहले आते हैं।")} />
            <TheoryCard index="07" title={words("Vāstu with a Kundli", "कुंडली के साथ वास्तु")} body={words("The chart layer is a separate Jyotiṣa reflection: this app looks at the 4th house and its lord, Moon, D4 Chaturthāṁśa, strength measures, related houses, periods, and major transits. It can add personal themes and timing for reflection; it cannot diagnose a building, certify a property, or replace the measured floor plan.", "कुंडली वाला भाग अलग ज्योतिषीय चिंतन है: ऐप चतुर्थ भाव और उसके स्वामी, चंद्र, D4 चतुर्थांश, ग्रह-बल, संबंधित भाव, दशा और प्रमुख गोचर देखता है। यह व्यक्तिगत विषय और चिंतन का समय-संदर्भ दे सकता है; भवन की जाँच, संपत्ति प्रमाणन या मापे हुए नक्शे का विकल्प नहीं है।")} />
          </div>
        </div>
      </section>

      <section className="card-edge rounded-2xl p-5 md:p-6">
        <div><h2 className="text-xl font-bold text-cream">{words("1. Property details", "1. संपत्ति का विवरण")}</h2><p className="mt-1 text-sm text-muted">{words("You can leave any direction or condition as unknown. The report will show what it could not assess.", "किसी भी दिशा या स्थिति को अज्ञात छोड़ सकते हैं। रिपोर्ट बताएगी कि किसका आकलन नहीं हो पाया।")}</p></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label={words("Property type", "संपत्ति का प्रकार")}><select value={input.propertyType} onChange={(e) => set("propertyType", e.target.value as PropertyType)} className={control}><option value="apartment">{words("Apartment", "अपार्टमेंट")}</option><option value="house">{words("Independent house", "स्वतंत्र घर")}</option></select></Field>
          <Field label={words("How did you establish north?", "उत्तर दिशा कैसे तय की?")}><select value={input.northReference} onChange={(e) => set("northReference", e.target.value as VastuAssessmentInput["northReference"])} className={control}><option value="compass">{words("Compass", "कम्पास")}</option><option value="plan">{words("North-marked floor plan", "उत्तर चिह्न वाला नक्शा")}</option><option value="estimated">{words("Estimated", "अनुमानित")}</option></select></Field>
          <Field label={words("Main entrance zone", "मुख्य प्रवेश दिशा")}><select value={input.entrance} onChange={(e) => set("entrance", e.target.value as VastuZone | "unknown")} className={control}><option value="unknown">{words("Not sure", "पता नहीं")}</option>{VASTU_ZONES.filter((z) => z !== "CENTER").map((z) => <option key={z} value={z}>{zoneName(z)}</option>)}</select><span className="mt-1 block text-xs font-normal text-muted">{words("Use the entrance to your home or apartment unit, not the society gate.", "अपने घर या अपार्टमेंट के प्रवेश का उपयोग करें, सोसायटी के मुख्य द्वार का नहीं।")}</span></Field>
          <Field label={words("Number of floors", "मंजिलों की संख्या")}><select value={input.floors} onChange={(e) => set("floors", Number(e.target.value))} className={control}>{[1,2,3,4,5,6,7,8,9,10].map((n) => <option key={n} value={n}>{n}</option>)}</select></Field>
          <Field label={words("Floor plan top edge bearing from north", "उत्तर से नक्शे के ऊपरी किनारे का कोण")}><select value={input.planBearing} onChange={(e) => set("planBearing", Number(e.target.value))} className={control}>{Array.from({length: 16}, (_, i) => i * 22.5).map((n) => <option key={n} value={n}>{n}°</option>)}</select><span className="mt-1 block text-xs font-normal text-muted">{words("Set this only if you are entering rooms by their position on a rotated plan. Cardinal direction labels remain true-north based.", "घुमाए हुए नक्शे पर कमरों की स्थिति दर्ज करते समय ही इसे बदलें। दिशा के नाम वास्तविक उत्तर पर आधारित रहते हैं।")}</span></Field>
        </div>
      </section>

      <section className="card-edge rounded-2xl p-5 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-bold text-cream">{words("2. Place the main use of each zone", "2. हर दिशा में मुख्य उपयोग चुनें")}</h2><p className="mt-1 text-sm text-muted">{words("The map is north-up. Select one primary room or feature in each zone; leave unmarked zones blank.", "नक्शे में उत्तर ऊपर है। हर दिशा में एक मुख्य कमरा या उपयोग चुनें; खाली दिशा छोड़ सकते हैं।")}</p></div><span className="text-xs text-gold-bright">↑ {words("NORTH", "उत्तर")}</span></div>
        <div className="mx-auto mt-5 grid max-w-3xl grid-cols-5 gap-1.5 sm:gap-2">
          {GRID.flatMap((row, ri) => row.map((zone, ci) => {
            if (!zone) return <span key={`${ri}-${ci}`} className="min-h-16 sm:min-h-24" aria-hidden="true" />;
            const room = input.rooms.find((placement) => placement.zone === zone)?.room;
            return <label key={`${ri}-${ci}`} className={`flex min-h-24 min-w-0 flex-col justify-between rounded-xl border p-2 sm:min-h-28 sm:p-3 ${zone === "CENTER" ? "border-gold/50 bg-gold/5" : "border-border bg-surface/60"}`}>
              <span className="text-[10px] font-bold text-gold-bright sm:text-xs">{zoneName(zone)}{zone === "CENTER" ? ` · ${words("Brahmasthan", "ब्रह्मस्थान")}` : ""}</span>
              <select aria-label={`${zoneName(zone)} ${words("zone use", "दिशा का उपयोग")}`} value={room ?? ""} onChange={(e) => setInput((old) => ({ ...old, rooms: old.rooms.filter((p) => p.zone !== zone || p.floor !== 1), ...(e.target.value ? { rooms: [...old.rooms.filter((p) => p.zone !== zone || p.floor !== 1), { id: `${zone}-1`, zone, floor: 1, room: e.target.value as VastuRoom }] } : {}) }))} className="mt-2 w-full rounded-lg border border-border bg-ink-deep px-1 py-2 text-[10px] text-cream sm:px-2 sm:text-xs">
                <option value="">{words("Choose use…", "उपयोग चुनें…")}</option>{VASTU_ROOMS.map((r) => <option key={r} value={r}>{roomName(r)}</option>)}
              </select>
            </label>;
          }))}
        </div>
        <div className="mx-auto mt-4 max-w-3xl rounded-xl border border-border p-4"><h3 className="font-semibold text-cream">{words("Rooms by floor", "मंजिल के अनुसार कमरे")}</h3><p className="mt-1 text-xs text-muted">{words("Add every room or feature. The compass map shows the main ground-floor use; this list records additional rooms and floors.", "हर कमरे या उपयोग को जोड़ें। कम्पास नक्शा भूतल का मुख्य उपयोग दिखाता है; यह सूची अतिरिक्त कमरों और मंजिलों को दर्ज करती है।")}</p><div className="mt-3 space-y-2">{input.rooms.map((placement) => <div key={placement.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-surface/60 p-2 text-sm"><span className="text-cream">{roomName(placement.room)} · {zoneName(placement.zone)} · {words("Floor", "मंजिल")} {placement.floor}</span><button type="button" onClick={() => setInput((old) => ({ ...old, rooms: old.rooms.filter((p) => p.id !== placement.id) }))} className="ml-auto text-xs text-rose">{words("Remove", "हटाएँ")}</button></div>)}</div><div className="mt-3 grid gap-2 sm:grid-cols-4"><select id="add-room-zone" className={control}>{VASTU_ZONES.map((z) => <option key={z} value={z}>{zoneName(z)}</option>)}</select><select id="add-room-type" className={control}>{VASTU_ROOMS.map((r) => <option key={r} value={r}>{roomName(r)}</option>)}</select><select id="add-room-floor" className={control}>{Array.from({length: input.floors}, (_, i) => i + 1).map((f) => <option key={f} value={f}>{words("Floor", "मंजिल")} {f}</option>)}</select><button type="button" className="rounded-xl border border-gold/50 px-3 py-2 text-sm text-gold-bright" onClick={() => { const zone = (document.getElementById("add-room-zone") as HTMLSelectElement).value as VastuZone; const room = (document.getElementById("add-room-type") as HTMLSelectElement).value as VastuRoom; const floor = Number((document.getElementById("add-room-floor") as HTMLSelectElement).value); setInput((old) => ({ ...old, rooms: [...old.rooms, { id: `${Date.now()}-${Math.random()}`, zone, room, floor }] })); }}>{words("Add room", "कमरा जोड़ें")}</button></div></div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted"><span className="mr-1">{words("Room key", "कमरे")}</span>{VASTU_ROOMS.slice(0, 10).map((r) => <span key={r} className="rounded-full border border-border px-2 py-1">{roomName(r)}</span>)}</div>
      </section>

      <section className="card-edge rounded-2xl p-5 md:p-6">
        <h2 className="text-xl font-bold text-cream">{words("3. Practical home conditions", "3. घर की व्यावहारिक स्थितियाँ")}</h2>
        <p className="mt-1 text-sm text-muted">{words("These observations are reported separately from traditional Vāstu conventions.", "ये सुझाव पारंपरिक वास्तु नियमों से अलग दिखाए जाते हैं।")}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Choice label={words("Natural daylight", "प्राकृतिक रोशनी")} value={input.daylight} values={[["good", words("Good", "अच्छी")], ["mixed", words("Mixed", "मध्यम")], ["limited", words("Limited", "कम")], ["unknown", words("Unknown", "अज्ञात")]]} onChange={(v) => set("daylight", v as VastuAssessmentInput["daylight"])} />
          <Choice label={words("Ventilation", "हवादारी")} value={input.ventilation} values={[["good", words("Good", "अच्छी")], ["mixed", words("Mixed", "मध्यम")], ["limited", words("Limited", "कम")], ["unknown", words("Unknown", "अज्ञात")]]} onChange={(v) => set("ventilation", v as VastuAssessmentInput["ventilation"])} />
          <Choice label={words("Dampness or mould", "सीलन या फफूंदी")} value={input.dampness} values={[["no", words("No", "नहीं")], ["yes", words("Yes", "हाँ")], ["unknown", words("Unknown", "अज्ञात")]]} onChange={(v) => set("dampness", v as VastuAssessmentInput["dampness"])} />
          <Choice label={words("Access and safety", "आवागमन और सुरक्षा")} value={input.accessAndSafety} values={[["good", words("Good", "अच्छी")], ["needsAttention", words("Needs attention", "ध्यान आवश्यक")], ["unknown", words("Unknown", "अज्ञात")]]} onChange={(v) => set("accessAndSafety", v as VastuAssessmentInput["accessAndSafety"])} />
        </div>
      </section>

      <section className="space-y-4">
        <div className="card-edge rounded-2xl p-5 md:p-6">
          <h2 className="text-2xl font-bold text-cream">{words("Your home assessment", "आपके घर का आकलन")}</h2>
          <p className="mt-2 text-sm text-muted">{northNote}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs"><Count value={assessment.summary.priority} label={words("priority", "प्राथमिकता")} tone="rose" /><Count value={assessment.summary.consider} label={words("to consider", "विचार योग्य")} tone="gold" /><Count value={assessment.summary.notes} label={words("notes", "टिप्पणी")} tone="muted" /></div>
          {assessment.findings.length === 0 && <p className="mt-5 rounded-xl border border-border p-4 text-sm text-muted">{words("Add a room or home condition above to see the corresponding observations here.", "संबंधित सुझाव देखने के लिए ऊपर कमरे या घर की स्थिति भरें।")}</p>}
        </div>
        {assessment.findings.map((raw) => { const f = findingText(raw); return <article key={f.id} className="card-edge rounded-2xl p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-semibold text-cream">{f.title}{f.zone && <span className="ml-2 text-sm font-normal text-muted">· {zoneName(f.zone)}</span>}</h3><p className="mt-1 text-xs font-semibold text-gold-bright">{f.sourceType === "practical-housing-guidance" ? words("Practical home guidance", "व्यावहारिक गृह मार्गदर्शन") : words("Common contemporary Vāstu convention · varies by school", "प्रचलित आधुनिक वास्तु परंपरा · मतानुसार भिन्न")}</p></div><span className={`rounded-full border px-3 py-1 text-xs ${f.level === "priority" ? "border-rose/40 text-rose" : f.level === "consider" ? "border-gold/40 text-gold-bright" : "border-border text-muted"}`}>{levelLabel(f.level)}</span></div>
          <div className="mt-4 grid gap-3 md:grid-cols-2"><p className="text-sm leading-relaxed text-muted"><strong className="text-cream">{words("Traditional reading", "पारंपरिक अर्थ")}: </strong>{f.tradition}</p><p className="text-sm leading-relaxed text-muted"><strong className="text-cream">{words("Practical view", "व्यावहारिक पक्ष")}: </strong>{f.practical}</p></div>
          <p className="mt-3 rounded-xl bg-surface/70 p-3 text-sm leading-relaxed text-cream"><strong>{words("Possible next step", "संभव अगला कदम")}: </strong>{f.action}</p>
        </article>; })}
      </section>

      <section className="card-edge flex flex-wrap items-end gap-3 rounded-2xl p-5"><label className="min-w-48 flex-1 text-sm text-cream">{words("Save or compare properties", "संपत्ति सहेजें या तुलना करें")}<input value={propertyName} onChange={(e) => setPropertyName(e.target.value)} placeholder={words("Property name", "संपत्ति का नाम")} className={`${control} mt-2`} /></label><button type="button" onClick={saveProperty} className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-on-gold">{words("Save this assessment", "यह आकलन सहेजें")}</button><button type="button" onClick={() => window.print()} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-cream">{words("Print / save PDF", "प्रिंट / PDF सहेजें")}</button><button type="button" onClick={() => { try { setSaved(JSON.parse(localStorage.getItem("papa-vastu-properties-v1") ?? "[]")); } catch { setSaved([]); } }} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-cream">{words("Show saved properties", "सहेजी संपत्तियाँ दिखाएँ")}</button>{saved.length > 0 && <label className="min-w-48 flex-1 text-sm text-cream">{words("Load saved property", "सहेजी संपत्ति खोलें")}<select className={`${control} mt-2`} defaultValue="" onChange={(e) => { const item = saved[Number(e.target.value)]; if (item) { setInput(item.input); setPropertyName(item.name); } }}><option value="">{words("Choose…", "चुनें…")}</option>{saved.map((item, i) => <option key={`${item.name}-${item.savedAt}`} value={i}>{item.name}</option>)}</select></label>}</section>

      {!chart && <section className="rounded-2xl border border-gold/30 bg-gold/5 p-5 text-center">
        <h2 className="text-lg font-bold text-cream">{words("Want to see this alongside your Kundli?", "इसे अपनी कुंडली के साथ देखना चाहते हैं?")}</h2><p className="mt-1 text-sm text-muted">{words("Generate or open your chart to add D1, D4, Moon, house-lord, strength, and dasha context.", "D1, D4, चंद्र, भावेश, ग्रह बल और दशा संदर्भ जोड़ने के लिए अपनी कुंडली बनाएँ या खोलें।")}</p>
        <Link href="/kundali?tab=vastu" className="mt-4 inline-flex rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-on-gold hover:bg-gold-bright">{words("Open Kundli", "कुंडली खोलें")}</Link>
      </section>}

      {saved.length > 0 && <section className="card-edge rounded-2xl p-5"><h2 className="text-lg font-bold text-cream">{words("Compare saved layouts", "सहेजे गए नक्शों की तुलना करें")}</h2><p className="mt-1 text-sm text-muted">{words("Compare current practical and traditional finding counts with saved property assessments.", "वर्तमान व्यावहारिक और पारंपरिक सुझावों की संख्या की तुलना सहेजे गए आकलनों से करें।")}</p><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><CompareCard name={propertyName || words("Current layout", "वर्तमान नक्शा")} summary={assessment.summary} />{saved.map((item) => <CompareCard key={item.savedAt} name={item.name} summary={evaluateVastu(item.input).summary} />)}</div></section>}
      <p className="px-2 text-xs leading-relaxed text-muted">{words("This is an educational assessment, not an architectural inspection. Traditional recommendations differ by text and region. Follow local building codes and consult qualified professionals before structural, electrical, or plumbing changes.", "यह शैक्षिक आकलन है, वास्तु निरीक्षण नहीं। पारंपरिक सुझाव ग्रंथ और क्षेत्र के अनुसार बदलते हैं। संरचना, बिजली या पाइपलाइन में बदलाव से पहले स्थानीय भवन नियमों का पालन करें और योग्य विशेषज्ञ से सलाह लें।")}</p>
      <details className="card-edge rounded-2xl p-5">
        <summary className="cursor-pointer font-semibold text-cream">{words("Sources and method", "स्रोत और पद्धति")}</summary>
        <div className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
          <p>{words("Direction-deity labels summarize mappings found in historical and educational overviews; the room placements in the calculator are common contemporary recommendations and may not come from the same text or school. Classical plans also consider plot, proportion, grid, entrance position, building type, climate, and use. This page is an introduction, not a complete Vāstu consultation.", "दिशा-देवताओं के नाम ऐतिहासिक और शैक्षिक परिचयों में मिलने वाले मानचित्रों का सार हैं; कैलकुलेटर के कमरे-संबंधी सुझाव आधुनिक प्रचलन हैं और संभव है कि वे एक ही ग्रंथ या पद्धति से न हों। शास्त्रीय योजना में भूखंड, अनुपात, ग्रिड, प्रवेश-स्थान, भवन-प्रकार, जलवायु और उपयोग भी देखे जाते हैं। यह पृष्ठ परिचय है, पूर्ण वास्तु परामर्श नहीं।")}</p>
          <ul className="list-disc space-y-1 pl-5">
            <li><a className="text-gold-bright underline underline-offset-2" href="https://southasia.ucla.edu/culture/architecture/vastushastra/" target="_blank" rel="noreferrer">UCLA South Asia · Vāstuśāstra</a> — {words("historical and architectural overview", "ऐतिहासिक और स्थापत्य परिचय")}</li>
            <li><a className="text-gold-bright underline underline-offset-2" href="https://ebooks.inflibnet.ac.in/socp12/chapter/the-temple-complex/" target="_blank" rel="noreferrer">INFLIBNET · The Temple Complex</a> — {words("educational context for the maṇḍala and directional guardians in Indian sacred architecture", "भारतीय पवित्र स्थापत्य में मंडल और दिशा-रक्षकों का शैक्षिक संदर्भ")}</li>
            <li><a className="text-gold-bright underline underline-offset-2" href="https://www.cambridge.org/core/journals/journal-of-the-royal-asiatic-society/article/abs/samaranganasutradhara-themes-and-context-for-the-science-of-vastu/79BCFE6CE16B03B52A5B126EC381F6F6" target="_blank" rel="noreferrer">Cambridge · The *Samarāṅgaṇasūtradhāra*</a> — {words("scholarly context for a classical architecture treatise", "शास्त्रीय स्थापत्य ग्रंथ का अकादमिक संदर्भ")}</li>
            <li><a className="text-gold-bright underline underline-offset-2" href="https://www.who.int/publications/i/item/9789241550376" target="_blank" rel="noreferrer">WHO · Housing and Health Guidelines</a> — {words("evidence-based housing, safety, and health guidance", "आवास, सुरक्षा और स्वास्थ्य पर साक्ष्य-आधारित मार्गदर्शन")}</li>
          </ul>
          <p>{words("The Kundli layer uses this app’s D1 4th house and lord, Moon, D4 Chaturthāṁśa, relevant house lords and occupants, Shadbala, Sarvashtakavarga, current Vimshottari periods, and major transits. It adds reflective personal context; it does not change the property assessment.", "कुंडली वाला भाग ऐप के D1 चतुर्थ भाव और भावेश, चंद्र, D4 चतुर्थांश, संबंधित भावेश और ग्रह, षड्बल, सर्वाष्टकवर्ग, वर्तमान विंशोत्तरी दशा और प्रमुख गोचर का उपयोग करता है। यह व्यक्तिगत चिंतन का संदर्भ जोड़ता है; संपत्ति का वास्तु आकलन नहीं बदलता।")}</p>
        </div>
      </details>
    </div>
  );
}

const control = "w-full rounded-xl border border-border bg-ink-deep px-3 py-3 text-sm text-cream outline-none focus:border-gold";
function TheoryCard({ index, title, body }: { index: string; title: string; body: string }) {
  return <article className="rounded-2xl border border-border/80 bg-ink-deep/45 p-4"><span className="font-tabular text-xs font-bold tracking-widest text-gold-bright">{index} / THEORY</span><h3 className="mt-2 font-bold text-cream">{title}</h3><p className="mt-2 text-xs leading-relaxed text-muted">{body}</p></article>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-medium text-cream">{label}<span className="mt-1.5 block">{children}</span></label>; }
function Choice({ label, value, values, onChange }: { label: string; value: string; values: [string, string][]; onChange: (value: string) => void }) {
  return <Field label={label}><select value={value} onChange={(e) => onChange(e.target.value)} className={control}>{values.map(([v, label]) => <option value={v} key={v}>{label}</option>)}</select></Field>;
}
function Count({ value, label, tone }: { value: number; label: string; tone: "rose" | "gold" | "muted" }) {
  const color = tone === "rose" ? "text-rose" : tone === "gold" ? "text-gold-bright" : "text-muted";
  return <span className={`rounded-full border border-border px-3 py-1.5 ${color}`}><strong>{value}</strong> {label}</span>;
}
function CompareCard({ name, summary }: { name: string; summary: { priority: number; consider: number; notes: number } }) {
  return <article className="rounded-xl border border-border p-3"><h3 className="truncate font-semibold text-cream">{name}</h3><div className="mt-2 flex flex-wrap gap-2 text-xs text-muted"><span>Priority {summary.priority}</span><span>Consider {summary.consider}</span><span>Notes {summary.notes}</span></div></article>;
}
