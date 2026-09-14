"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseISO(value: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]) - 1, day: Number(m[3]) };
}

function toISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function CalendarGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="2.5" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1.5 6h13M4.5 1v3M11.5 1v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export default function DatePicker({
  value,
  onChange,
  placeholder = "Select a date",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const parsed = parseISO(value);
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(parsed?.year ?? today.getFullYear() - 25);
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? today.getMonth());
  const containerRef = useRef<HTMLDivElement>(null);

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

  function toggleOpen() {
    if (!open) {
      const p = parseISO(value);
      if (p) {
        setViewYear(p.year);
        setViewMonth(p.month);
      }
    }
    setOpen((o) => !o);
  }

  const years = Array.from({ length: today.getFullYear() - 1919 }, (_, i) => today.getFullYear() - i);
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const gridStart = new Date(viewYear, viewMonth, 1 - firstWeekday);
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate(), inMonth: d.getMonth() === viewMonth };
  });

  const displayText = parsed
    ? new Date(parsed.year, parsed.month, parsed.day).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <div className="relative" ref={containerRef}>
      <button type="button" onClick={toggleOpen} className="input input-icon relative flex items-center text-left">
        <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted">
          <CalendarGlyph />
        </span>
        <span className={displayText ? "text-cream" : "text-muted opacity-60"}>{displayText || placeholder}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="card-glass shadow-floating absolute z-20 mt-2 w-72 rounded-2xl p-4"
          >
            <div className="flex gap-2">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="input !py-2 flex-1 !text-sm"
              >
                {MONTH_NAMES.map((m, i) => (
                  <option key={m} value={i}>
                    {m}
                  </option>
                ))}
              </select>
              <select value={viewYear} onChange={(e) => setViewYear(Number(e.target.value))} className="input !w-24 !py-2 !text-sm">
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] text-muted">
              {WEEKDAY_LABELS.map((w) => (
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
                      onChange(toISO(c.year, c.month, c.day));
                      setOpen(false);
                    }}
                    className={`aspect-square rounded-lg text-xs transition-colors ${
                      isSelected
                        ? "bg-gold font-semibold text-ink-deep"
                        : c.inMonth
                          ? "text-cream hover:bg-surface-raised"
                          : "text-muted/40 hover:bg-surface-raised/60"
                    } ${isToday && !isSelected ? "ring-1 ring-gold/50" : ""}`}
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
