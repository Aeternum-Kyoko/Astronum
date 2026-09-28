"use client";

import { useState } from "react";
import NorthIndianChart, { type ChartPick } from "@/components/NorthIndianChart";

export type { ChartPick };
import ChartGrid from "@/components/ChartGrid";
import SegmentedControl from "@/components/SegmentedControl";
import { MARKER_MEANING, type Marker } from "@/lib/astrology/chartMarkers";
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
  const [ownStyle, setOwnStyle] = useState<ChartStyle>("north");
  const style = controlledStyle ?? ownStyle;
  const setStyle = onStyleChange ?? setOwnStyle;
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
              { value: "north", label: "North Indian" },
              { value: "south", label: "South Indian" },
            ]}
          />
        </div>
      )}
      {style === "north" ? (
        <NorthIndianChart ascendantSignIndex={ascendantSignIndex} planets={planets} onPick={onPick} selected={selected} />
      ) : (
        <ChartGrid ascendantSignIndex={ascendantSignIndex} planets={planets} onPick={onPick} selected={selected} />
      )}
      {showLegend && used.length > 0 && (
        <ul className="mx-auto mt-4 flex max-w-md flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted" aria-label="Chart symbols">
          {used.map((m) => (
            <li key={m}>
              <span className={`mr-1 font-semibold ${m === "↓" || m === "C" || m === "R" ? "text-rose" : "text-gold-bright"}`}>{m}</span>
              {MARKER_MEANING[m]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
