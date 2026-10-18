"use client";

import { useState } from "react";
import type { KundaliChart } from "@/lib/astrology/types";
import { periodsAt } from "@/lib/astrology/dashaTree";
import { observationsKey, observationsSchema, observationSchema, type ReadingObservation } from "@/lib/readingObservations";
import { useDeviceStore } from "@/lib/useDeviceStore";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { pick } from "@/lib/i18n/ui";
import { term } from "@/lib/i18n/terms";
import { useAnalysis } from "./AnalysisContext";

const TOPICS = [
  ["general", "Life", "जीवन"],
  ["career", "Work", "काम"],
  ["relationships", "Relationships", "संबंध"],
  ["wealth", "Money", "धन"],
  ["health", "Wellbeing", "स्वास्थ्य"],
] as const;

export default function ReadingObservations({ chart, id }: { chart: KundaliChart; id?: string }) {
  const a = useAnalysis()!;
  const locale = useLocale();
  const L = pick(locale);
  const [stored, save] = useDeviceStore<ReadingObservation[]>(observationsKey(chart.input), []);
  const entries = observationsSchema.safeParse(stored);
  const observations = entries.success ? entries.data : [];
  const [topic, setTopic] = useState<ReadingObservation["topic"]>("general");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const sameDay = observations.filter(entry => entry.date === a.date);
  const recent = [...observations].sort((left, right) => `${right.date}T${right.time}`.localeCompare(`${left.date}T${left.time}`)).slice(0, 4);

  function add(event: React.FormEvent) {
    event.preventDefault();
    const period = periodsAt(chart.dashas, a.at, 3).map(item => item.lord).join(" › ");
    const sky = a.transits.filter(item => ["Jupiter", "Saturn", "Rahu"].includes(item.planet)).map(item => `${item.planet} ${item.sign} · H${item.houseFromLagna}`);
    const parsed = observationSchema.safeParse({ id: crypto.randomUUID(), date: a.date, time: a.time, topic, note, period, sky });
    if (!parsed.success) { setMessage(L("Write a short observation before saving.", "सहेजने से पहले एक छोटा अनुभव लिखें।")); return; }
    const saved = save([...observations, parsed.data].slice(-30));
    setNote("");
    setMessage(saved ? L("Saved on this device with the selected chart date.", "चुनी कुंडली तिथि के साथ इस उपकरण पर सहेजा गया।") : L("Device storage is unavailable; this entry will last only for this session.", "उपकरण संग्रह उपलब्ध नहीं; यह प्रविष्टि केवल इस सत्र में रहेगी।"));
  }

  return <section id={id} className="reading-observations" data-no-swipe>
    <header><div><h2>{L("Your chart journal", "आपकी कुंडली डायरी")}</h2><p>{L("Record what actually happened, then revisit the chart for that day. Notes stay on this device.", "जो वास्तव में हुआ उसे लिखें, फिर उस दिन की कुंडली देखें। नोट इस उपकरण पर रहते हैं।")}</p></div><span>{a.date}</span></header>
    <form onSubmit={add}>
      <fieldset><legend>{L("What area was this about?", "यह किस विषय में था?")}</legend><div className="observation-topics">{TOPICS.map(([value, en, hi]) => <button type="button" key={value} aria-pressed={topic === value} onClick={() => setTopic(value)}>{L(en, hi)}</button>)}</div></fieldset>
      <label htmlFor="reading-observation-note">{L("What happened or changed?", "क्या हुआ या बदला?")}</label>
      <textarea id="reading-observation-note" maxLength={500} value={note} onChange={event => setNote(event.target.value)} placeholder={L("A concrete event, feeling, or decision…", "कोई ठोस घटना, अनुभव या निर्णय…")} />
      <div className="observation-actions"><small>{L("Saves the current dasha and Jupiter, Saturn, Rahu positions as context.", "संदर्भ के लिए वर्तमान दशा और गुरु, शनि, राहु की स्थिति भी सहेजी जाती है।")}</small><button type="submit" disabled={!note.trim()}>{L("Save observation", "अनुभव सहेजें")}</button></div>
    </form>
    {message && <p role="status" className="observation-status">{message}</p>}
    {recent.length > 0 && <div className="observation-history"><h3>{sameDay.length ? L("On this date", "इस तिथि पर") : L("Recent observations", "हाल के अनुभव")}</h3><ul>{(sameDay.length ? [...sameDay].reverse().slice(0, 4) : recent).map(entry => <li key={entry.id}><div><button type="button" onClick={() => a.update({ date: entry.date, time: entry.time })}>{entry.date} · {entry.time}</button><span>{L(TOPICS.find(item => item[0] === entry.topic)?.[1] ?? "Life", TOPICS.find(item => item[0] === entry.topic)?.[2] ?? "जीवन")}</span></div><p>{entry.note}</p><small>{L("Period", "दशा")}: {entry.period.split(" › ").map(termPart => term(locale, termPart)).join(" › ") || "—"} · {entry.sky.join(" / ")}</small><button type="button" className="observation-remove" onClick={() => save(observations.filter(item => item.id !== entry.id))}>{L("Remove", "हटाएँ")}</button></li>)}</ul></div>}
  </section>;
}
