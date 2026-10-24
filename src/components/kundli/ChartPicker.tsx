"use client";

import { useState } from "react";
import { VARGA_KEYS, type VargaKey } from "@/lib/astrology/constants";
import { vargaInfo } from "@/lib/astrology/content";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { pick } from "@/lib/i18n/ui";

const FREQUENT: VargaKey[] = ["D1", "D9", "D10", "D2", "D3"];

export default function ChartPicker({ value, onChange, label, transit = false, compact = false }: {
  value: VargaKey | "transit";
  onChange: (value: VargaKey | "transit") => void;
  label: string;
  transit?: boolean;
  compact?: boolean;
}) {
  const locale = useLocale();
  const L = pick(locale);
  const [expanded, setExpanded] = useState(false);
  const frequent = value !== "transit" && !FREQUENT.includes(value) ? [...FREQUENT, value] : FREQUENT;
  const other = VARGA_KEYS.filter(key => !frequent.includes(key));
  if (compact) return <label className="rebuilt-compact-picker"><span>{label}</span><select value={value} onChange={event => onChange(event.target.value as VargaKey | "transit")}>{VARGA_KEYS.map(key => <option key={key} value={key}>{key} · {vargaInfo(key,locale).title}</option>)}{transit && <option value="transit">{L("Transits", "गोचर")}</option>}</select></label>;
  const chartButton = (key: VargaKey) => {
    const info = vargaInfo(key, locale);
    return <button type="button" key={key} aria-pressed={value === key} title={info.blurb} onClick={() => onChange(key)}><strong>{key}</strong><span>{info.title}</span></button>;
  };
  return <div className="chart-picker" role="group" aria-label={label}>
    <div className="chart-picker-head"><span>{label}</span><button type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? L("Fewer charts", "कम कुंडलियाँ") : L(`All ${VARGA_KEYS.length} charts`, `सभी ${VARGA_KEYS.length} कुंडलियाँ`)}</button></div>
    <div className="chart-picker-grid">{frequent.map(chartButton)}{transit && <button type="button" aria-pressed={value === "transit"} onClick={() => onChange("transit")}><strong>◉</strong><span>{L("Transits", "गोचर")}</span></button>}</div>
    {expanded && <div className="chart-picker-more" aria-label={L("Other divisional charts", "अन्य वर्ग कुंडलियाँ")}>{other.map(chartButton)}</div>}
  </div>;
}

export function ChartStyleButtons({ value, onChange }: { value: "north" | "south"; onChange: (value: "north" | "south") => void }) {
  const L = pick(useLocale());
  return <div className="chart-style-buttons" role="group" aria-label={L("Chart style", "कुंडली शैली")}>
    <button type="button" aria-pressed={value === "north"} onClick={() => onChange("north")}><span aria-hidden="true">◇</span> {L("North Indian", "उत्तर भारतीय")}</button>
    <button type="button" aria-pressed={value === "south"} onClick={() => onChange("south")}><span aria-hidden="true">▦</span> {L("South Indian", "दक्षिण भारतीय")}</button>
  </div>;
}
