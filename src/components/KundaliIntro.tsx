"use client";

import { motion } from "motion/react";

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

const FEATURES = [
  "North & South Indian styles",
  "16 divisional charts",
  "Ashtakavarga",
  "Shadbala",
  "3-level Vimshottari Dasha",
  "PDF report",
];

export default function KundaliIntro() {
  return (
    <div className="text-center">
      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
        className="text-xs font-semibold tracking-[0.3em] text-gold-bright uppercase"
      >
        Free Tool
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.08, ease: EASE_OUT_EXPO }}
        className="mt-5 text-5xl leading-[1.05] font-bold tracking-tight text-cream sm:text-6xl md:text-7xl"
      >
        Generate your <span className="text-gold-bright">kundali.</span>
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.18, ease: EASE_OUT_EXPO }}
        className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-muted"
      >
        Enter your exact birth date, time, and place for an accurate sidereal (Vedic) chart. Birth
        time matters — even a few minutes can shift your ascendant and houses.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.26, ease: EASE_OUT_EXPO }}
        className="mt-8 flex flex-wrap justify-center gap-2"
      >
        {FEATURES.map((f) => (
          <span
            key={f}
            className="rounded-full border border-border/80 bg-surface/60 px-3.5 py-1.5 text-xs text-muted"
          >
            {f}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
