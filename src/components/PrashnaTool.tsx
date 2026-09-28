"use client";

import { useState } from "react";
import PlaceInput, { type PlaceSuggestion } from "@/components/PlaceInput";
import { haptic } from "@/lib/haptics";
import { PRASHNA_TOPICS, type PrashnaResult, type PrashnaTopic } from "@/lib/astrology/prashnaTopics";

export default function PrashnaTool() {
  const [topic, setTopic] = useState<PrashnaTopic>("job");
  const [place, setPlace] = useState<PlaceSuggestion | null>(null);
  const [result, setResult] = useState<PrashnaResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!place) return setError("Choose the place where you are now.");
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/prashna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, latitude: place.latitude, longitude: place.longitude, timezone: place.timezone, place: place.displayName }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      setResult(json);
      haptic(json.answer === "Unlikely" ? "warning" : "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const tone = result && (result.answer === "Yes" || result.answer === "Likely yes" ? "text-gold-bright" : result.answer === "Unlikely" ? "text-rose" : "text-cream");

  return (
    <div className="space-y-8">
      <form onSubmit={ask} className="card-edge rounded-3xl p-6 md:p-8">
        <fieldset>
          <legend className="text-xs font-semibold text-muted">Your question</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {(Object.keys(PRASHNA_TOPICS) as PrashnaTopic[]).map((k) => (
              <label key={k} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm ${topic === k ? "border-gold bg-gold/10 text-cream" : "border-border text-muted hover:border-gold"}`}>
                <input type="radio" name="topic" value={k} checked={topic === k} onChange={() => setTopic(k)} className="accent-[var(--color-gold)]" />
                {PRASHNA_TOPICS[k].label}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="mt-5 block max-w-md">
          <span className="mb-1.5 block text-xs font-semibold text-muted">Where are you right now?</span>
          <PlaceInput selected={place} onSelect={setPlace} showTimezone={false} placeholder="City, town or village" />
        </label>
        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-rose/30 bg-rose/5 px-4 py-2.5 text-sm text-rose">
            {error}
          </p>
        )}
        <button type="submit" disabled={loading} className="mt-6 rounded-full bg-gold px-7 py-3 text-base font-semibold text-on-gold hover:bg-gold-bright disabled:opacity-70">
          {loading ? "Casting the chart…" : "Ask now"}
        </button>
        <p className="mt-3 text-xs text-muted">Hold the question clearly in mind before you press the button. The chart is cast for this exact minute.</p>
      </form>

      {result && (
        <section className="card-edge rounded-3xl p-7" aria-live="polite">
          <p className="text-sm text-muted">{result.question}</p>
          <p className={`font-display mt-1 text-5xl ${tone}`}>{result.answer}</p>
          <p className="mt-2 text-sm text-muted">
            Asked {new Date(result.askedAt).toLocaleString()} · Lagna {result.chart.ascendant} · Moon in {result.chart.moonSign} ({result.chart.moonNakshatra})
          </p>
          <p className="mt-4 text-cream">{result.advice}</p>
          <h3 className="mt-6 text-sm font-semibold text-gold-bright">How the answer was reached</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {result.factors.map((f) => (
              <li key={f.name} className="rounded-xl border border-border/70 px-4 py-3">
                <span className={`font-semibold ${f.positive === true ? "text-gold-bright" : f.positive === false ? "text-rose" : "text-cream"}`}>{f.name}</span>
                <span className="block text-muted">{f.text}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
