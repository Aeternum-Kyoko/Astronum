"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { KundaliChart } from "@/lib/astrology/types";
import { evaluateVastu, personalizeVastu } from "@/lib/vastu/evaluate";
import { VASTU_ROOMS, VASTU_ZONES, type PropertyType, type VastuAssessmentInput, type VastuRoom, type VastuZone } from "@/lib/vastu/types";
import type { Locale } from "@/lib/i18n/locale";
import { term } from "@/lib/i18n/terms";

const GRID: (VastuZone | null)[][] = [["NW", "NNW", "N", "NNE", "NE"], ["WNW", null, null, null, "ENE"], ["W", null, "CENTER", null, "E"], ["WSW", null, null, null, "ESE"], ["SW", "SSW", "S", "SSE", "SE"]];
const ZONE_HI: Record<VastuZone, string> = { N: "उत्तर", NNE: "उत्तर-उत्तर-पूर्व", NE: "उत्तर-पूर्व", ENE: "पूर्व-उत्तर-पूर्व", E: "पूर्व", ESE: "पूर्व-दक्षिण-पूर्व", SE: "दक्षिण-पूर्व", SSE: "दक्षिण-दक्षिण-पूर्व", S: "दक्षिण", SSW: "दक्षिण-दक्षिण-पश्चिम", SW: "दक्षिण-पश्चिम", WSW: "पश्चिम-दक्षिण-पश्चिम", W: "पश्चिम", WNW: "पश्चिम-उत्तर-पश्चिम", NW: "उत्तर-पश्चिम", NNW: "उत्तर-उत्तर-पश्चिम", CENTER: "केंद्र" };
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
  const [saved, setSaved] = useState<{ name: string; input: VastuAssessmentInput; savedAt: string }[]>([]);
  const assessment = useMemo(() => evaluateVastu(input), [input]);
  const personal = useMemo(() => chart ? personalizeVastu(chart, transits, locale) : null, [chart, transits, locale]);
  const words = (en: string, hindi: string) => hi ? hindi : en;
  const set = <K extends keyof VastuAssessmentInput>(key: K, value: VastuAssessmentInput[K]) => setInput((old) => ({ ...old, [key]: value }));
  const zoneName = (zone: VastuZone) => hi ? ZONE_HI[zone] : zone === "CENTER" ? "Centre" : zone;
  const roomName = (room: VastuRoom) => ROOM_LABEL[room][hi ? 1 : 0];
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
          <p>{words("Room directions in this first version are presented as common contemporary Vāstu conventions. Historical Vāstu texts cover architecture and planning, but rules vary by source and are not treated here as one universal code.", "इस शुरुआती संस्करण में कमरों की दिशाएँ प्रचलित आधुनिक वास्तु परंपराओं के रूप में दी गई हैं। ऐतिहासिक वास्तु ग्रंथ स्थापत्य और योजना पर चर्चा करते हैं, लेकिन स्रोतों के नियम भिन्न हैं; इन्हें एक सार्वभौमिक नियम नहीं माना गया है।")}</p>
          <ul className="list-disc space-y-1 pl-5">
            <li><a className="text-gold-bright underline underline-offset-2" href="https://southasia.ucla.edu/culture/architecture/vastushastra/" target="_blank" rel="noreferrer">UCLA South Asia · Vāstuśāstra</a> — {words("historical and architectural overview", "ऐतिहासिक और स्थापत्य परिचय")}</li>
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
