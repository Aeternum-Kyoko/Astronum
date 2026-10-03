"use client";

import { useState, useSyncExternalStore } from "react";

const GLYPH_KEY = "astronum-chart-glyphs";
function readGlyphs(): boolean {
  try {
    return localStorage.getItem(GLYPH_KEY) === "1";
  } catch {
    return false;
  }
}
function setGlyphs(on: boolean) {
  try {
    localStorage.setItem(GLYPH_KEY, on ? "1" : "0");
  } catch {
    /* not persisted */
  }
  window.dispatchEvent(new Event("chart-glyphs"));
}
import NorthIndianChart, { type ChartPick } from "@/components/NorthIndianChart";

export type { ChartPick };
import ChartGrid from "@/components/ChartGrid";
import ZoomableChart from "@/components/ZoomableChart";
import SegmentedControl from "@/components/SegmentedControl";
import { MARKER_MEANING, type Marker } from "@/lib/astrology/chartMarkers";
import { markerText } from "@/lib/chartGeometry";
import { useLocale, useT } from "@/lib/i18n/LocaleContext";
import type { Dignity } from "@/lib/astrology/dignity";

export type ChartStyle = "north" | "south";

export interface ChartPoint {
  planet: string;
  /** House counted from the chart's reference sign (Lagna, Moon, bhava…) — used by the North Indian chart. */
  house: number;
  /** Sign the planet is drawn in on the South Indian chart. */
  signIndex: number;
  retrograde: boolean;
  markers?: string;
  dignity?: Dignity | null;
  sign?: string;
  degreeInSign?: number;
  nakshatra?: string;
}

/**
 * Any kundli chart in either style. North Indian is house-based and South
 * Indian sign-based, so each point carries both; charts whose houses don't
 * follow signs (Bhava Chalit, Lal Kitab) pass the sign that house represents.
 */
export default function KundliChart({
  ascendantSignIndex,
  planets,
  style: controlledStyle,
  onStyleChange,
  toggleId,
  showLegend = true,
  onPick,
  selected,
}: {
  ascendantSignIndex: number;
  planets: ChartPoint[];
  style?: ChartStyle;
  onStyleChange?: (s: ChartStyle) => void;
  /** Unique per chart on the page; shows a North/South toggle above an uncontrolled chart. */
  toggleId?: string;
  showLegend?: boolean;
  onPick?: (pick: ChartPick) => void;
  selected?: ChartPick | null;
}) {
  const locale = useLocale();
  const t = useT();
  const [ownStyle, setOwnStyle] = useState<ChartStyle>("north");
  const style = controlledStyle ?? ownStyle;
  const setStyle = onStyleChange ?? setOwnStyle;
  const glyphs = useSyncExternalStore(
    (cb) => {
      window.addEventListener("chart-glyphs", cb);
      return () => window.removeEventListener("chart-glyphs", cb);
    },
    readGlyphs,
    () => false
  );
  const used = [...new Set(planets.flatMap((p) => [...(p.markers ?? (p.retrograde ? "R" : ""))]))] as Marker[];

  return (
    <div>
      {toggleId && (
        <div className="mb-5 flex justify-center">
          <SegmentedControl
            layoutId={toggleId}
            value={style}
            onChange={setStyle}
            options={[
              { value: "north", label: t("North Indian") },
              { value: "south", label: t("South Indian") },
            ]}
          />
        </div>
      )}
      <div className="mx-auto max-w-md">
        <ZoomableChart>
          {style === "north" ? (
            <NorthIndianChart ascendantSignIndex={ascendantSignIndex} planets={planets} onPick={onPick} selected={selected} glyphs={glyphs} locale={locale} />
          ) : (
            <ChartGrid ascendantSignIndex={ascendantSignIndex} planets={planets} onPick={onPick} selected={selected} glyphs={glyphs} locale={locale} />
          )}
        </ZoomableChart>
      </div>
      <div className="mx-auto mt-4 flex max-w-md flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-muted">
        {showLegend && used.length > 0 && (
          <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1" aria-label={t("Chart symbols")}>
            {used.map((m) => (
              <li key={m}>
                <span className={`mr-1 font-semibold ${m === "↓" || m === "C" || m === "R" ? "text-rose" : "text-gold-bright"}`}>{markerText(m, locale)}</span>
                {t(MARKER_MEANING[m])}
              </li>
            ))}
          </ul>
        )}
        <button type="button" onClick={() => setGlyphs(!glyphs)} aria-pressed={glyphs} className="rounded-full px-2 py-0.5 text-xs text-muted underline decoration-border underline-offset-4 hover:text-cream">
          {glyphs ? t("Show names") : t("Show symbols")}
        </button>
      </div>
    </div>
  );
}
