"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import DatePicker from "@/components/DatePicker";
import { haptic } from "@/lib/haptics";
import type { Locale } from "@/lib/i18n/locale";
import { DIGITS, loShuReport, type Gender, type LoShuReport } from "@/lib/loShu";
import { isValidBirthDate, reduceToDigit } from "@/lib/numerology";

const ELEMENT_TINT: Record<string, string> = {
  Water: "#5cc8ff",
  Earth: "#d9a55c",
  Wood: "#7fd17f",
  Metal: "#cfd6e4",
  Fire: "#ff7a6b",
};

const COPY = {
  en: {
    dob: "Date of birth",
    name: "Name (optional)",
    namePh: "As you use it",
    gender: "Gender (for Kua number)",
    skip: "Skip Kua",
    male: "Male",
    female: "Female",
    make: "Make my Lo Shu grid",
    missing: "missing",
    present: (n: number) => `${n} of 9 numbers present`,
    driver: "Driver",
    conductor: "Conductor",
    kua: "Kua",
    download: "Download image",
    copy: "Copy link",
    glance: (r: LoShuReport) => `Your grid at a glance · ${9-r.missing.length}/9 present`,
    placed: (r: LoShuReport) => `Numbers placed: ${r.placed.join(" ")} (date digits, then Driver ${r.driver}, Conductor ${r.conductor}${r.kua ? `, Kua ${r.kua}` : ""}). Personal year ${r.personalYear.year}: `,
    strengths: "Strengths",
    noStrengths: "No complete plane — your strengths come from the individual numbers below.",
    challenges: "Challenges",
    noChallenges: "No fully empty planes. Partial planes still show which numbers are absent.",
    remedies: "Most useful remedies",
    planesTitle: "The eight planes (arrows)",
    planesBody: "A complete line of three numbers is a strength; an empty one is a lesson. Two of three means the plane is developing — its missing number is the key.",
    complete: "Complete",
    empty: "Empty",
    of3: (n: number) => `${n} of 3`,
    developing: (nums: number[], strong: string) => `Developing: add the energy of ${nums.join(" and ")} to complete it — ${strong.charAt(0).toLowerCase()}${strong.slice(1)}`,
    eachTitle: "Each number in your grid",
    missingTitle: "Missing numbers and their remedies",
    kuaTitle: (r: LoShuReport) => `Kua ${r.kua} · ${r.kuaDirections!.group} — your best directions`,
    kuaBody: "Face these directions while working, sleeping or signing — the first is the strongest.",
    imgTitle: "LO SHU GRID",
    imgMissing: (r: LoShuReport) => `Missing: ${r.missing.map((m) => m.n).join(", ") || "none"}   ·   Complete planes: ${r.planes.filter((p) => p.status === "complete").length}`,
    method: "Grid method",
    indian: "Indian numerology · adds Driver and Conductor",
    dateOnly: "Birth-date digits only",
    user: "User",
    astrologer: "Astrologer",
    score: (r: LoShuReport) => `${9-r.missing.length}/9 numbers · ${r.planes.filter(p=>p.status==="complete").length} complete planes · ${r.present.filter(p=>p.count>=3).length} repeated 3+ times`,
    selectNumber: "Select a number to inspect",
    yearCycle: "Personal year cycle",
    kuaBoundary: "Kua year follows an approximate 4 February boundary; verify dates close to Li Chun.",
  },
  hi: {
    dob: "जन्म तिथि",
    name: "नाम (वैकल्पिक)",
    namePh: "जैसा आप लिखते हैं",
    gender: "लिंग (कुआ अंक के लिए)",
    skip: "कुआ छोड़ें",
    male: "पुरुष",
    female: "महिला",
    make: "मेरी लो शु ग्रिड बनाएं",
    missing: "लुप्त",
    present: (n: number) => `9 में से ${n} अंक मौजूद`,
    driver: "मूलांक",
    conductor: "भाग्यांक",
    kua: "कुआ",
    download: "चित्र डाउनलोड करें",
    copy: "लिंक कॉपी करें",
    glance: (r: LoShuReport) => `आपकी ग्रिड एक नज़र में · ${9-r.missing.length}/9 मौजूद`,
    placed: (r: LoShuReport) => `रखे गए अंक: ${r.placed.join(" ")} (जन्म तिथि के अंक, फिर मूलांक ${r.driver}, भाग्यांक ${r.conductor}${r.kua ? `, कुआ ${r.kua}` : ""})। व्यक्तिगत वर्ष ${r.personalYear.year}: `,
    strengths: "शक्तियाँ",
    noStrengths: "कोई पूर्ण तल नहीं — आपकी शक्तियाँ नीचे दिए अलग-अलग अंकों से आती हैं।",
    challenges: "चुनौतियाँ",
    noChallenges: "कोई तल पूरी तरह खाली नहीं है। आंशिक तल अभी भी लुप्त अंक दिखाते हैं।",
    remedies: "सबसे उपयोगी उपाय",
    planesTitle: "आठ तल (रेखाएँ)",
    planesBody: "तीन अंकों की पूरी रेखा शक्ति है; खाली रेखा एक सबक है। तीन में से दो का अर्थ है तल विकसित हो रहा है — उसका लुप्त अंक ही कुंजी है।",
    complete: "पूर्ण",
    empty: "खाली",
    of3: (n: number) => `3 में से ${n}`,
    developing: (nums: number[], strong: string) => `विकसित हो रहा है: इसे पूरा करने के लिए ${nums.join(" और ")} की ऊर्जा जोड़ें — ${strong}`,
    eachTitle: "आपकी ग्रिड का हर अंक",
    missingTitle: "लुप्त अंक और उनके उपाय",
    kuaTitle: (r: LoShuReport) => `कुआ ${r.kua} · ${r.kuaDirections!.group} — आपकी शुभ दिशाएँ`,
    kuaBody: "काम करते, सोते या हस्ताक्षर करते समय इन दिशाओं की ओर मुख रखें — पहली सबसे प्रबल है।",
    imgTitle: "लो शु ग्रिड",
    imgMissing: (r: LoShuReport) => `लुप्त: ${r.missing.map((m) => m.n).join(", ") || "कोई नहीं"}   ·   पूर्ण तल: ${r.planes.filter((p) => p.status === "complete").length}`,
    method: "ग्रिड विधि",
    indian: "भारतीय अंक ज्योतिष · मूलांक और भाग्यांक जोड़ें",
    dateOnly: "केवल जन्म तिथि के अंक",
    user: "उपयोगकर्ता",
    astrologer: "ज्योतिषी",
    score: (r: LoShuReport) => `${9-r.missing.length}/9 अंक · ${r.planes.filter(p=>p.status==="complete").length} पूर्ण तल · ${r.present.filter(p=>p.count>=3).length} अंक 3+ बार`,
    selectNumber: "देखने के लिए अंक चुनें",
    yearCycle: "व्यक्तिगत वर्ष चक्र",
    kuaBoundary: "कुआ वर्ष की सीमा लगभग 4 फ़रवरी है; ली चुन के आसपास की तारीख़ जाँचें।",
  },
};
type Copy = (typeof COPY)["en"];

/** Lo Shu grid maker: the grid from a birth date (plus optional name and gender), a downloadable image, and the full reading. */
export default function LoShuMaker({ locale = "en" }: { locale?: Locale }) {
  const t = COPY[locale] as Copy;
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [date, setDate] = useState(params.get("date") ?? "");
  const [name, setName] = useState(params.get("name") ?? "");
  const [gender, setGender] = useState<Gender | "">((params.get("g") as Gender | null) ?? "");
  const [method, setMethod] = useState<"indian" | "birth-date">(params.get("method") === "birth-date" ? "birth-date" : "indian");
  const [mode, setMode] = useState<"user" | "astrologer">("user");
  const [selectedNumber, setSelectedNumber] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [shown, setShown] = useState<{ date: string; name: string; gender: Gender | "" } | null>(() =>
    params.get("date") ? { date: params.get("date")!, name: params.get("name") ?? "", gender: (params.get("g") as Gender | null) ?? "" } : null
  );

  const report = useMemo(
    () => (shown && isValidBirthDate(shown.date) ? loShuReport(shown.date, { name: shown.name, gender: shown.gender || null, locale, method }) : null),
    [shown, locale, method]
  );

  useEffect(() => {
    if (report) haptic("success");
  }, [report]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidBirthDate(date)) { setError("Enter a real birth date from 1900 to today."); return; }
    setError(null);
    setShown({ date, name, gender });
    const q = new URLSearchParams({ date, method, ...(name ? { name } : {}), ...(gender ? { g: gender } : {}) });
    router.replace(`${pathname}?${q}`, { scroll: false });
  }

  return (
    <div className="space-y-8">
      <form onSubmit={submit} className="card-edge mx-auto max-w-2xl rounded-3xl p-6 md:p-7">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block md:col-span-1">
            <span className="mb-1.5 block text-xs font-semibold text-muted">{t.dob}</span>
            <DatePicker value={date} onChange={setDate} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted">{t.name}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.namePh} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-cream focus:border-gold focus:outline-none" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted">{t.gender}</span>
            <select value={gender} onChange={(e) => setGender(e.target.value as Gender | "")} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-cream focus:border-gold focus:outline-none">
              <option value="">{t.skip}</option>
              <option value="male">{t.male}</option>
              <option value="female">{t.female}</option>
            </select>
          </label>
        </div>
        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs font-semibold text-muted">{t.method}</span>
          <select value={method} onChange={(e) => setMethod(e.target.value as "indian" | "birth-date")} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-cream focus:border-gold focus:outline-none">
            <option value="indian">{t.indian}</option><option value="birth-date">{t.dateOnly}</option>
          </select>
        </label>
        <button type="submit" className="mt-5 rounded-full bg-gold px-7 py-3 text-sm font-semibold text-on-gold hover:bg-gold-bright">
          {t.make}
        </button>
        {error && <p role="alert" className="mt-3 text-sm text-rose">{error}</p>}
      </form>

      {report && <Report r={report} name={shown?.name ?? ""} t={t} mode={mode} setMode={setMode} selectedNumber={selectedNumber} setSelectedNumber={setSelectedNumber} />}
    </div>
  );
}

function Report({ r, name, t, mode, setMode, selectedNumber, setSelectedNumber }: { r: LoShuReport; name: string; t: Copy; mode: "user"|"astrologer"; setMode: (m:"user"|"astrologer")=>void; selectedNumber:number; setSelectedNumber:(n:number)=>void }) {
  const line = (n: number) => {
    const l = r.cells.flat().find((c) => c.n === n)!.label;
    return `${l.planet} · ${l.element} · ${l.direction} · ${l.area}`;
  };
  return (
    <div className="space-y-8">
      <div className="card-edge flex items-center justify-between gap-4 rounded-2xl p-4">
        <div><p className="font-semibold text-cream">{mode === "user" ? t.user : t.astrologer} view</p><p className="text-xs text-muted">{t.score(r)}</p></div>
        <div className="flex rounded-full border border-border p-1"><button type="button" onClick={()=>setMode("user")} aria-pressed={mode==="user"} className={`rounded-full px-4 py-2 text-sm ${mode==="user"?"bg-gold text-on-gold":"text-muted"}`}>{t.user}</button><button type="button" onClick={()=>setMode("astrologer")} aria-pressed={mode==="astrologer"} className={`rounded-full px-4 py-2 text-sm ${mode==="astrologer"?"bg-gold text-on-gold":"text-muted"}`}>{t.astrologer}</button></div>
      </div>
      <section className="grid gap-6 lg:grid-cols-[auto_1fr] lg:items-start" aria-label="Your Lo Shu grid">
        <div className="card-edge rounded-3xl p-5">
          <div className="grid grid-cols-3 gap-2" role="table" aria-label="Lo Shu grid">
            {r.cells.flat().map((c) => (
              <div role="cell" key={c.n}>
              <button
                onClick={()=>setSelectedNumber(c.n)}
                aria-label={`Number ${c.n}, ${c.count} present`}
                aria-pressed={selectedNumber===c.n}
                className={`flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-2xl border px-1 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold sm:h-28 sm:w-28 ${selectedNumber===c.n?"ring-2 ring-gold":""} ${c.count ? "border-gold/50 bg-gold/10" : "border-dashed border-border/70"}`}
              >
                <span className={`font-display leading-none ${c.count ? "text-gold-bright" : "text-border"} ${c.count > 3 ? "text-xl" : "text-3xl"}`}>{c.count ? String(c.n).repeat(c.count) : c.n}</span>
                <span className="mt-1 text-[10px] leading-tight text-muted">
                  {c.label.planet} · {c.label.direction.split(" (")[0]}
                </span>
                {!c.count && <span className="text-[10px] text-rose">{t.missing}</span>}
              </button></div>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-muted">
            {t.driver} {r.driver} · {t.conductor} {r.conductor}
            {r.kua ? ` · ${t.kua} ${r.kua}` : ""} · {t.present(9 - r.missing.length)}
          </p>
          <p className="mt-2 max-w-sm text-center text-[11px] text-muted">{t.method}: {r.method === "indian" ? t.indian : t.dateOnly}. Kua: {r.kua ? `${r.kua} (${r.method === "indian" ? "added as a separate count" : "calculated but not added to the grid"})` : "not included"}.</p>
          <div className="mt-3 flex justify-center gap-2">
            <button type="button" onClick={() => downloadGrid(r, name, t)} className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-cream hover:border-gold">
              {t.download}
            </button>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(window.location.href);
                haptic("success");
              }}
              className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-cream hover:border-gold"
            >
              {t.copy}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card-edge rounded-3xl p-6">
            <p className="text-sm font-semibold text-gold-bright">{t.glance(r)}</p>
            <p className="mt-2 text-sm leading-relaxed text-cream">{r.driverConductor}</p>
            <p className="mt-2 text-sm text-muted">
              {t.placed(r)}
              <b className="text-cream">{r.personalYear.number}</b> — {r.personalYear.keywords}.
            </p>
            {r.name && <p className="mt-2 text-sm text-cream">{r.name.text}</p>}
            <div className="mt-4 rounded-xl border border-border/70 p-4"><p className="text-xs text-muted">{t.selectNumber}</p><p className="mt-1 font-display text-3xl text-gold-bright">{selectedNumber} · {r.cells.flat().find(c=>c.n===selectedNumber)?.label.planet}</p><p className="mt-1 text-sm text-cream">{r.cells.flat().find(c=>c.n===selectedNumber)?.meaning ?? r.missing.find(m=>m.n===selectedNumber)?.meaning}</p><p className="mt-1 text-xs text-muted">{line(selectedNumber)}{mode==="astrologer"?` · Count ${r.counts[selectedNumber]} · date contributes ${r.placed.filter(n=>n===selectedNumber).length}`:""}</p></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <List title={t.strengths} tone="gold" items={r.strengths.length ? r.strengths : [t.noStrengths]} />
            <List title={t.challenges} tone="rose" items={r.challenges.length ? r.challenges : [t.noChallenges]} />
          </div>
          {r.topRemedies.length > 0 && <List title={t.remedies} tone="gold" items={r.topRemedies} />}
        </div>
      </section>

      <section aria-label="Planes">
        <h3 className="text-xl font-bold tracking-tight text-cream">{t.planesTitle}</h3>
        <p className="mt-1 text-sm text-muted">{t.planesBody}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {r.planes.map((p) => (
            <button type="button" onClick={()=>setSelectedNumber(p.missingNumbers[0] ?? p.numbers[0])} key={p.name} className="card-edge rounded-2xl p-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-cream">
                  {p.name} <span className="text-xs font-normal text-muted">{p.numbers.join("-")}</span>
                </p>
                <span className={`text-xs font-semibold ${p.status === "complete" ? "text-gold-bright" : p.status === "empty" ? "text-rose" : "text-muted"}`}>
                  {p.status === "complete" ? t.complete : p.status === "empty" ? t.empty : t.of3(p.filled)}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">{p.status === "complete" ? p.strong : p.status === "empty" ? p.empty : t.developing(p.missingNumbers, p.strong)}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="card-edge rounded-2xl p-5"><h3 className="text-xl font-bold text-cream">{t.yearCycle}</h3><p className="mt-1 text-sm text-muted">Birth month + birth day + calendar-year digits, reduced to 1–9.</p><div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-9">{Array.from({length:9},(_,i)=>{const year=new Date().getFullYear()+i-4;const number=reduceToDigit(Number(r.date.slice(5,7))+Number(r.date.slice(8,10))+reduceToDigit(year));return <div key={year} className={`rounded-xl border p-2 text-center ${year===new Date().getFullYear()?"border-gold bg-gold/10":"border-border/70"}`}><span className="block text-xs text-muted">{year}</span><b className="font-display text-xl text-gold-bright">{number}</b></div>})}</div></section>

      <section aria-label="Numbers in your grid">
        <h3 className="text-xl font-bold tracking-tight text-cream">{t.eachTitle}</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {r.present.map((p) => (
            <div key={p.n} className="card-edge rounded-2xl p-4">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-display text-2xl text-gold-bright">{String(p.n).repeat(p.count)}</span>
                <span className="text-right text-xs text-muted">
                  {p.count}× · {line(p.n)}
                </span>
              </div>
              <p className="mt-2 text-sm text-cream">{p.meaning}</p>
            </div>
          ))}
        </div>
      </section>

      {r.missing.length > 0 && (
        <section aria-label="Missing numbers">
          <h3 className="text-xl font-bold tracking-tight text-cream">{t.missingTitle}</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {r.missing.map((m) => (
              <div key={m.n} className="card-edge rounded-2xl p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-2xl text-rose">{m.n}</span>
                  <span className="text-right text-xs text-muted">{line(m.n)}</span>
                </div>
                <p className="mt-2 text-sm text-cream">{m.meaning}</p>
                <ul className="mt-2 space-y-1 text-sm text-muted">
                  {m.remedies.map((x) => (
                    <li key={x} className="flex gap-2">
                      <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" />
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {r.kuaDirections && (
        <section className="card-edge rounded-2xl p-5" aria-label="Kua directions">
          <h3 className="text-sm font-semibold text-cream">{t.kuaTitle(r)}</h3>
          <p className="mt-1 text-xs text-muted">{t.kuaBody}</p>
          <ol className="mt-3 grid gap-2 sm:grid-cols-4">
            {r.kuaDirections.best.map((d, i) => (
              <li key={d.direction} className="rounded-xl border border-border/70 px-3 py-2 text-sm">
                <span className="text-xs text-muted">
                  {i + 1}. {d.use}
                </span>
                <span className="block font-semibold text-cream">{d.direction}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
      {r.kuaDirections && <p className="text-xs text-muted">{t.kuaBoundary}</p>}
      {mode === "astrologer" && <section className="card-edge rounded-2xl p-5"><h3 className="font-semibold text-cream">Calculation audit</h3><p className="mt-1 text-sm text-muted">Birth-date digits: {r.date.replace(/\D/g,"").split("").filter(d=>d!=="0").join(" ")}</p><p className="text-sm text-muted">Driver added: {r.method==="indian"?r.driver:"no"} · Conductor added: {r.method==="indian"?r.conductor:"no"} · Kua added: {r.kua ?? "no"}. Zero digits are omitted.</p><p className="text-sm text-muted">Name number: {r.name?`${r.name.compound} → ${r.name.number}`:"not entered"} · Personal year {r.personalYear.year}: {r.personalYear.number}</p><p className="mt-2 text-xs text-muted">Kua is based on the traditional approximate 4 February year boundary and gendered formula; schools may differ near Li Chun.</p></section>}
    </div>
  );
}

function List({ title, items, tone }: { title: string; items: string[]; tone: "gold" | "rose" }) {
  return (
    <div className="card-edge rounded-2xl p-5">
      <p className={`text-sm font-semibold ${tone === "gold" ? "text-gold-bright" : "text-rose"}`}>{title}</p>
      <ul className="mt-2 space-y-1.5 text-sm text-muted">
        {items.map((x) => (
          <li key={x} className="flex gap-2">
            <span aria-hidden="true" className={`mt-2 h-1 w-1 shrink-0 rounded-full ${tone === "gold" ? "bg-gold" : "bg-rose"}`} />
            {x}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Draws the grid as a shareable PNG and downloads it. */
function downloadGrid(r: LoShuReport, name: string, t: Copy) {
  const W = 900;
  const H = 1100;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#142043");
  bg.addColorStop(1, "#0a1128");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.fillStyle = "#f2c14e";
  ctx.font = "600 30px system-ui, sans-serif";
  ctx.fillText(t.imgTitle, W / 2, 80);
  ctx.fillStyle = "#eef0f5";
  ctx.font = "700 44px system-ui, sans-serif";
  ctx.fillText(name || r.date.split("-").reverse().join("/"), W / 2, 140);
  ctx.fillStyle = "#b3bdd8";
  ctx.font = "400 24px system-ui, sans-serif";
  ctx.fillText(`${t.driver} ${r.driver} · ${t.conductor} ${r.conductor}${r.kua ? ` · ${t.kua} ${r.kua}` : ""}`, W / 2, 185);
  const cell = 230;
  const x0 = (W - cell * 3) / 2;
  const y0 = 240;
  r.cells.flat().forEach((c2, i) => {
    const x = x0 + (i % 3) * cell;
    const y = y0 + Math.floor(i / 3) * cell;
    ctx.fillStyle = c2.count ? "rgba(232,169,21,0.14)" : "rgba(255,255,255,0.03)";
    ctx.strokeStyle = c2.count ? "rgba(242,193,78,0.7)" : "rgba(255,255,255,0.18)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(x + 8, y + 8, cell - 16, cell - 16, 24);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = c2.count ? "#f2c14e" : "rgba(255,255,255,0.25)";
    const text = c2.count ? String(c2.n).repeat(c2.count) : String(c2.n);
    ctx.font = `700 ${c2.count > 3 ? 54 : 80}px system-ui, sans-serif`;
    ctx.fillText(text, x + cell / 2, y + cell / 2 + 22);
    ctx.fillStyle = ELEMENT_TINT[DIGITS[c2.n].element];
    ctx.font = "500 20px system-ui, sans-serif";
    ctx.fillText(`${c2.label.planet} · ${c2.label.direction.split(" (")[0]}`, x + cell / 2, y + cell - 34);
  });
  ctx.fillStyle = "#b3bdd8";
  ctx.font = "400 24px system-ui, sans-serif";
  ctx.fillText(t.imgMissing(r), W / 2, y0 + cell * 3 + 70);
  ctx.fillStyle = "#f2c14e";
  ctx.font = "600 22px system-ui, sans-serif";
  ctx.fillText(window.location.host, W / 2, H - 50);
  const a = document.createElement("a");
  a.href = c.toDataURL("image/png");
  a.download = `lo-shu-${r.date}.png`;
  a.click();
}
