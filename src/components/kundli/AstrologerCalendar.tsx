"use client";

import { useMemo, useState } from "react";
import { DateTime } from "luxon";
import type { KundaliChart } from "@/lib/astrology/types";
import type { KundaliReport } from "@/lib/astrology/report";
import { EVENT_DEFS } from "@/lib/astrology/lifeEvents";
import { calendarSignals } from "@/lib/astrology/astrologerCalendar";
import { ruleSupport } from "@/lib/astrology/ruleSupport";
import { observationsKey, observationsSchema, type ReadingObservation } from "@/lib/readingObservations";
import { useDeviceStore } from "@/lib/useDeviceStore";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { pick } from "@/lib/i18n/ui";
import { term } from "@/lib/i18n/terms";
import type { EventTheme } from "@/lib/astrology/lifeTimeline";
import type { VargaKey } from "@/lib/astrology/constants";
import BirthReliabilityBadge from "./BirthReliabilityBadge";
import ReadingObservations from "./ReadingObservations";
import { useAnalysis } from "./AnalysisContext";

const THEMES: { key: EventTheme | "all"; label: [string, string] }[] = [
  { key: "all", label: ["All themes", "सभी विषय"] },
  { key: "career", label: ["Career", "करियर"] },
  { key: "marriage", label: ["Relationships", "संबंध"] },
  { key: "wealth", label: ["Resources", "संसाधन"] },
  { key: "property", label: ["Home", "घर"] },
  { key: "education", label: ["Study", "शिक्षा"] },
  { key: "health", label: ["Wellbeing", "स्वास्थ्य"] },
];

const THEME_TAB: Partial<Record<EventTheme, string>> = {
  career: "career", jobChange: "career", recognition: "career",
  marriage: "relationships", romance: "relationships", wealth: "wealth", loss: "wealth",
  education: "education", property: "property", relocation: "property",
};

export default function AstrologerCalendar({ chart, report, go }: { chart: KundaliChart; report: KundaliReport | null; go: (slug: string) => void }) {
  const a = useAnalysis()!;
  const locale = useLocale();
  const L = pick(locale);
  const n = (value: string) => term(locale, value);
  const [theme, setTheme] = useState<EventTheme | "all">("all");
  const [horizon, setHorizon] = useState<12 | 24>(24);
  const [stored] = useDeviceStore<ReadingObservation[]>(observationsKey(chart.input), []);
  const parsed = observationsSchema.safeParse(stored);
  const observations = parsed.success ? parsed.data : [];
  const timeline = report?.timeline;
  const signals = useMemo(() => timeline ? calendarSignals(timeline, a.at, horizon, theme) : [], [timeline, a.at, horizon, theme]);
  const byMonth = useMemo(() => {
    const months = new Map<string, typeof signals>();
    for (const signal of signals) {
      const month = DateTime.fromJSDate(signal.date).setZone(a.zone).toFormat("yyyy-MM");
      months.set(month, [...(months.get(month) ?? []), signal]);
    }
    return [...months.entries()].map(([month, items]) => ({ month, items: [...items].sort((left, right) => right.event.confidence - left.event.confidence || right.agreeingLayers.length - left.agreeingLayers.length).slice(0, 4) }));
  }, [signals, a.zone]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const activeMonth = selectedMonth ?? byMonth[0]?.month ?? a.date.slice(0, 7);
  const monthNotes = observations.filter(item => item.date.startsWith(activeMonth)).sort((left, right) => right.date.localeCompare(left.date)).slice(0, 5);
  const dateLabel = (date: Date | string) => DateTime.fromJSDate(new Date(date)).setZone(a.zone).toLocaleString({ day: "numeric", month: "short", year: "numeric" }, { locale: locale === "hi" ? "hi" : "en" });
  const monthLabel = (month: string) => DateTime.fromISO(`${month}-01`, { zone: a.zone }).toLocaleString({ month: "long", year: "numeric" }, { locale: locale === "hi" ? "hi" : "en" });
  const openDate = (date: Date) => { a.update({ date: DateTime.fromJSDate(date).setZone(a.zone).toISODate()! }); go("transits"); };

  return <div className="astrologer-calendar">
    <header className="calendar-intro"><div><h2>{L("Signal calendar", "संकेत कैलेंडर")}</h2><p>{L("Candidate windows from the existing event engine, arranged by month and ranked by agreement among the rules it checked. These are investigation leads, not event probabilities.", "मौजूदा घटना इंजन की संभावित अवधियाँ, महीनेवार और जाँचे गए नियमों के मेल से क्रमित। ये जाँच के संकेत हैं, घटना की संभावनाएँ नहीं।")}</p></div><span>{L("Starting", "आरंभ")} {dateLabel(a.at)}</span></header>
    <div className="calendar-controls"><div role="group" aria-label={L("Calendar horizon", "कैलेंडर अवधि")}>{([12, 24] as const).map(value => <button type="button" key={value} aria-pressed={horizon === value} onClick={() => setHorizon(value)}>{value} {L("months", "महीने")}</button>)}</div><div className="calendar-theme-rail" role="group" aria-label={L("Filter calendar theme", "कैलेंडर विषय चुनें")}>{THEMES.map(item => <button type="button" key={item.key} aria-pressed={theme === item.key} onClick={() => { setTheme(item.key); setSelectedMonth(null); }}>{L(...item.label)}</button>)}</div></div>
    {!report?.timeline ? <p className="calendar-empty">{L("Preparing the detailed timeline…", "विस्तृत समयरेखा तैयार हो रही है…")}</p> : byMonth.length === 0 ? <p className="calendar-empty">{L("No candidate windows from these checks in the selected range. Try a wider range or another theme.", "चुनी अवधि में इन जाँचों से कोई समय-संकेत नहीं मिला। अवधि बढ़ाएँ या दूसरा विषय चुनें।")}</p> : <div className="calendar-grid"><div className="calendar-months">{byMonth.map(group => <section key={group.month} className="calendar-month"><div className="calendar-month-head"><h3>{monthLabel(group.month)}</h3><button type="button" aria-pressed={activeMonth === group.month} onClick={() => setSelectedMonth(group.month)}>{observations.filter(item => item.date.startsWith(group.month)).length} {L("observations", "अनुभव")}</button></div><ol>{group.items.map((signal, index) => {
      const definition = EVENT_DEFS[signal.event.kind];
      const primaryHouse = definition.houses[0];
      const lord = chart.houseLords.find(item => item.house === primaryHouse)?.lord;
      const natal = chart.planets.find(item => item.planet === lord);
      const varga = definition.varga?.key as VargaKey | undefined;
      return <li key={signal.key} className="calendar-signal"><div className="calendar-signal-top"><span>{index + 1}</span><div><h4>{signal.event.label}</h4><p>{dateLabel(signal.date)} · {n(signal.maha)} › {n(signal.antar)}</p></div><strong>{ruleSupport(signal.event.confidence, locale)}</strong></div><div className="calendar-signal-facts"><p><b>{L("Natal anchor", "जन्म आधार")}</b> {L("House", "भाव")} {primaryHouse}{lord && natal ? ` · ${n(lord)} ${n(natal.sign)} / ${L("house", "भाव")} ${natal.house}` : ""}</p><p><b>{L("Transit support in window", "अवधि में गोचर सहारा")}</b> {signal.transitReason ?? L("No supporting transit layer in this candidate", "इस संकेत में सहायक गोचर स्तर नहीं")}</p><p><b>{L("Counterpoint", "विरोधी संकेत")}</b> {signal.counterpoint ?? L("None flagged by these rules", "इन नियमों में नहीं मिला")}</p></div>{varga && <BirthReliabilityBadge chart={chart} varga={varga} go={go} />}<details><summary>{signal.agreeingLayers.length} {L("agreeing layers · inspect evidence", "सहायक स्तर · प्रमाण देखें")}</summary><ul>{signal.event.evidence.map((item, evidenceIndex) => <li key={evidenceIndex}><b>{item.layer}</b> {item.text}</li>)}</ul></details><div className="calendar-signal-actions"><button type="button" onClick={() => openDate(signal.date)}>{L("Open date in transits", "तिथि के गोचर देखें")}</button><button type="button" onClick={() => go(THEME_TAB[signal.event.kind] ?? "timeline")}>{L("Read natal factors", "जन्म संकेत पढ़ें")}</button></div></li>;
    })}</ol></section>)}</div><aside className="calendar-observation-ledger"><h3>{L("Observation ledger", "अनुभव विवरण")}</h3><p>{monthLabel(activeMonth)} · {L("Saved on this device", "इस उपकरण पर सहेजे गए")}</p>{monthNotes.length ? <ul>{monthNotes.map(item => <li key={item.id}><button type="button" onClick={() => { a.update({ date: item.date, time: item.time }); document.getElementById("calendar-observations")?.scrollIntoView({ behavior: "smooth" }); }}>{item.date} · {item.time}</button><p>{item.note}</p><small>{L("Recorded period", "दर्ज दशा")}: {item.period}</small></li>)}</ul> : <p className="calendar-ledger-empty">{L("No observation recorded for this month. Add one below after reviewing the chart.", "इस महीने का कोई अनुभव दर्ज नहीं। कुंडली देखने के बाद नीचे जोड़ें।")}</p>}</aside></div>}
    <ReadingObservations chart={chart} id="calendar-observations" />
  </div>;
}
