"use client";

import { useEffect, useRef, useState } from "react";
import DatePicker from "@/components/DatePicker";
import TimePicker from "@/components/TimePicker";

interface PlaceSuggestion {
  displayName: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export default function ConsultationForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [placeQuery, setPlaceQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceSuggestion | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (selectedPlace && placeQuery === selectedPlace.displayName) return;
    if (placeQuery.trim().length < 3) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(placeQuery)}`);
        const data = await res.json();
        setSuggestions(data.results ?? []);
      } catch {
        setSuggestions([]);
      }
    }, 450);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [placeQuery, selectedPlace]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!birthDate || !birthTime || !selectedPlace) {
      setError("Please fill in your birth date, time, and select a birth place from the list.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          birthDate,
          birthTime,
          birthPlace: selectedPlace.displayName,
          latitude: selectedPlace.latitude,
          longitude: selectedPlace.longitude,
          timezone: selectedPlace.timezone,
          message: message || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="card-edge rounded-2xl p-10 text-center">
        <p className="font-display text-2xl text-gold-bright">Request received</p>
        <p className="mt-3 text-sm text-muted">
          Thank you — your reading request has been sent. You&apos;ll be contacted at the email you
          provided to arrange next steps.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card-edge rounded-2xl p-6 md:p-8">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Your name">
          <input required value={name} onChange={(e) => setName(e.target.value)} className="input" />
        </Field>
        <Field label="Email">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Phone (optional)">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" />
        </Field>
        <div className="grid grid-cols-2 gap-5">
          <Field label="Date of birth">
            <DatePicker value={birthDate} onChange={setBirthDate} />
          </Field>
          <Field label="Time of birth">
            <TimePicker value={birthTime} onChange={setBirthTime} />
          </Field>
        </div>

        <div className="relative md:col-span-2">
          <Field label="Place of birth">
            <div className="relative">
              <FieldIcon>
                <PinIcon />
              </FieldIcon>
              <input
                required
                value={placeQuery}
                onChange={(e) => {
                  setPlaceQuery(e.target.value);
                  setSelectedPlace(null);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Start typing a city"
                className="input input-icon"
                autoComplete="off"
              />
            </div>
          </Field>
          {showSuggestions && placeQuery.trim().length >= 3 && suggestions.length > 0 && (
            <ul className="card-glass shadow-floating absolute z-10 mt-1 w-full overflow-hidden rounded-lg">
              {suggestions.map((s, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onMouseDown={() => {
                      setSelectedPlace(s);
                      setPlaceQuery(s.displayName);
                      setSuggestions([]);
                    }}
                    className="block w-full px-4 py-2.5 text-left text-sm text-muted hover:bg-surface hover:text-cream"
                  >
                    {s.displayName}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="md:col-span-2">
          <Field label="What would you like guidance on? (optional)">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="input resize-none"
            />
          </Field>
        </div>
      </div>

      {error && <p className="mt-5 text-sm text-rose">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="btn-shimmer mt-7 w-full rounded-full bg-gold px-6 py-3.5 text-sm font-semibold text-ink-deep transition-colors hover:bg-gold-bright disabled:opacity-60 md:w-auto"
      >
        {loading ? "Sending…" : "Request a Reading"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">{label}</span>
      {children}
    </label>
  );
}

function FieldIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted">{children}</span>
  );
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 14.5S13 10 13 6.5a5 5 0 1 0-10 0C3 10 8 14.5 8 14.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="6.5" r="1.8" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
