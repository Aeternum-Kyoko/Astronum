"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import type { KundaliChart } from "@/lib/astrology/types";
import type { HeavySection, KundaliReport } from "@/lib/astrology/report";
import { fromBirthQuery, toBirthQuery, type BirthParams } from "@/lib/birthParams";
import KundaliResult from "@/components/KundaliResult";
import KundaliIntro from "@/components/KundaliIntro";
import DatePicker from "@/components/DatePicker";
import TimePicker from "@/components/TimePicker";
import PlaceInput, { type PlaceSuggestion } from "@/components/PlaceInput";
import ProfileChips from "@/components/ProfileChips";
import KundliHeader from "@/components/KundliHeader";
import { listCharts, loadChart, saveChart, type StoredChart } from "@/lib/offlineCharts";
import { haptic } from "@/lib/haptics";
import { useLocale, useT } from "@/lib/i18n/LocaleContext";

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
  const locale = useLocale();
  const t = useT();
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
  const pending = useRef(new Set<HeavySection>());
  const [offlineFrom, setOfflineFrom] = useState<number | null>(null);

  // Keep the latest version (with any sections loaded since) on this device for offline use.
  useEffect(() => {
    if (chart && report && !offlineFrom) void saveChart(chart.input, chart, report);
  }, [chart, report, offlineFrom]);

  /** Fetch the heavy report sections a tab needs, once each, and merge them in. */
  async function loadSections(sections: HeavySection[]) {
    if (!chart) return;
    const missing = sections.filter((s) => !(report && s in report) && !pending.current.has(s));
    if (!missing.length) return;
    missing.forEach((s) => pending.current.add(s));
    try {
      const res = await fetch("/api/kundali/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birth: chart.input, sections: missing, locale }),
      });
      const data = await res.json();
      if (res.ok) setReport((r) => (r ? { ...r, ...data.sections } : r));
    } finally {
      missing.forEach((s) => pending.current.delete(s));
    }
  }
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
        body: JSON.stringify({ ...params, locale }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("Something went wrong"));

      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_LOADING_MS) {
        await new Promise((r) => setTimeout(r, MIN_LOADING_MS - elapsed));
      }
      setChart(data.chart);
      setReport(data.report);
      setOfflineFrom(null);
      haptic("success");
      // Reflect the chart in the URL so it can be bookmarked or shared.
      router.replace(`${locale === "hi" ? "/hi" : ""}/kundali?${toBirthQuery(params)}`, { scroll: false });
    } catch (err) {
      // No connection: open the copy kept on this device, if there is one.
      const stored = err instanceof TypeError ? await loadChart(params) : null;
      if (stored) {
        setChart(stored.chart);
        setReport(stored.report);
        setOfflineFrom(stored.savedAt);
        haptic("warning");
      } else {
        setError(err instanceof TypeError ? t("You're offline, and this kundli isn't saved on this device yet.") : err instanceof Error ? err.message : t("Something went wrong"));
        haptic("error");
      }
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
      setError(t("Please fill in your name, birth date, time, and select a birth place from the list."));
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
              <RecentCharts onPick={(input) => void generate(input)} />
            </div>
            <div className="mt-8">
              <form
                onSubmit={handleSubmit}
                className="card-edge rounded-3xl p-7 shadow-[0_0_60px_rgba(212,175,106,0.06)] md:p-10"
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label={t("Name")}>
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("e.g. Asha Sharma")}
                      className="input"
                    />
                  </Field>

                  <div className="@container">
                    <div className="grid gap-5 @sm:grid-cols-2">
                      <Field label={t("Date of birth")}>
                        <DatePicker value={date} onChange={setDate} />
                      </Field>
                      <Field label={t("Time of birth")}>
                        <TimePicker value={time} onChange={setTime} />
                      </Field>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <Field label={t("Place of birth")}>
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
                  {t("Generate Kundali")}
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
            <KundliHeader chart={chart} onEdit={editChart} />
            {offlineFrom && (
              <p role="status" className="mx-auto mt-6 max-w-2xl rounded-xl border border-gold/40 bg-gold/5 px-4 py-2.5 text-center text-sm text-cream">
                {t("You're offline — showing the copy saved on this device on")} {new Date(offlineFrom).toLocaleString(locale === "hi" ? "hi-IN" : undefined)}.
              </p>
            )}
            <KundaliResult chart={chart} report={report} initialTab={initialTab} loadSections={loadSections} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LoadingCard() {
  const t = useT();
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
      <p className="mt-7 font-display text-xl text-cream">{t("Calculating your kundli…")}</p>
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
            {t(label)}
          </li>
        ))}
      </ul>
    </div>
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

/** Kundlis opened on this device before — they open even offline. */
function RecentCharts({ onPick }: { onPick: (input: BirthParams) => void }) {
  const t = useT();
  const [recent, setRecent] = useState<StoredChart[]>([]);
  useEffect(() => {
    let alive = true;
    void listCharts().then((list) => alive && setRecent(list));
    return () => {
      alive = false;
    };
  }, []);
  if (!recent.length) return null;
  return (
    <div className="mt-5 text-center">
      <p className="text-xs font-semibold text-muted">{t("Recently opened on this device")}</p>
      <ul className="mt-2 flex flex-wrap justify-center gap-2">
        {recent.map((r) => (
          <li key={r.key}>
            <button type="button" onClick={() => onPick(r.input)} className="rounded-full border border-border px-4 py-2 text-sm text-cream hover:border-gold">
              {r.input.name} <span className="text-xs text-muted">· {r.input.date}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
