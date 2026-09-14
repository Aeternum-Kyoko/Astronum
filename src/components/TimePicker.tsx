"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const ROW_HEIGHT = 36;
const VISIBLE_ROWS = 5;
const PADDING = (ROW_HEIGHT * VISIBLE_ROWS - ROW_HEIGHT) / 2;

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
const MERIDIEMS = ["AM", "PM"];

function parseTime(value: string): { hour12: number; minute: number; meridiem: "AM" | "PM" } | null {
  const m = /^(\d{2}):(\d{2})$/.exec(value);
  if (!m) return null;
  const h24 = Number(m[1]);
  const minute = Number(m[2]);
  const meridiem: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
  let hour12 = h24 % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, minute, meridiem };
}

function toValue(hour12: number, minute: number, meridiem: "AM" | "PM"): string {
  let h24 = hour12 % 12;
  if (meridiem === "PM") h24 += 12;
  return `${String(h24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function ClockGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function WheelColumn({ items, index, onChange }: { items: string[]; index: number; onChange: (i: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const isProgrammatic = useRef(false);
  const hasMounted = useRef(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = index * ROW_HEIGHT;
    if (Math.abs(el.scrollTop - target) > 1) {
      isProgrammatic.current = true;
      el.scrollTo({ top: target, behavior: hasMounted.current ? "smooth" : "auto" });
      window.setTimeout(() => {
        isProgrammatic.current = false;
      }, 300);
    }
    hasMounted.current = true;
  }, [index]);

  function handleScroll() {
    if (isProgrammatic.current) return;
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const nearest = Math.max(0, Math.min(items.length - 1, Math.round(el.scrollTop / ROW_HEIGHT)));
      if (nearest !== index) onChange(nearest);
      else el.scrollTo({ top: nearest * ROW_HEIGHT, behavior: "smooth" });
    }, 120);
  }

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      className="scrollbar-none snap-y snap-mandatory overflow-y-scroll"
      style={{ height: ROW_HEIGHT * VISIBLE_ROWS, width: 56 }}
    >
      <div style={{ height: PADDING }} />
      {items.map((label, i) => (
        <button
          key={label}
          type="button"
          onClick={() => onChange(i)}
          className={`flex w-full snap-center items-center justify-center font-tabular text-base transition-colors ${
            i === index ? "font-semibold text-gold-bright" : "text-muted/60"
          }`}
          style={{ height: ROW_HEIGHT }}
        >
          {label}
        </button>
      ))}
      <div style={{ height: PADDING }} />
    </div>
  );
}

export default function TimePicker({
  value,
  onChange,
  placeholder = "Select a time",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const parsed = parseTime(value);
  const [open, setOpen] = useState(false);
  const [hour12, setHour12] = useState(parsed?.hour12 ?? 12);
  const [minute, setMinute] = useState(parsed?.minute ?? 0);
  const [meridiem, setMeridiem] = useState<"AM" | "PM">(parsed?.meridiem ?? "AM");
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
      const p = parseTime(value);
      if (p) {
        setHour12(p.hour12);
        setMinute(p.minute);
        setMeridiem(p.meridiem);
      }
    }
    setOpen((o) => !o);
  }

  const displayText = parsed ? `${parsed.hour12}:${String(parsed.minute).padStart(2, "0")} ${parsed.meridiem}` : "";

  return (
    <div className="relative" ref={containerRef}>
      <button type="button" onClick={toggleOpen} className="input input-icon relative flex items-center text-left">
        <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted">
          <ClockGlyph />
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
            className="card-glass shadow-floating absolute z-20 mt-2 rounded-2xl p-3"
          >
            <div className="relative flex justify-center">
              <div className="pointer-events-none absolute inset-x-1 top-1/2 h-9 -translate-y-1/2 rounded-lg border border-gold/30 bg-gold/10" />
              <WheelColumn
                items={HOURS}
                index={hour12 - 1}
                onChange={(i) => {
                  const h = i + 1;
                  setHour12(h);
                  onChange(toValue(h, minute, meridiem));
                }}
              />
              <div className="flex items-center text-lg text-muted" style={{ height: ROW_HEIGHT * VISIBLE_ROWS }}>
                :
              </div>
              <WheelColumn
                items={MINUTES}
                index={minute}
                onChange={(i) => {
                  setMinute(i);
                  onChange(toValue(hour12, i, meridiem));
                }}
              />
              <div style={{ width: 8 }} />
              <WheelColumn
                items={MERIDIEMS}
                index={meridiem === "AM" ? 0 : 1}
                onChange={(i) => {
                  const m: "AM" | "PM" = i === 0 ? "AM" : "PM";
                  setMeridiem(m);
                  onChange(toValue(hour12, minute, m));
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
