"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import DatePicker from "@/components/DatePicker";
import { bhagyank, isValidBirthDate, loShuCounts, mobileNumerology, moolank, nameNumber, nameSuggestions, NUMBER_MEANINGS } from "@/lib/numerology";
import { numerologyProfile } from "@/lib/numerologyProfile";

type Profile = { name: string; birthName: string; date: string };

export default function NumerologyCalculator() {
  const [name, setName] = useState("");
  const [birthName, setBirthName] = useState("");
  const [date, setDate] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [view, setView] = useState<"indian"|"western">("indian");
  const [mode, setMode] = useState<"user"|"astrologer">("user");
  const [yAsVowel, setYAsVowel] = useState(false);
  const [cycleYear, setCycleYear] = useState(new Date().getFullYear());

  function calculate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || nameNumber(name).compound === 0 || !isValidBirthDate(date)) {
      setError("Enter a name with English letters and a real birth date from 1900 to today.");
      return;
    }
    setError(null);
    setProfile({ name: name.trim(), birthName: (birthName.trim() || name.trim()), date });
  }

  const result = useMemo(() => profile ? numerologyProfile(profile.birthName, profile.date, new Date(cycleYear, new Date().getMonth(), new Date().getDate()), yAsVowel) : null, [profile, cycleYear, yAsVowel]);
  const suggestions = profile ? nameSuggestions(profile.name, profile.date) : null;
  const mobile = (() => {
    if (!profile || phone.replace(/\D/g, "").length < 10) return null;
    try { return mobileNumerology(phone, profile.date); } catch { return null; }
  })();

  return <div>
    <form onSubmit={calculate} className="card-edge grid gap-4 rounded-2xl p-6 md:grid-cols-[1fr_1fr_220px_auto] md:items-end">
      <Field label="Name you use"><input maxLength={80} value={name} onChange={e=>setName(e.target.value)} placeholder="As you usually write it" className="input" /></Field>
      <Field label="Birth name (for Western name numbers)"><input maxLength={80} value={birthName} onChange={e=>setBirthName(e.target.value)} placeholder="Optional; defaults to name above" className="input" /></Field>
      <Field label="Date of birth"><DatePicker value={date} onChange={setDate} /></Field>
      <button type="submit" className="rounded-full bg-gold px-7 py-3.5 text-sm font-semibold text-on-gold hover:bg-gold-bright">Build my profile</button>
    </form>
    {error && <p role="alert" className="mt-4 rounded-xl border border-rose/30 bg-rose/5 px-4 py-3 text-sm text-rose">{error}</p>}

    {profile && result && suggestions && <div className="mt-8 space-y-7">
      <div className="card-edge flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4"><div><p className="font-semibold text-cream">{mode === "user" ? "Personal reading" : "Astrologer workspace"}</p><p className="text-xs text-muted">{profile.name} · {profile.date}</p></div><div className="flex gap-1 rounded-full border border-border p-1"><Toggle active={mode==="user"} onClick={()=>setMode("user")}>User</Toggle><Toggle active={mode==="astrologer"} onClick={()=>setMode("astrologer")}>Astrologer</Toggle></div></div>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-bold text-cream">Your numerology profile</h2><p className="mt-1 max-w-2xl text-sm text-muted">Read each number through its named tradition. These symbolic systems use different letter and date rules.</p></div><div className="flex rounded-full border border-border p-1"><Toggle active={view==="indian"} onClick={()=>setView("indian")}>Indian · Chaldean</Toggle><Toggle active={view==="western"} onClick={()=>setView("western")}>Western · Pythagorean</Toggle></div></div>

      {view === "indian" ? <>
        <div className="grid gap-4 md:grid-cols-3">{[{title:"Moolank",num:result.indian.moolank.number,compound:result.indian.moolank.compound,method:"Birth day reduced"},{title:"Bhagyank",num:result.indian.bhagyank.number,compound:result.indian.bhagyank.compound,method:"All birth-date digits"},{title:"Name number",num:result.indian.name.digit,compound:result.indian.name.compound,method:"Chaldean name total"}].map(item=><article key={item.title} className="card-edge rounded-2xl p-5"><p className="text-xs font-semibold text-gold-bright">{item.title}</p><p className="mt-3 font-display text-5xl text-cream">{item.num}</p><p className="mt-2 text-sm font-semibold text-gold-bright">{NUMBER_MEANINGS[item.num].planet} · {NUMBER_MEANINGS[item.num].keywords}</p><p className="mt-2 text-xs text-muted">{item.method} · compound {item.compound}</p><p className="mt-3 text-sm leading-relaxed text-muted">{NUMBER_MEANINGS[item.num].description}</p><p className="mt-3 text-xs text-muted">Traditionally associated day: {NUMBER_MEANINGS[item.num].day} · colours: {NUMBER_MEANINGS[item.num].colours}</p></article>)}</div>
        <section className="card-edge rounded-2xl p-5"><h3 className="font-semibold text-cream">How your numbers work together</h3><p className="mt-2 text-sm text-muted">{result.indian.relationship}</p><p className="mt-3 text-xs text-muted">Number compatibility follows the directional friendly-number table in this method. Treat it as an interpretive convention, not a measured compatibility score.</p></section>
        {mode === "astrologer" && <section className="card-edge rounded-2xl p-5"><h3 className="font-semibold text-cream">Chaldean name calculation</h3><p className="mt-1 text-sm text-muted">{result.indian.name.letters.map(x=>`${x.letter} ${x.value}`).join(" · ") || "No supported Latin letters"}</p><p className="mt-1 text-sm text-muted">Total {result.indian.name.compound} → digit {result.indian.name.digit}. Compound totals are shown without asserting a separate universal meaning.</p></section>}
        <section className="card-edge rounded-2xl p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold text-cream">Personal year rhythm</h3><p className="text-xs text-muted">Birth month + birth day + calendar-year digits, reduced to one digit.</p></div><label className="text-xs text-muted">Year <select value={cycleYear} onChange={e=>setCycleYear(Number(e.target.value))} className="input ml-2 !w-28">{Array.from({length:11},(_,i)=>new Date().getFullYear()-5+i).map(y=><option key={y}>{y}</option>)}</select></label></div><div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-9">{result.cycles.personalYearTimeline.map(x=><button key={x.year} onClick={()=>setCycleYear(x.year)} aria-pressed={cycleYear===x.year} className={`rounded-xl border p-2 text-center ${cycleYear===x.year?"border-gold bg-gold/10":"border-border/70"}`}><span className="block text-xs text-muted">{x.year}</span><b className="font-display text-xl text-gold-bright">{x.number}</b></button>)}</div><p className="mt-3 text-sm text-cream">{cycleYear}: Personal Year {result.cycles.personalYear} · Personal Month {result.cycles.personalMonth} · today’s Personal Day {result.cycles.personalDay} · Universal Year {result.cycles.universalYear}</p></section>
        <section className="card-edge rounded-2xl p-5"><h3 className="font-semibold text-cream">Name comparison</h3><p className="mt-1 text-sm text-muted">The name you use totals {nameNumber(profile.name).compound} → {nameNumber(profile.name).digit}; the entered birth name totals {nameNumber(profile.birthName).compound} → {nameNumber(profile.birthName).digit}.</p><p className="mt-2 text-xs text-muted">Spelling ideas are optional explorations. A numerology match does not establish that a spelling change is beneficial in real life.</p>{!suggestions.current.suits&&<div className="mt-3 grid gap-2 sm:grid-cols-2">{suggestions.suggestions.map(s=><p key={s.spelling} className="rounded-xl border border-border p-3 text-sm text-cream">{s.spelling} · {s.compound} → {s.digit} ({s.change})</p>)}</div>}</section>
      </> : <>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[{title:"Life Path",...result.western.lifePath,desc:"Birth-date direction"},{title:"Birthday",...result.western.birthday,desc:"Day-of-month emphasis"},{title:"Expression",...result.western.name.expression,desc:"Full birth-name letters"},{title:"Soul Urge",...result.western.name.soulUrge,desc:"Vowels in birth name"},{title:"Personality",...result.western.name.personality,desc:"Consonants in birth name"},{title:"Attitude",...result.western.attitude,desc:"Birth month + day"}].map(x=><article key={x.title} className="card-edge rounded-2xl p-5"><p className="text-xs font-semibold text-gold-bright">{x.title}</p><p className="mt-2 font-display text-4xl text-cream">{x.number}</p><p className="mt-1 text-xs text-muted">Compound {x.compound} · {x.desc}</p></article>)}</div>
        <section className="card-edge rounded-2xl p-5"><label className="flex items-start gap-3 text-sm text-cream"><input type="checkbox" checked={yAsVowel} onChange={e=>setYAsVowel(e.target.checked)} className="mt-1 accent-amber-400"/><span>Count Y as a vowel in Soul Urge calculations<p className="mt-1 text-xs text-muted">Some schools classify Y differently. This switch changes Soul Urge and Personality, not Expression.</p></span></label><p className="mt-3 text-xs text-muted">Pythagorean letter cycle A=1… I=9, then repeats. Master totals 11, 22 and 33 are retained in these Western core numbers.</p></section>
        <section className="card-edge rounded-2xl p-5"><h3 className="font-semibold text-cream">Pinnacles and challenges</h3><p className="mt-1 text-xs text-muted">Four life-cycle numbers from reduced birth month, day and year. Ages follow the 36 − Life Path convention.</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{result.western.pinnacles.map((p,i)=><article key={i} className="rounded-xl border border-border/70 p-4"><p className="text-sm font-semibold text-cream">Pinnacle {i+1} · {p.number} <span className="font-normal text-muted">({p.start}–{p.end ?? "onward"})</span></p><p className="mt-1 text-sm text-muted">Challenge {p.challenge} · calculation compound {p.compound}</p></article>)}</div></section>
        {mode === "astrologer" && <section className="card-edge rounded-2xl p-5"><h3 className="font-semibold text-cream">Pythagorean letter audit</h3><p className="mt-1 text-sm text-muted">{result.western.name.values.map(x=>`${x.letter} ${x.value} (${x.vowel?"vowel":"consonant"})`).join(" · ")}</p></section>}
      </>}

      {mode === "astrologer" && <details className="card-edge rounded-2xl p-5"><summary className="cursor-pointer font-semibold text-cream">Calculation conventions and evidence</summary><ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted"><li>Indian view: birth-day root, all-date-digit root and Chaldean A=1/I=1 through F=8 mapping.</li><li>Western view: repeating Pythagorean letter values; vowel/consonant split follows the selected Y convention.</li><li>Personal cycles use calendar-year digits and the selected calendar month/day.</li><li>Lo Shu count source: shared grid calculation, with date digits and optional Driver/Conductor method on the detailed grid page.</li></ul></details>}
      <section className="card-edge rounded-2xl p-5"><h3 className="font-semibold text-cream">Lo Shu grid</h3><p className="mt-1 text-sm text-muted">The shared grid engine counts each birth-date digit, with an optional Indian Driver/Conductor method.</p><div className="mt-3 grid grid-cols-3 gap-1 sm:w-fit">{[4,9,2,3,5,7,8,1,6].map(n=><div key={n} className="flex h-16 w-16 items-center justify-center rounded-lg border border-border/70 text-center"><span className="font-display text-lg text-gold-bright">{loShuCounts(profile.date)[n] ? String(n).repeat(loShuCounts(profile.date)[n]) : "·"}</span></div>)}</div><Link href={`/lo-shu?date=${profile.date}&name=${encodeURIComponent(profile.name)}`} className="mt-3 inline-block text-sm font-semibold text-gold-bright">Open the interactive Lo Shu reading</Link></section>
      <section className="card-edge rounded-2xl p-5"><h3 className="font-semibold text-cream">Mobile number</h3><label className="mt-3 block max-w-sm"><span className="mb-1.5 block text-xs font-semibold text-muted">10 digits · checked only in this browser</span><input value={phone} onChange={e=>{setPhone(e.target.value);setPhoneError(null)}} inputMode="numeric" autoComplete="off" className="input"/></label>{phoneError&&<p role="alert" className="mt-2 text-sm text-rose">{phoneError}</p>}{mobile&&<div className="mt-3"><p className="font-semibold text-gold-bright">{mobile.verdict} · {mobile.digit} ({NUMBER_MEANINGS[mobile.digit].planet})</p><ul className="mt-1 space-y-1 text-sm text-muted">{mobile.notes.map(note=><li key={note}>{note}</li>)}</ul></div>}<button type="button" onClick={()=>{try{mobileNumerology(phone,profile.date);setPhoneError(null)}catch(e){setPhoneError(e instanceof Error?e.message:"Enter a valid 10-digit mobile number.")}}} className="mt-3 rounded-full border border-border px-4 py-2 text-xs font-semibold text-cream">Check number</button></section>
      <p className="text-center text-xs text-muted">Numerology is a cultural and spiritual practice. Readings are reflective interpretations, not scientifically validated personality or outcome measurements.</p>
    </div>}
  </div>;
}

function Field({label,children}:{label:string;children:React.ReactNode}) { return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-muted">{label}</span>{children}</label>; }
function Toggle({active,onClick,children}:{active:boolean;onClick:()=>void;children:React.ReactNode}) { return <button type="button" onClick={onClick} aria-pressed={active} className={`rounded-full px-4 py-2 text-xs font-semibold ${active?"bg-gold text-on-gold":"text-muted hover:text-cream"}`}>{children}</button>; }
