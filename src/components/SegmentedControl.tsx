"use client";

import { motion } from "motion/react";

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  layoutId,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  /** Unique per control instance on the page — motion uses this to scope the sliding-pill animation to this one control. */
  layoutId: string;
}) {
  return (
    <div className="inline-flex flex-wrap justify-center gap-1 rounded-full border border-border bg-ink-deep/90 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className="relative rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap"
        >
          {value === opt.value && (
            <motion.span
              layoutId={layoutId}
              className="absolute inset-0 rounded-full bg-gold"
              transition={{ type: "spring", stiffness: 450, damping: 32 }}
            />
          )}
          <span className={`relative z-10 transition-colors ${value === opt.value ? "text-ink-deep" : "text-muted hover:text-cream"}`}>
            {opt.label}
          </span>
        </button>
      ))}
    </div>
  );
}
