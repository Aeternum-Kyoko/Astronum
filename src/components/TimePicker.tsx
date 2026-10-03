"use client";

import { useLocale, useT } from "@/lib/i18n/LocaleContext";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

type Meridiem = "AM" | "PM";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTE_STEPS = Array.from({ length: 12 }, (_, i) => i * 5);

function parseValue(value: string): { hour12: number; minute: number; meridiem: Meridiem } | null {
  const m = /^(\d{2}):(\d{2})$/.exec(value);
  if (!m) return null;
  const h24 = Number(m[1]);
  return { hour12: h24 % 12 === 0 ? 12 : h24 % 12, minute: Number(m[2]), meridiem: h24 >= 12 ? "PM" : "AM" };
}

function toValue(hour12: number, minute: number, meridiem: Meridiem): string {
  const h24 = (hour12 % 12) + (meridiem === "PM" ? 12 : 0);
  return `${String(h24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** Formats typed digits progressively as HH:MM. */
function maskTyped(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

/**
 * Reads typed HH:MM. Hours 1–12 use the AM/PM toggle; 0 or 13–23 are read as
 * 24-hour time and set the toggle themselves. Returns null until complete and valid.
 */
function parseTyped(text: string, meridiem: Meridiem): { value: string; meridiem: Meridiem } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(text);
  if (!m) return null;
  const h = Number(m[1]);
  const minute = Number(m[2]);
  if (minute > 59 || h > 23) return null;
  if (h === 0 || h > 12) {
    const mer: Meridiem = h >= 12 ? "PM" : "AM";
    return { value: `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`, meridiem: mer };
  }
  return { value: toValue(h, minute, meridiem), meridiem };
}

function ClockGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

/** A time field you can type into (HH:MM, 12- or 24-hour) or fill from hour and minute grids. The value is 24-hour HH:mm. */
export default function TimePicker({
  value,
  onChange,
  placeholder = "HH:MM",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const t = useT();
  const parsed = parseValue(value);
  const [meridiem, setMeridiem] = useState<Meridiem>(parsed?.meridiem ?? "AM");
  const [text, setText] = useState(parsed ? `${String(parsed.hour12).padStart(2, "0")}:${String(parsed.minute).padStart(2, "0")}` : "");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep the text in step when the value is set from outside (a shared link).
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    const p = parseValue(value);
    if (p && value !== parseTyped(text, meridiem)?.value) {
      setText(`${String(p.hour12).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`);
      setMeridiem(p.meridiem);
    }
  }

  const complete = /^\d{2}:\d{2}$/.test(text);
  const invalid = complete && !parseTyped(text, meridiem);

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

  function commit(nextText: string, nextMeridiem: Meridiem) {
    const result = parseTyped(nextText, nextMeridiem);
    if (result) {
      setMeridiem(result.meridiem);
      // Show 24-hour entries in 12-hour form once the toggle has taken over.
      const p = parseValue(result.value)!;
      if (Number(nextText.split(":")[0]) > 12 || nextText.startsWith("00")) {
        setText(`${String(p.hour12).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`);
      }
    }
    onChange(result?.value ?? "");
  }

  function pick(hour12: number, minute: number) {
    const t = `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    setText(t);
    onChange(toValue(hour12, minute, meridiem));
  }

  const current = parseValue(value);

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          value={text}
          onChange={(e) => {
            const t = maskTyped(e.target.value);
            setText(t);
            commit(t, meridiem);
          }}
          placeholder={placeholder}
          aria-invalid={invalid || undefined}
          className={`input !pr-[6.5rem] font-tabular ${invalid ? "!border-rose" : ""}`}
        />
        <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
          <div role="group" aria-label={t("AM or PM")} className="flex overflow-hidden rounded-lg border border-border text-[11px] font-semibold">
            {(["AM", "PM"] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={meridiem === m}
                onClick={() => {
                  setMeridiem(m);
                  commit(text, m);
                }}
                className={`px-1.5 py-1 transition-colors ${meridiem === m ? "bg-gold text-on-gold" : "text-muted hover:text-cream"}`}
              >
                {m}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={t("Choose hour and minute")}
            aria-expanded={open}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-raised hover:text-gold-bright"
          >
            <ClockGlyph />
          </button>
        </div>
      </div>
      {invalid && <p className="mt-1 text-xs text-rose">{t("Enter a time like 06:45.")}</p>}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="card-glass shadow-floating absolute right-0 z-30 mt-2 w-72 rounded-2xl p-4"
          >
            <p className="text-xs text-muted">{t("Hour")}</p>
            <div className="mt-1.5 grid grid-cols-6 gap-1">
              {HOURS.map((h) => (
                <button
                  key={h}
                  type="button"
                  aria-pressed={current?.hour12 === h}
                  onClick={() => pick(h, current?.minute ?? 0)}
                  className={`rounded-lg py-1.5 text-sm font-tabular transition-colors ${current?.hour12 === h ? "bg-gold font-semibold text-on-gold" : "text-cream hover:bg-surface-raised"}`}
                >
                  {h}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">{t("Minute")}</p>
            <div className="mt-1.5 grid grid-cols-6 gap-1">
              {MINUTE_STEPS.map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={current?.minute === m}
                  onClick={() => pick(current?.hour12 ?? 12, m)}
                  className={`rounded-lg py-1.5 text-sm font-tabular transition-colors ${current?.minute === m ? "bg-gold font-semibold text-on-gold" : "text-cream hover:bg-surface-raised"}`}
                >
                  {String(m).padStart(2, "0")}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">{t("For an exact minute, type it in the box — birth time matters to the minute.")}</p>
            <button type="button" onClick={() => setOpen(false)} className="mt-3 w-full rounded-full bg-gold py-2 text-sm font-semibold text-on-gold hover:bg-gold-bright">
              {t("Done")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
