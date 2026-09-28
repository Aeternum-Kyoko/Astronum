"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import type { KundaliChart } from "@/lib/astrology/types";
import type { KundaliReport } from "@/lib/astrology/report";
import { fromBirthQuery, toBirthQuery, type BirthParams } from "@/lib/birthParams";
import KundaliResult from "@/components/KundaliResult";
import KundaliIntro from "@/components/KundaliIntro";
import DatePicker from "@/components/DatePicker";
import TimePicker from "@/components/TimePicker";
import PlaceInput, { type PlaceSuggestion } from "@/components/PlaceInput";
import CopyLinkButton from "@/components/CopyLinkButton";
import SaveChartButton from "@/components/SaveChartButton";
import ProfileChips from "@/components/ProfileChips";
import { haptic } from "@/lib/haptics";

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];
const MIN_LOADING_MS = 1600;

const LOADING_STEPS = [
  "Calculating planetary positions",
  "Building your 16 divisional charts",
  "Computing Ashtakavarga & Shadbala",
  "Mapping your Vimshottari Dasha",
];

type View = "form" | "loading" | "result";

export default function KundaliForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Opened from the home page form or a shared link: the URL carries the birth details.
  const [urlParams] = useState(() => fromBirthQuery(new URLSearchParams(searchParams.toString())));
  const [name, setName] = useState(urlParams?.name ?? "");
  const [date, setDate] = useState(urlParams?.date ?? "");
  const [time, setTime] = useState(urlParams?.time ?? "");
  const [selectedPlace, setSelectedPlace] = useState<PlaceSuggestion | null>(() =>
    urlParams
      ? {
          displayName: urlParams.place,
          latitude: urlParams.latitude,
          longitude: urlParams.longitude,
          timezone: urlParams.timezone,
        }
      : null
  );
  const [loading, setLoading] = useState(Boolean(urlParams));
  const [error, setError] = useState<string | null>(null);
  const [chart, setChart] = useState<KundaliChart | null>(null);
  const [report, setReport] = useState<KundaliReport | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const autoLoaded = useRef(false);
  // Home-page tool tiles link to e.g. /kundali?tab=dashas; open the result on that section.
  const [initialTab] = useState(() => searchParams.get("tab"));

  const view: View = loading ? "loading" : chart ? "result" : "form";

  useEffect(() => {
    if (view === "form") return;
    anchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [view]);

  async function generate(params: BirthParams) {
    setError(null);
    setLoading(true);
    const startedAt = Date.now();
    try {
      const res = await fetch("/api/kundali", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");

      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_LOADING_MS) {
        await new Promise((r) => setTimeout(r, MIN_LOADING_MS - elapsed));
      }
      setChart(data.chart);
      setReport(data.report);
      haptic("success");
      // Reflect the chart in the URL so it can be bookmarked or shared.
      router.replace(`/kundali?${toBirthQuery(params)}`, { scroll: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      haptic("error");
    } finally {
      setLoading(false);
    }
  }

  // Generate straight away for birth details that arrived in the URL.
  useEffect(() => {
    if (autoLoaded.current || !urlParams) return;
    autoLoaded.current = true;
    void generate(urlParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once for the URL present on arrival
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !date || !time || !selectedPlace) {
      setError("Please fill in your name, birth date, time, and select a birth place from the list.");
      return;
    }
    void generate({
      name,
      date,
      time,
      latitude: selectedPlace.latitude,
      longitude: selectedPlace.longitude,
      timezone: selectedPlace.timezone,
      place: selectedPlace.displayName,
    });
  }

  function editChart() {
    setChart(null);
    router.replace("/kundali", { scroll: false });
  }

  return (
    <div ref={anchorRef} className="scroll-mt-24">
      <AnimatePresence mode="wait">
        {view === "form" && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
            className="mx-auto max-w-4xl"
          >
            <KundaliIntro />
            <div className="mt-10">
              <ProfileChips onPick={(p) => void generate({ name: p.name, date: p.date, time: p.time, place: p.place, latitude: p.latitude, longitude: p.longitude, timezone: p.timezone })} />
            </div>
            <div className="mt-8">
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

                  <div className="md:col-span-2">
                    <Field label="Place of birth">
                      <PlaceInput selected={selectedPlace} onSelect={setSelectedPlace} />
                    </Field>
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
                  className="mt-8 flex w-full items-center justify-center gap-2.5 rounded-full bg-gold px-6 py-4 text-base font-semibold text-on-gold transition-transform hover:scale-[1.02] hover:bg-gold-bright md:w-auto md:px-9"
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
            className="mx-auto max-w-4xl"
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
            <ProfileHeader chart={chart} onEdit={editChart} />
            <KundaliResult chart={chart} report={report} initialTab={initialTab} />
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
              i <= step ? "text-gold-bright" : "text-muted"
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

function ProfileHeader({ chart, onEdit }: { chart: KundaliChart; onEdit: () => void }) {
  const { name, date, time, place } = chart.input;
  return (
    <div className="card-edge mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-bright to-gold font-display text-lg font-bold text-on-gold">
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
      <div className="flex flex-wrap gap-2">
        <SaveChartButton input={chart.input} />
        <CopyLinkButton />
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold text-cream transition-colors hover:border-gold hover:text-gold-bright"
        >
          <EditIcon />
          Edit Chart
        </button>
      </div>
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
      <span className="mb-2 block text-xs font-semibold text-muted">{label}</span>
      {children}
    </label>
  );
}
