import Link from "next/link";
import type { DayTone } from "@/lib/astrology/horoscope";

export function Stars({ rating, size = "text-base", label }: { rating: number; size?: string; label: string }) {
  return (
    <span className={`${size} tracking-wider`} role="img" aria-label={label}>
      <span className="text-gold-bright">{"★".repeat(rating)}</span>
      <span className="text-border">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

const TONE_CLASS: Record<DayTone, string> = {
  Favourable: "border-gold/40 bg-gold/10 text-gold-bright",
  Mixed: "border-border bg-surface-raised text-cream",
  Challenging: "border-rose/40 bg-rose/10 text-rose",
};

export function ToneBadge({ tone, label }: { tone: DayTone; label: string }) {
  return <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${TONE_CLASS[tone]}`}>{label}</span>;
}

const DAYS = ["yesterday", "today", "tomorrow"] as const;
export type DayKey = (typeof DAYS)[number];

/** Yesterday / Today / Tomorrow switcher; `basePath` is the page the links point at. */
export type HoroscopeBy = "moon" | "sun";

/** `path` with the day and Moon/Sun-sign choice as a query string, leaving out the defaults. */
export function horoscopeHref(path: string, day: DayKey | null, by: HoroscopeBy): string {
  const q = new URLSearchParams();
  if (day && day !== "today") q.set("day", day);
  if (by === "sun") q.set("by", "sun");
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}

export function BySignToggle({ path, day, active, labels }: { path: string; day: DayKey | null; active: HoroscopeBy; labels: Record<HoroscopeBy, string> }) {
  return (
    <nav aria-label="Count houses from" className="inline-flex gap-1 rounded-full border border-border bg-ink-deep/80 p-1">
      {(["moon", "sun"] as const).map((b) => (
        <Link
          key={b}
          href={horoscopeHref(path, day, b)}
          aria-current={active === b ? "page" : undefined}
          scroll={false}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${active === b ? "bg-gold text-on-gold" : "text-muted hover:text-cream"}`}
        >
          {labels[b]}
        </Link>
      ))}
    </nav>
  );
}

export function DayTabs({ basePath, active, labels, by = "moon" }: { basePath: string; active: DayKey | null; labels: Record<DayKey, string>; by?: HoroscopeBy }) {
  return (
    <nav aria-label="Choose day" className="inline-flex gap-1 rounded-full border border-border bg-ink-deep/80 p-1">
      {DAYS.map((d) => (
        <Link
          key={d}
          href={horoscopeHref(basePath, d, by)}
          aria-current={active === d ? "page" : undefined}
          scroll={false}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
            active === d ? "bg-gold text-on-gold" : "text-muted hover:text-cream"
          }`}
        >
          {labels[d]}
        </Link>
      ))}
    </nav>
  );
}
