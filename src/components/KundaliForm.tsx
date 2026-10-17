"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import type { KundaliChart } from "@/lib/astrology/types";
import type { HeavySection, KundaliReport } from "@/lib/astrology/report";
import { fromBirthQuery, toBirthQuery, type BirthParams } from "@/lib/birthParams";
import KundaliResult, { TAB_SLUGS } from "@/components/KundaliResult";
import KundaliIntro from "@/components/KundaliIntro";
import DatePicker from "@/components/DatePicker";
import TimePicker from "@/components/TimePicker";
import PlaceInput, { type PlaceSuggestion } from "@/components/PlaceInput";
import ProfileChips from "@/components/ProfileChips";
import KundliHeader from "@/components/KundliHeader";
import KundliCalculation from "@/components/kundli/KundliCalculation";
import { listCharts, loadChart, saveChart, type StoredChart } from "@/lib/offlineCharts";
import { haptic } from "@/lib/haptics";
import { useLocale, useT } from "@/lib/i18n/LocaleContext";
import "@/components/kundli/entry.css";

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];
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
  const generation = useRef(0);
  const failedSections = useRef(new Set<HeavySection>());
  const [sectionError, setSectionError] = useState<string | null>(null);
  const [offlineFrom, setOfflineFrom] = useState<number | null>(null);

  // Keep the latest version (with any sections loaded since) on this device for offline use.
  useEffect(() => {
    if (chart && report && !offlineFrom) void saveChart(chart.input, chart, report);
  }, [chart, report, offlineFrom]);

  /** Fetch the heavy report sections a tab needs, once each, and merge them in. */
  async function loadSections(sections: HeavySection[]) {
    if (!chart) return;
    const epoch = generation.current;
    const missing = sections.filter((s) => !(report && s in report) && !pending.current.has(s) && !failedSections.current.has(s));
    if (!missing.length) return;
    missing.forEach((s) => pending.current.add(s));
    try {
      const res = await fetch("/api/kundali/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birth: chart.input, sections: missing, locale }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load the detailed readings.");
      if (generation.current === epoch) setReport((r) => (r ? { ...r, ...data.sections } : r));
    } catch {
      if (generation.current === epoch) {
        missing.forEach(s => failedSections.current.add(s));
        setSectionError(locale === "hi" ? "कुछ विस्तृत व्याख्याएँ लोड नहीं हो सकीं। पुनः प्रयास करें।" : "Some detailed readings could not load. You can retry them.");
      }
    } finally {
      if (generation.current === epoch) missing.forEach((s) => pending.current.delete(s));
    }
  }
  const anchorRef = useRef<HTMLDivElement>(null);
  const autoLoaded = useRef(false);
  // Home-page tool tiles link to e.g. /kundali?tab=dashas; open the result on that section.
  const [initialTab, setInitialTab] = useState(() => searchParams.get("tab"));

  const view: View = loading ? "loading" : chart ? "result" : "form";

  useEffect(() => {
    if (view === "form") return;
    anchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [view]);

  async function generate(params: BirthParams) {
    const epoch = ++generation.current;
    pending.current.clear(); failedSections.current.clear(); setSectionError(null);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/kundali", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...params, locale }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("Something went wrong"));

      if (generation.current !== epoch) return;
      const nextQuery = new URLSearchParams(toBirthQuery(params));
      const currentQuery = new URLSearchParams(window.location.search);
      const selectedTab = currentQuery.get("tab");
      for (const key of ["analysisDate", "analysisTime", "chartA", "chartB", "overlay", "compare"]) {
        const value = currentQuery.get(key);
        if (value !== null) nextQuery.set(key, value);
      }
      if (selectedTab && TAB_SLUGS[selectedTab]) nextQuery.set("tab", selectedTab);
      setInitialTab(selectedTab && TAB_SLUGS[selectedTab] ? selectedTab : null);
      setChart(data.chart);
      setReport(data.report);
      setOfflineFrom(null);
      haptic("success");
      // Reflect the chart in the URL so it can be bookmarked or shared.
      router.replace(`${locale === "hi" ? "/hi" : ""}/kundali?${nextQuery.toString()}`, { scroll: false });
    } catch (err) {
      // No connection: open the copy kept on this device, if there is one.
      const stored = err instanceof TypeError ? await loadChart(params) : null;
      if (generation.current !== epoch) return;
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
      if (generation.current === epoch) setLoading(false);
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
            transition={{ duration: 0.15, ease: EASE_OUT_EXPO }}
            className="kundli-entry-shell"
          >
            <KundaliIntro />
            <div className="kundli-entry-form-wrap">
              <form
                onSubmit={handleSubmit}
                className="kundli-entry-form card-edge rounded-3xl p-7 md:p-10"
              >
                <div className="kundli-entry-form-heading"><h2>{locale === "hi" ? "जन्म विवरण" : "Birth details"}</h2><p>{locale === "hi" ? "अपनी कुंडली बनाने के लिए ये चार विवरण भरें।" : "Enter these four details to create your chart."}</p></div>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label={t("Name")}>
                    <input
                      required
                      value={name}
                      aria-label={t("Name")}
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
                        <TimePicker value={time.slice(0,5)} onChange={v=>setTime(v && time.length>5 ? `${v}:${time.slice(6)}` : v)} />
                        <label className="mt-2 block text-xs text-muted">{locale === "hi" ? "सेकंड (वैकल्पिक, केवल दर्ज होने पर)" : "Seconds (optional, only if recorded)"}<input type="number" min={0} max={59} step={1} className="input mt-1 max-w-24" disabled={!time} value={time.length>5?Number(time.slice(6)):""} onChange={e=>{const seconds=e.target.value;setTime(seconds===""?time.slice(0,5):`${time.slice(0,5)}:${String(Math.min(59,Math.max(0,Math.trunc(Number(seconds))))).padStart(2,"0")}`);}} /></label>
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
                  className="kundli-entry-submit mt-8 flex w-full items-center justify-center gap-2.5 rounded-full px-6 py-4 text-base font-semibold md:w-auto md:px-9"
                >
                  {t("Generate Kundali")}
                </button>
              </form>
            </div>
            <div className="mt-10">
              <ProfileChips onPick={(p) => void generate({ name: p.name, date: p.date, time: p.time, place: p.place, latitude: p.latitude, longitude: p.longitude, timezone: p.timezone })} />
              <RecentCharts onPick={(input) => void generate(input)} />
            </div>
          </motion.div>
        )}

        {view === "loading" && (
          <motion.div
            key="loading"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.15, ease: EASE_OUT_EXPO }}
            className="mx-auto max-w-4xl"
          >
            <KundliCalculation name={name} date={date} time={time} place={selectedPlace?.displayName ?? ""} />
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
            {sectionError && <p role="alert" className="mb-5 rounded-xl border border-rose/30 p-4 text-sm text-cream">{sectionError} <button type="button" className="ml-2 font-semibold text-gold-bright underline" onClick={() => { const retry = [...failedSections.current]; failedSections.current.clear(); setSectionError(null); void loadSections(retry); }}>{locale === "hi" ? "पुनः प्रयास" : "Retry readings"}</button></p>}
            <KundaliResult chart={chart} report={report} initialTab={initialTab} loadSections={loadSections} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="block">
      <span className="mb-2 block text-sm font-medium text-muted">{label}</span>
      {children}
    </div>
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
