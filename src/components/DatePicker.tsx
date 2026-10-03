"use client";

import { useLocale, useT } from "@/lib/i18n/LocaleContext";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const WEEKDAY_LABELS_HI = ["र", "सो", "मं", "बु", "गु", "शु", "श"];
const MONTH_NAMES_HI = ["जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"];
const MIN_YEAR = 1900;

function parseISO(value: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]) - 1, day: Number(m[3]) };
}

function toISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isRealDate(year: number, month: number, day: number): boolean {
  const d = new Date(year, month, day);
  return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
}

/** "DD/MM/YYYY" for display from an ISO value. */
function toDisplay(value: string): string {
  const p = parseISO(value);
  return p ? `${String(p.day).padStart(2, "0")}/${String(p.month + 1).padStart(2, "0")}/${p.year}` : "";
}

/** Formats typed digits progressively as DD/MM/YYYY; also accepts a pasted YYYY-MM-DD. */
function maskTyped(raw: string): string {
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(raw.trim());
  if (iso) return `${iso[3].padStart(2, "0")}/${iso[2].padStart(2, "0")}/${iso[1]}`;
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** ISO date from complete, valid DD/MM/YYYY text, else null. */
function parseTyped(text: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]) - 1;
  const year = Number(m[3]);
  const thisYear = new Date().getFullYear();
  if (year < MIN_YEAR || year > thisYear + 1 || !isRealDate(year, month, day)) return null;
  return toISO(year, month, day);
}

function CalendarGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="2.5" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1.5 6h13M4.5 1v3M11.5 1v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

/** A date field you can type into (DD/MM/YYYY) or fill from the calendar. The value is ISO YYYY-MM-DD. */
export default function DatePicker({
  value,
  onChange,
  placeholder = "DD/MM/YYYY",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const t = useT();
  const hi = useLocale() === "hi";
  const parsed = parseISO(value);
  const today = new Date();
  const [text, setText] = useState(toDisplay(value));
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(parsed?.year ?? today.getFullYear() - 25);
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? today.getMonth());
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep the text in step when the value is set from outside (a shared link, the calendar).
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    if (value && value !== parseTyped(text)) setText(toDisplay(value));
  }

  const complete = text.length === 10;
  const invalid = complete && !parseTyped(text);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function handleType(raw: string) {
    const masked = maskTyped(raw);
    setText(masked);
    const iso = parseTyped(masked);
    onChange(iso ?? "");
    if (iso) {
      const p = parseISO(iso)!;
      setViewYear(p.year);
      setViewMonth(p.month);
    }
  }

  function toggleOpen() {
    if (!open && parsed) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
    }
    setOpen((o) => !o);
  }

  const years = Array.from({ length: today.getFullYear() + 2 - MIN_YEAR }, (_, i) => today.getFullYear() + 1 - i);
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const gridStart = new Date(viewYear, viewMonth, 1 - firstWeekday);
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate(), inMonth: d.getMonth() === viewMonth };
  });

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="bday"
        value={text}
        onChange={(e) => handleType(e.target.value)}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        className={`input pr-11 font-tabular ${invalid ? "!border-rose" : ""}`}
      />
      <button
        type="button"
        onClick={toggleOpen}
        aria-label={t("Choose from calendar")}
        aria-expanded={open}
        className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-raised hover:text-gold-bright"
      >
        <CalendarGlyph />
      </button>
      {invalid && <p className="mt-1 text-xs text-rose">{t("Enter a real date as DD/MM/YYYY.")}</p>}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="card-glass shadow-floating absolute z-30 mt-2 w-72 rounded-2xl p-4"
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={t("Previous month")}
                onClick={() => (viewMonth === 0 ? (setViewMonth(11), setViewYear(viewYear - 1)) : setViewMonth(viewMonth - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-raised hover:text-cream"
              >
                ‹
              </button>
              <select value={viewMonth} onChange={(e) => setViewMonth(Number(e.target.value))} aria-label={t("Month")} className="input !py-1.5 flex-1 !px-2 !text-sm">
                {(hi ? MONTH_NAMES_HI : MONTH_NAMES).map((m, i) => (
                  <option key={m} value={i}>
                    {m}
                  </option>
                ))}
              </select>
              <select value={viewYear} onChange={(e) => setViewYear(Number(e.target.value))} aria-label={t("Year")} className="input !w-[5.5rem] !py-1.5 !px-2 !text-sm">
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <button
                type="button"
                aria-label={t("Next month")}
                onClick={() => (viewMonth === 11 ? (setViewMonth(0), setViewYear(viewYear + 1)) : setViewMonth(viewMonth + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-raised hover:text-cream"
              >
                ›
              </button>
            </div>

            <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] text-muted">
              {(hi ? WEEKDAY_LABELS_HI : WEEKDAY_LABELS).map((w) => (
                <div key={w}>{w}</div>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {cells.map((c, i) => {
                const isSelected = !!parsed && parsed.year === c.year && parsed.month === c.month && parsed.day === c.day;
                const isToday = c.year === today.getFullYear() && c.month === today.getMonth() && c.day === today.getDate();
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      const iso = toISO(c.year, c.month, c.day);
                      setText(toDisplay(iso));
                      onChange(iso);
                      setOpen(false);
                    }}
                    aria-label={new Date(c.year, c.month, c.day).toDateString()}
                    aria-pressed={isSelected}
                    className={`aspect-square rounded-lg text-xs transition-colors ${
                      isSelected ? "bg-gold font-semibold text-on-gold" : c.inMonth ? "text-cream hover:bg-surface-raised" : "text-muted/50 hover:bg-surface-raised/60"
                    } ${isToday && !isSelected ? "ring-1 ring-gold/60" : ""}`}
                  >
                    {c.day}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
