"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { DateTime } from "luxon";
import { useDeviceStore } from "@/lib/useDeviceStore";
import type { KundaliChart } from "@/lib/astrology/types";
import type { ChartPick, ChartStyle } from "../KundliChart";
import { currentTransits, type CurrentTransit } from "@/lib/astrology/transits";
import { VARGA_KEYS, type VargaKey } from "@/lib/astrology/constants";
import type { ReadingEvidence } from "@/lib/astrology/readingEvidence";

interface AnalysisState {
  date: string;
  time: string;
  style: ChartStyle;
  reference: "lagna" | "moon" | "chalit" | "lalkitab";
  primary: VargaKey;
  secondary: VargaKey | "transit";
  overlay: boolean;
  compare: boolean;
  filter: "all" | "slow" | "selected";
  selected: ChartPick | null;
}
interface Analysis extends AnalysisState {
  inspector: { open: boolean; side: "primary" | "secondary" };
  setInspector: (value: { open: boolean; side: "primary" | "secondary" }) => void;
  focusedEvidence: { evidence: ReadingEvidence; returnTab: string } | null;
  setFocusedEvidence: (value: { evidence: ReadingEvidence; returnTab: string } | null) => void;
  at: Date;
  transits: CurrentTransit[];
  today: string;
  zone: string;
  update: (patch: Partial<AnalysisState>) => void;
}
const Context = createContext<Analysis | null>(null);
export function AnalysisProvider({ chart, children }: { chart: KundaliChart; children: ReactNode }) {
  const [inspector, setInspector] = useState<{ open: boolean; side: "primary" | "secondary" }>({ open: false, side: "primary" });
  const [focusedEvidence, setFocusedEvidence] = useState<{ evidence: ReadingEvidence; returnTab: string } | null>(null);
  const today = DateTime.now().setZone(chart.input.timezone).toISODate()!;
  const initial = useMemo<AnalysisState>(() => ({ date: today, time: "12:00", style: "north", reference: "lagna", primary: "D1", secondary: "D9", overlay: false, compare: false, filter: "all", selected: null }), [today]);
  const key = `kundli-workspace:${chart.utcDate}:${chart.input.latitude}:${chart.input.longitude}`;
  const [stored, save] = useDeviceStore<AnalysisState>(key, initial);
  const state = useMemo(() => {
    const value = { ...initial, ...stored };
    if (typeof value.date !== "string" || typeof value.time !== "string" || !DateTime.fromISO(`${value.date}T${value.time}`, { zone: chart.input.timezone }).isValid) { value.date = today; value.time = "12:00"; }
    if (!VARGA_KEYS.includes(value.primary)) value.primary = "D1";
    if (value.secondary !== "transit" && !VARGA_KEYS.includes(value.secondary)) value.secondary = "D9";
    if (!["lagna", "moon", "chalit", "lalkitab"].includes(value.reference)) value.reference = "lagna";
    if (value.overlay) value.reference = "lagna";
    return value;
  }, [initial, stored, today, chart.input.timezone]);
  useEffect(() => {
    const restore = () => {
      const params = new URL(window.location.href).searchParams;
      if (!params.has("analysisDate") && !params.has("chartA") && params.get("tab") !== "transits") return;
      let base = initial;
      try { base = { ...initial, ...JSON.parse(localStorage.getItem(key) ?? "{}") }; } catch { /* use defaults */ }
      const date = params.get("analysisDate") ?? base.date;
      const time = params.get("analysisTime") ?? base.time;
      const next = { ...base };
      if (DateTime.fromISO(`${date}T${time}`, { zone: chart.input.timezone }).isValid) { next.date = date; next.time = time; }
      const primary = params.get("chartA") as VargaKey;
      const secondary = params.get("chartB") as VargaKey | "transit";
      if (VARGA_KEYS.includes(primary)) next.primary = primary;
      if (secondary === "transit" || VARGA_KEYS.includes(secondary)) next.secondary = secondary;
      if (params.has("overlay")) next.overlay = params.get("overlay") === "1";
      if (params.has("compare")) next.compare = params.get("compare") === "1";
      const section = params.get("tab");
      if (section === "rasi") { next.primary = "D1"; next.overlay = false; next.compare = false; }
      if (section === "navamsa") { next.primary = "D9"; next.overlay = false; next.compare = false; }
      if (section === "vargas") { if (next.primary === "D1" || next.primary === "D9") next.primary = "D10"; next.overlay = false; next.compare = false; }
      if (section === "transits") {
        next.primary = "D1"; next.overlay = false; next.compare = false; next.reference = "lagna"; next.filter = "all";
        if (!params.has("analysisDate")) { const now = DateTime.now().setZone(chart.input.timezone); next.date = now.toISODate()!; next.time = now.toFormat("HH:mm:ss"); }
      }
      if (next.overlay) next.reference = "lagna";
      save(next);
    };
    const onHistoryChange = () => { setFocusedEvidence(null); setInspector({ open: false, side: "primary" }); restore(); };
    restore(); window.addEventListener("popstate", onHistoryChange);
    return () => window.removeEventListener("popstate", onHistoryChange);
  }, [key, initial, chart.input.timezone, save]);
  const latest = useRef(state);
  useEffect(() => { latest.current = state; }, [state]);
  const date = state.date; const time = state.time;
  const at = useMemo(() => DateTime.fromISO(`${date}T${time}`, { zone: chart.input.timezone }).toJSDate(), [date, time, chart.input.timezone]);
  const moonSign = chart.planets.find(p => p.planet === "Moon")!.signIndex;
  const transits = useMemo(() => currentTransits(moonSign, chart.ascendant.signIndex, at), [moonSign, chart.ascendant.signIndex, at]);
  return <Context.Provider value={{ ...state, inspector, setInspector, focusedEvidence, setFocusedEvidence, at, transits, today, zone: chart.input.timezone, update: patch => {
    const next = { ...latest.current, ...patch }; latest.current = next; save(next);
    const url = new URL(window.location.href);
    url.searchParams.set("analysisDate", next.date); url.searchParams.set("analysisTime", next.time);
    url.searchParams.set("chartA", next.primary); url.searchParams.set("chartB", next.secondary);
    url.searchParams.set("overlay", next.overlay ? "1" : "0"); url.searchParams.set("compare", next.compare ? "1" : "0");
    window.history.replaceState(null, "", url);
  } }}>{children}</Context.Provider>;
}
export function useAnalysis() { return useContext(Context); }
