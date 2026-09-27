"use client";

import { useState } from "react";
import DatePicker from "@/components/DatePicker";
import { bhagyank, moolank, nameNumber, NUMBER_MEANINGS } from "@/lib/numerology";

export default function NumerologyCalculator() {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [result, setResult] = useState<{ name: string; date: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    </div>
  );
}
