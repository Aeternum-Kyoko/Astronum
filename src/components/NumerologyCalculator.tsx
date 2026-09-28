"use client";

import { useState } from "react";
import DatePicker from "@/components/DatePicker";
import { bhagyank, loShu, LO_SHU_LAYOUT, mobileNumerology, moolank, nameNumber, nameSuggestions, NUMBER_MEANINGS } from "@/lib/numerology";

export default function NumerologyCalculator() {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [result, setResult] = useState<{ name: string; date: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState("");

  function calculate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !/[a-z]/i.test(name) || !date) {
      setError("Enter your full name (in English letters) and your date of birth.");
      return;
    }
    setError(null);
    setResult({ name: name.trim(), date });
  }

  const numbers = result
    ? [
        { label: "Moolank", sub: "Psychic number · from your birth day", value: moolank(result.date) },
        { label: "Bhagyank", sub: "Destiny number · from your full birth date", value: bhagyank(result.date) },
        { label: "Name number", sub: `Chaldean · compound ${nameNumber(result.name).compound}`, value: nameNumber(result.name).digit },
      ]
    : [];

  return (
    <div>
      <form onSubmit={calculate} className="card-edge grid gap-4 rounded-2xl p-6 md:grid-cols-[1fr_220px_auto] md:items-end">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-muted">Full name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="As you usually write it" className="input" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-muted">Date of birth</span>
          <DatePicker value={date} onChange={setDate} />
        </label>
        <button type="submit" className="rounded-full bg-gold px-7 py-3.5 text-sm font-semibold text-on-gold hover:bg-gold-bright">
          Calculate
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-rose/30 bg-rose/5 px-4 py-3 text-sm text-rose">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {numbers.map((n) => {
            const m = NUMBER_MEANINGS[n.value];
            return (
              <section key={n.label} className="card-edge rounded-2xl p-6">
                <p className="text-xs font-semibold text-gold-bright">{n.label}</p>
                <p className="text-xs text-muted">{n.sub}</p>
                <p className="mt-4 font-display text-6xl text-cream">{n.value}</p>
                <p className="mt-2 text-sm font-semibold text-gold-bright">Ruled by {m.planet}</p>
                <p className="mt-1 text-xs text-muted">{m.keywords}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted">{m.description}</p>
                <dl className="mt-4 space-y-1 text-xs">
                  <div className="flex gap-2">
                    <dt className="w-16 text-muted">Day</dt>
                    <dd className="text-cream">{m.day}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-16 text-muted">Colours</dt>
                    <dd className="text-cream">{m.colours}</dd>
                  </div>
                </dl>
              </section>
            );
          })}
        </div>
      )}

      {result && <NumerologyDetails name={result.name} date={result.date} phone={phone} setPhone={setPhone} />}
    </div>
  );
}

function NumerologyDetails({ name, date, phone, setPhone }: { name: string; date: string; phone: string; setPhone: (v: string) => void }) {
  const grid = loShu(date);
  const names = nameSuggestions(name, date);
  const digits = phone.replace(/\D/g, "");
  const mobile = digits.length >= 10 ? mobileNumerology(digits, date) : null;
  return (
    <div className="mt-8 space-y-6">
      <section className="card-edge rounded-2xl p-6">
        <h2 className="text-lg font-bold text-cream">Lo Shu grid</h2>
        <p className="mt-1 text-sm text-muted">Every digit of your birth date, plus your Moolank and Bhagyank, placed in the Lo Shu magic square.</p>
        <div className="mt-5 grid gap-6 md:grid-cols-[auto_1fr]">
          <div className="grid grid-cols-3 gap-1.5" role="table" aria-label="Lo Shu grid">
            {LO_SHU_LAYOUT.flat().map((n) => (
              <div key={n} role="cell" className={`flex h-20 w-20 flex-col items-center justify-center rounded-xl border ${grid.counts[n] ? "border-gold/50 bg-gold/10" : "border-border/60"}`}>
                <span className={`font-display text-2xl ${grid.counts[n] ? "text-gold-bright" : "text-border"}`}>{grid.counts[n] ? String(n).repeat(grid.counts[n]) : n}</span>
                {!grid.counts[n] && <span className="text-[10px] text-muted">missing</span>}
              </div>
            ))}
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <h3 className="text-xs font-semibold text-gold-bright">Complete planes (your strengths)</h3>
              <ul className="mt-1 space-y-0.5 text-muted">
                {grid.planes.filter((p) => p.complete).map((p) => (
                  <li key={p.name}>
                    <span className="font-semibold text-cream">{p.name}</span> ({p.numbers.join("-")}): {p.meaning}
                  </li>
                ))}
                {!grid.planes.some((p) => p.complete) && <li>No complete plane — strengths come from the numbers you do have.</li>}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-rose">Missing numbers</h3>
              <ul className="mt-1 space-y-0.5 text-muted">
                {grid.missing.map((m) => (
                  <li key={m.number}>
                    <span className="font-semibold text-cream">{m.number}:</span> {m.meaning}
                  </li>
                ))}
              </ul>
            </div>
            {grid.repeated.length > 0 && (
              <p className="text-muted">
                Repeated: {grid.repeated.map((r) => `${r.number} (${r.count}×)`).join(", ")} — these qualities are strong, sometimes to excess.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="card-edge rounded-2xl p-6">
        <h2 className="text-lg font-bold text-cream">Name correction</h2>
        <p className="mt-1 text-sm text-muted">
          Your name number {names.current.compound} ({names.current.digit}) {names.current.suits ? "already suits" : "does not fully suit"} your Moolank {moolank(date)} and Bhagyank {bhagyank(date)}.
          {names.current.suits ? " Changing your spelling isn't needed." : " These small spelling changes would bring it into harmony:"}
        </p>
        {!names.current.suits && (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {names.suggestions.map((s) => (
              <li key={s.spelling} className="rounded-xl border border-border/70 px-4 py-2.5 text-sm">
                <span className="font-semibold text-gold-bright">{s.spelling}</span>
                <span className="block text-xs text-muted">
                  {s.change} · number {s.compound} → {s.digit} ({NUMBER_MEANINGS[s.digit].planet})
                </span>
              </li>
            ))}
            {!names.suggestions.length && <li className="text-sm text-muted">No small change finds a harmonious number; a numerologist can suggest a larger change.</li>}
          </ul>
        )}
      </section>

      <section className="card-edge rounded-2xl p-6">
        <h2 className="text-lg font-bold text-cream">Mobile number</h2>
        <label className="mt-3 block max-w-sm">
          <span className="mb-1.5 block text-xs font-semibold text-muted">Your 10-digit mobile number (checked only in your browser)</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" autoComplete="off" className="input" />
        </label>
        {mobile && (
          <div className="mt-4 text-sm">
            <p className={`text-lg font-bold ${mobile.verdict === "Lucky" ? "text-gold-bright" : mobile.verdict === "Not ideal" ? "text-rose" : "text-cream"}`}>{mobile.verdict}</p>
            <ul className="mt-1 space-y-0.5 text-muted">
              {mobile.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
