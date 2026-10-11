"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { pick } from "@/lib/i18n/ui";
import { term } from "@/lib/i18n/terms";
import SaveChartButton from "@/components/SaveChartButton";
import { toBirthQuery } from "@/lib/birthParams";
import type { KundaliChart } from "@/lib/astrology/types";

const dmsText = (deg: number) => `${Math.floor(deg)}°${String(Math.floor((deg % 1) * 60)).padStart(2, "0")}′`;

function formatDate(iso: string, locale: "en" | "hi") {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "long", year: "numeric" });
}
function formatTime(hhmm: string) {
  const [h, m, seconds] = hhmm.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")}${seconds === undefined ? "" : `:${String(seconds).padStart(2,"0")}`} ${h >= 12 ? "PM" : "AM"}`;
}

/**
 * The kundli's title block: the person's name as the page title, the facts
 * that define the chart beneath it, one primary action and a menu for the rest.
 */
export default function KundliHeader({ chart, onEdit }: { chart: KundaliChart; onEdit: () => void }) {
  const locale = useLocale(); const L = pick(locale);
  const { name, date, time, place } = chart.input;
  const moon = chart.planets.find((p) => p.planet === "Moon")!;
  return (
    <header className="mb-4 print:hidden">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-6">
        <div className="min-w-0">
          <h1 className="text-3xl leading-tight font-bold tracking-tight text-cream md:text-4xl">{name}</h1>
          <p className="mt-3 text-base text-muted md:text-lg">
            {formatDate(date,locale)} · {formatTime(time)}
            {place ? ` · ${place.split(",")[0]}` : ""}
          </p>
          <p className="font-tabular mt-1 text-sm text-muted">
            <span className="text-cream">{term(locale,chart.ascendant.sign)}</span> {L("Lagna","लग्न")} {dmsText(chart.ascendant.degreeInSign)} · {L("Moon in","चंद्र राशि")} <span className="text-cream">{term(locale,moon.sign)}</span> ({term(locale,moon.nakshatra)}) · Lahiri {chart.ayanamsa.toFixed(2)}°
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SaveChartButton input={chart.input} />
          <a href={`/api/kundali/pdf?${toBirthQuery(chart.input)}`} className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-on-gold transition-colors hover:bg-gold-bright">
            {L("Download PDF","PDF डाउनलोड करें")}
          </a>
          <ActionsMenu onEdit={onEdit} />
        </div>
      </div>
    </header>
  );
}

function ActionsMenu({ onEdit }: { onEdit: () => void }) {
  const L = pick(useLocale());
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* the address bar still has the link */
    }
  }
  const item = "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-cream hover:bg-surface-raised";
  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={L("More actions","अन्य विकल्प")}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-cream transition-colors hover:border-gold"
      >
        <svg width="16" height="4" viewBox="0 0 16 4" aria-hidden="true">
          <circle cx="2" cy="2" r="1.6" fill="currentColor" />
          <circle cx="8" cy="2" r="1.6" fill="currentColor" />
          <circle cx="14" cy="2" r="1.6" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <div className="card-glass shadow-floating absolute right-0 z-30 mt-2 w-52 rounded-2xl p-1.5">
          <button type="button" className={item} onClick={copy}>
            {copied ? L("Link copied","लिंक कॉपी हुआ") : L("Copy link","लिंक कॉपी करें")}
          </button>
          <button
            type="button"
            className={item}
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            {L("Edit birth details","जन्म विवरण बदलें")}
          </button>
          <button
            type="button"
            className={item}
            onClick={() => {
              setOpen(false);
              window.print();
            }}
          >
            {L("Print","प्रिंट करें")}
          </button>
        </div>
      )}
    </div>
  );
}
