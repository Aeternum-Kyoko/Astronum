"use client";
import { useAnalysis } from "./kundli/AnalysisContext";
import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import type { KundaliChart } from "@/lib/astrology/types";
import type { AnnualReading } from "@/lib/astrology/annualReading";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { pick } from "@/lib/i18n/ui";
import { term } from "@/lib/i18n/terms";
import KundliChart from "./KundliChart";

export default function AnnualReadingPanel({ chart, active = true }: { chart: KundaliChart; active?: boolean }) {
  const locale = useLocale(); const L = pick(locale); const n = (v: string) => term(locale, v);
  const analysis = useAnalysis();
  const [ownYear, setOwnYear] = useState(Math.max(Number(chart.input.date.slice(0, 4)), Math.min(2100, DateTime.now().setZone(chart.input.timezone).year)));
  const [ownReadingDate, setOwnReadingDate] = useState("");
  const year = analysis ? Number(analysis.date.slice(0, 4)) : ownYear;
  const readingDate = analysis?.date ?? ownReadingDate;
  const setYear = (year: number) => analysis ? analysis.update({ date: DateTime.fromISO(analysis.date).set({ year }).toISODate()! }) : setOwnYear(year);
  const setReadingDate = (date: string) => analysis ? date && analysis.update({ date }) : setOwnReadingDate(date);
  const [data, setData] = useState<AnnualReading | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const analysisAt = analysis?.at;
  useEffect(() => {
    if (!active) return;
    const controller = new AbortController(); let live = true;
    async function load() {
      setLoading(true); setError(null);
      try {
        const at = analysisAt ? analysisAt.toISOString() : readingDate ? DateTime.fromISO(`${readingDate}T12:00:00`, { zone: chart.input.timezone }).toISO() : undefined;
        const res = await fetch("/api/kundali/annual", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ birth: chart.input, year, ...(at ? { at } : {}) }), signal: controller.signal });
        const json = await res.json(); if (!res.ok) throw new Error(json.error);
        if (live) setData(json);
      } catch (e) { if (live) { setData(null); setError(e instanceof Error ? e.message : "Could not load annual reading."); } }
      finally { if (live) setLoading(false); }
    }
    void load(); return () => { live = false; controller.abort(); };
  }, [chart, year, readingDate, analysisAt, active]);
  const date = (v: Date | string) => new Date(v).toLocaleString(locale === "hi" ? "hi-IN" : "en-GB", { timeZone: chart.input.timezone, year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return <div className="space-y-6">
    <header><p className="text-xs font-semibold uppercase tracking-widest text-gold-bright">{L("Natal · Annual · Timing", "जन्म · वर्ष · समय")}</p><h2 className="mt-2 text-3xl font-bold text-cream">{L("Your annual reading", "आपकी वार्षिक व्याख्या")}</h2><p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">{L("Compare the sidereal solar-return chart with your natal foundations, natal Vimshottari and transits. The annual year runs from one solar return to the next, not January to December.", "सौर वापसी की कुंडली को जन्म आधार, जन्म विंशोत्तरी और गोचर से साथ पढ़ें। वार्षिक अवधि एक सौर वापसी से अगली तक है, जनवरी से दिसंबर तक नहीं।")}</p></header>
    <div className="flex flex-wrap gap-4 rounded-2xl border border-border p-4"><label className="text-sm text-cream">{L("Solar-return year", "सौर वापसी का वर्ष")}<select className="input mt-2" value={year} onChange={e => { setYear(Number(e.target.value)); setReadingDate(""); }}>{Array.from({ length: 2101 - Math.max(1900, Number(chart.input.date.slice(0, 4))) }, (_, i) => Math.max(1900, Number(chart.input.date.slice(0, 4))) + i).map(y => <option key={y} value={y}>{y}</option>)}</select></label><label className="text-sm text-cream">{L("Timing snapshot", "समय-संदर्भ (वैकल्पिक)")}<input type="date" className="input mt-2" value={readingDate} onInput={e => setReadingDate(e.currentTarget.value)} /><span className="mt-1 block text-xs text-muted">{L("Uses the workspace analysis date and time when opened from Kundli; otherwise an empty date uses the exact return.", "तिथि न हो तो वापसी का समय; तिथि चुनने पर जन्म स्थान का दोपहर।")}</span></label></div>
    {loading && <p role="status" className="text-sm text-muted">{L("Calculating annual chart and timing…", "वार्षिक कुंडली और समय की गणना…")}</p>}
    {error && <p role="alert" className="rounded-xl border border-rose/30 p-4 text-sm text-rose">{error}</p>}
    <details className="rounded-xl border border-border p-4"><summary className="cursor-pointer text-sm font-semibold text-cream">{L("How the annual comparison is formed", "वार्षिक तुलना कैसे बनती है")}</summary><p className="mt-3 text-xs leading-relaxed text-muted">{L("Each life area compares its natal D1 lord with its annual D1 lord. Supporting checks: exaltation, own sign, moolatrikona or Shadbala meeting the planet’s requirement. Demanding checks: combustion, debilitation or Shadbala below the requirement. Both together are mixed; neither is unmarked. Agreement can therefore mean shared difficulty as well as shared support. Divisional context, natal dashas and slow transits are shown alongside this comparison and are not counted as independent votes.", "हर विषय का जन्म D1 भावेश और वर्ष D1 भावेश तुलना में हैं। सहायक: उच्च, स्वगृही, मूलत्रिकोण या षड्बल मानक पूरा। कठिन: अस्त, नीच या षड्बल कम। दोनों साथ मिश्रित; दोनों न हों तो बिना चिह्न। इसलिए सहमति साझा कठिनाई भी हो सकती है। वर्ग, जन्म दशा और धीमे गोचर साथ दिए हैं; अलग-अलग मत नहीं गिने जाते।")}</p></details>
    {data && !loading && <>
      <section className="rounded-2xl border border-gold/25 p-5"><p className="font-semibold text-cream">{date(data.annual.returnMoment)} – {date(data.end)}</p><p className="mt-2 text-sm text-muted">{L("Muntha", "मुन्था")}: {n(data.annual.muntha.sign)} · {L("annual house", "वर्ष भाव")} {data.annual.muntha.house} · {L("lord", "स्वामी")} {n(data.annual.muntha.lord)}</p><p className="mt-2 text-xs text-muted">{L("Chart location", "कुंडली स्थान")}: {chart.input.place} · {chart.input.timezone}. {L("Uses Lahiri sidereal solar return and the birth location. Relocation, Tajik yogas and Mudda Dasha are not part of this comparison.", "लाहिड़ी निरयन सौर वापसी और जन्म स्थान। स्थान परिवर्तन, ताजिक योग और मुद्दा दशा इस तुलना में शामिल नहीं।")}</p></section>
      <div className="grid gap-5 lg:grid-cols-2">{[{ title: L("Natal D1", "जन्म D1"), c: chart }, { title: L("Annual D1", "वर्ष D1"), c: data.annual.chart }].map(({ title, c }) => <section key={title} className="rounded-2xl border border-border p-4"><h3 className="mb-3 font-semibold text-cream">{title}</h3><KundliChart ascendantSignIndex={c.ascendant.signIndex} planets={c.planets} toggleId={`annual-${title}`} /></section>)}</div>
      <section className="rounded-2xl border border-border p-5"><h3 className="font-semibold text-cream">{L("Natal Vimshottari at snapshot", "संदर्भ समय की जन्म विंशोत्तरी")}</h3><p className="mt-2 text-sm text-muted">{date(data.at)} · {data.chain.length ? data.chain.map(p => n(p.lord)).join(" / ") : L("Outside available dasha coverage", "उपलब्ध दशा अवधि के बाहर")}</p><details className="mt-4"><summary className="cursor-pointer text-sm text-gold-bright">{L("Antardashas overlapping this annual year", "इस वर्ष से जुड़ी अंतर्दशाएँ")}</summary><ul className="mt-3 space-y-2 text-xs text-muted">{data.periods.map(p => <li key={String(p.start)}>{n(p.maha)}–{n(p.lord)} · {date(p.start)} – {date(p.end)}</li>)}</ul></details></section>
      <div className="grid gap-4 lg:grid-cols-2">{data.areas.map(area => <article key={area.key} className="rounded-2xl border border-border bg-surface/40 p-5"><h3 className="text-lg font-semibold text-cream">{({ career: L("Career", "करियर"), relationships: L("Relationships", "संबंध"), wealth: L("Wealth", "धन"), home: L("Home", "घर"), education: L("Education", "शिक्षा") })[area.key]}</h3><p className="mt-2 text-sm text-gold-bright">{area.comparison === "agreement" ? L("Natal and annual lord-condition checks agree.", "जन्म और वर्ष भावेश की स्थिति के संकेत मिलते हैं।") : area.comparison === "different" ? L("Natal and annual lord-condition checks differ.", "जन्म और वर्ष भावेश की स्थिति अलग है।") : area.comparison === "mixed" ? L("Supporting and demanding conditions coexist.", "सहायक और कठिन स्थितियाँ साथ हैं।") : L("These checks do not establish a clear agreement.", "इन जाँचों से स्पष्ट सहमति नहीं बनती।")}</p><dl className="mt-3 space-y-3 text-sm text-muted">{[{ label: L("Natal foundation", "जन्म आधार"), c: area.natal }, { label: L("Annual emphasis", "वर्ष संकेत"), c: area.annual }].map(({ label, c }) => <div key={label}><dt className="font-semibold text-cream">{label} · {L("house", "भाव")} {area.house}</dt><dd>{n(c.lord.lord)} · {n(c.planet.sign)} · {L("house", "भाव")} {c.planet.house}{c.planet.dignity ? ` · ${n(c.planet.dignity)}` : ""}{c.combust ? L(" · Combust", " · अस्त") : ""}{c.strength ? ` · ${L("Shadbala", "षड्बल")} ${c.strength.rupas.toFixed(2)}/${c.strength.requiredRupas}` : ""}</dd></div>)}<div><dt className="font-semibold text-cream">{L("Natal divisional context", "जन्म वर्ग संदर्भ")}</dt><dd>{area.natal.vargas.map(v => `${v.key}: ${n(v.placement.sign)}, ${L("house", "भाव")} ${v.placement.house}${v.dignity ? ` · ${n(v.dignity)}` : ""}`).join(" / ")}</dd></div><div><dt className="font-semibold text-cream">{L("Natal dasha links", "जन्म दशा संबंध")}</dt><dd>{area.activation.map(p => n(p.lord)).join(" / ") || L("No direct lord, occupant or full-aspect link at this snapshot.", "इस समय भावेश, ग्रह या पूर्ण दृष्टि का सीधा संबंध नहीं।")}</dd></div><div><dt className="font-semibold text-cream">{L("Slow transits touching natal house", "जन्म भाव से जुड़े धीमे गोचर")}</dt><dd>{area.slowTransits.map(t => `${n(t.planet)} · ${n(t.sign)} · ${t.gochara.blockers.length ? L("Vedha: ", "वेध: ") + t.gochara.blockers.map(n).join(", ") : t.gochara.favourable ? L("supporting Moon-house transit", "चंद्र से सहायक गोचर") : L("demanding Moon-house transit", "चंद्र से कठिन गोचर")}`).join(" / ") || L("No Jupiter/Saturn placement or full-aspect link at this snapshot.", "इस समय गुरु/शनि की स्थिति या पूर्ण दृष्टि का संबंध नहीं।")}</dd></div></dl></article>)}</div>
      <p className="text-xs leading-relaxed text-muted">{L("Agreement describes these specific rule checks, not an event probability. A snapshot does not describe every day of the year. Birth-time uncertainty affects annual houses and natal divisional ascendants.", "सहमति इन विशेष नियमों की है, घटना का प्रतिशत नहीं। एक समय-संदर्भ पूरे वर्ष का वर्णन नहीं करता। जन्म-समय की अनिश्चितता वर्ष भावों और जन्म वर्ग लग्न को प्रभावित करती है।")}</p>
    </>}
  </div>;
}
