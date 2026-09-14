"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { KundaliChart } from "@/lib/astrology/types";
import KundaliResult from "@/components/KundaliResult";
import KundaliIntro from "@/components/KundaliIntro";
import DatePicker from "@/components/DatePicker";
import TimePicker from "@/components/TimePicker";

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];
const MIN_LOADING_MS = 1600;

const LOADING_STEPS = [
  "Calculating planetary positions",
  "Building your 16 divisional charts",
  "Computing Ashtakavarga & Shadbala",
  "Mapping your Vimshottari Dasha",
];

interface PlaceSuggestion {
  displayName: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

type View = "form" | "loading" | "result";

export default function KundaliForm() {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [placeQuery, setPlaceQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceSuggestion | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chart, setChart] = useState<KundaliChart | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  const view: View = loading ? "loading" : chart ? "result" : "form";

  useEffect(() => {
    if (view === "form") return;
    anchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [view]);

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

    if (!name.trim() || !date || !time || !selectedPlace) {
      setError("Please fill in your name, birth date, time, and select a birth place from the list.");
      return;
    }

    setLoading(true);
    const startedAt = Date.now();
    try {
      const res = await fetch("/api/kundali", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          date,
          time,
          latitude: selectedPlace.latitude,
          longitude: selectedPlace.longitude,
          timezone: selectedPlace.timezone,
          place: selectedPlace.displayName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");

      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_LOADING_MS) {
        await new Promise((r) => setTimeout(r, MIN_LOADING_MS - elapsed));
      }
      setChart(data.chart);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={anchorRef}>
      <AnimatePresence mode="wait">
        {view === "form" && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
          >
            <KundaliIntro />
            <div className="mt-14">
              <form
                onSubmit={handleSubmit}
                className="card-edge rounded-3xl p-7 shadow-[0_0_60px_rgba(212,175,106,0.06)] md:p-10"
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Name">
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Asha Sharma"
                      className="input"
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-5">
                    <Field label="Date of birth">
                      <DatePicker value={date} onChange={setDate} />
                    </Field>
                    <Field label="Time of birth">
                      <TimePicker value={time} onChange={setTime} />
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
                          placeholder="Start typing a city, e.g. Jaipur, India"
                          className="input input-icon"
                          autoComplete="off"
                        />
                      </div>
                    </Field>
                    <AnimatePresence>
                      {showSuggestions && placeQuery.trim().length >= 3 && suggestions.length > 0 && (
                        <motion.ul
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }}
                          className="card-glass shadow-floating absolute z-10 mt-1.5 w-full overflow-hidden rounded-xl"
                        >
                          {suggestions.map((s, i) => (
                            <motion.li
                              key={i}
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.2, delay: i * 0.03 }}
                            >
                              <button
                                type="button"
                                onMouseDown={() => {
                                  setSelectedPlace(s);
                                  setPlaceQuery(s.displayName);
                                  setSuggestions([]);
                                }}
                                className="block w-full px-4 py-3 text-left text-sm text-muted transition-colors hover:bg-surface hover:text-cream"
                              >
                                {s.displayName}
                              </button>
                            </motion.li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                    {selectedPlace && (
                      <p className="mt-2 text-xs text-muted">
                        Timezone detected: <span className="text-gold-bright">{selectedPlace.timezone}</span>
                      </p>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-5 rounded-xl border border-rose/30 bg-rose/5 px-4 py-3 text-sm text-rose"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  className="btn-shimmer mt-8 flex w-full items-center justify-center gap-2.5 rounded-full bg-gold px-6 py-4 text-base font-semibold text-ink-deep transition-transform hover:scale-[1.02] hover:bg-gold-bright md:w-auto md:px-9"
                >
                  Generate Kundali
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {view === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
          >
            <LoadingCard />
          </motion.div>
        )}

        {view === "result" && chart && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
          >
            <ProfileHeader name={name} date={date} time={time} place={selectedPlace?.displayName} onEdit={() => setChart(null)} />
            <KundaliResult chart={chart} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LoadingCard() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1));
    }, MIN_LOADING_MS / LOADING_STEPS.length);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="card-edge flex flex-col items-center rounded-3xl px-7 py-16 text-center md:px-10">
      <motion.div
        className="h-14 w-14 rounded-full border-2 border-gold/25 border-t-gold-bright"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <p className="mt-7 font-display text-xl text-cream">Calculating your kundli…</p>
      <ul className="mt-6 space-y-2.5">
        {LOADING_STEPS.map((label, i) => (
          <li
            key={label}
            className={`flex items-center justify-center gap-2 text-sm transition-colors duration-300 ${
              i <= step ? "text-gold-bright" : "text-muted/50"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                i <= step ? "bg-gold-bright" : "bg-muted/40"
              }`}
            />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDateDisplay(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function formatTimeDisplay(hhmm: string): string {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!m) return hhmm;
  const h = Number(m[1]);
  const minute = m[2];
  const period = h >= 12 ? "PM" : "AM";
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${minute} ${period}`;
}

function ProfileHeader({
  name,
  date,
  time,
  place,
  onEdit,
}: {
  name: string;
  date: string;
  time: string;
  place?: string;
  onEdit: () => void;
}) {
  return (
    <div className="card-edge mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-bright to-gold font-display text-lg font-bold text-ink-deep">
          {getInitials(name)}
        </div>
        <div>
          <p className="font-display text-lg text-cream">{name}</p>
          <p className="text-xs text-muted">
            {formatDateDisplay(date)} · {formatTimeDisplay(time)}
            {place ? ` · ${place}` : ""}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold text-cream transition-colors hover:border-gold hover:text-gold-bright"
      >
        <EditIcon />
        Edit Chart
      </button>
    </div>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path
        d="M11.5 2.5a1.5 1.5 0 0 1 2 2L5 13l-3 1 1-3 8.5-8.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold tracking-wide text-muted uppercase">{label}</span>
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
