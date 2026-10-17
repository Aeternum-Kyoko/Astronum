"use client";

import { useEffect, useRef } from "react";
import { VARGA_KEYS, type VargaKey } from "@/lib/astrology/constants";
import { vargaInfo } from "@/lib/astrology/content";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { pick } from "@/lib/i18n/ui";

export default function ChartPicker({ value, onChange, label, transit = false }: {
  value: VargaKey | "transit";
  onChange: (value: VargaKey | "transit") => void;
  label: string;
  transit?: boolean;
}) {
  const locale = useLocale();
  const L = pick(locale);
  const rail = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = rail.current;
    const active = container?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!container || !active) return;
    container.scrollTo({ left: active.offsetLeft - container.offsetLeft - (container.clientWidth - active.clientWidth) / 2, behavior: "instant" });
  }, [value]);
  return <fieldset className="chart-picker">
    <legend>{label}</legend>
    <div ref={rail} className="chart-picker-grid">{VARGA_KEYS.map(key => {
      const info = vargaInfo(key, locale);
      return <button type="button" key={key} aria-pressed={value === key} title={info.blurb} onClick={() => onChange(key)}>
        <strong>{key}</strong><span>{info.title}</span>
      </button>;
    })}{transit && <button type="button" aria-pressed={value === "transit"} onClick={() => onChange("transit")}><strong>◉</strong><span>{L("Transits", "गोचर")}</span></button>}</div>
  </fieldset>;
}

export function ChartStyleButtons({ value, onChange }: { value: "north" | "south"; onChange: (value: "north" | "south") => void }) {
  const L = pick(useLocale());
  return <div className="chart-style-buttons" role="group" aria-label={L("Chart style", "कुंडली शैली")}>
    <button type="button" aria-pressed={value === "north"} onClick={() => onChange("north")}><span aria-hidden="true">◇</span> {L("North Indian", "उत्तर भारतीय")}</button>
    <button type="button" aria-pressed={value === "south"} onClick={() => onChange("south")}><span aria-hidden="true">▦</span> {L("South Indian", "दक्षिण भारतीय")}</button>
  </div>;
}
