"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "motion/react";
import NorthIndianChart from "@/components/NorthIndianChart";

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

const RASI_SAMPLE = [
  { planet: "Sun", house: 10, retrograde: false },
  { planet: "Moon", house: 6, retrograde: false },
  { planet: "Mars", house: 7, retrograde: false },
  { planet: "Mercury", house: 9, retrograde: false },
  { planet: "Jupiter", house: 10, retrograde: false },
  { planet: "Venus", house: 8, retrograde: false },
  { planet: "Saturn", house: 5, retrograde: true },
  { planet: "Rahu", house: 5, retrograde: true },
  { planet: "Ketu", house: 11, retrograde: true },
];

const NAVAMSA_SAMPLE = [
  { planet: "Sun", house: 2, retrograde: false },
  { planet: "Moon", house: 7, retrograde: false },
  { planet: "Mars", house: 4, retrograde: false },
  { planet: "Mercury", house: 8, retrograde: false },
  { planet: "Jupiter", house: 8, retrograde: false },
  { planet: "Venus", house: 3, retrograde: false },
  { planet: "Saturn", house: 5, retrograde: false },
  { planet: "Rahu", house: 9, retrograde: false },
  { planet: "Ketu", house: 3, retrograde: false },
];

const DASHA_SAMPLE = [
  { lord: "Rahu", years: 4, color: "var(--color-muted)" },
  { lord: "Jupiter", years: 16, color: "var(--color-muted)" },
  { lord: "Saturn", years: 19, color: "var(--color-muted)" },
  { lord: "Mercury", years: 17, active: true, color: "var(--color-gold-bright)" },
  { lord: "Ketu", years: 7, color: "var(--color-muted)" },
  { lord: "Venus", years: 20, color: "var(--color-muted)" },
];

const STEPS = [
  {
    eyebrow: "01 — Rasi Chart",
    title: "See every placement, instantly.",
    body: "Enter a birth date, time, and place. In seconds you get planetary positions, houses, nakshatras, and dignities — computed from real astronomical ephemeris data, not guesswork.",
  },
  {
    eyebrow: "02 — Navamsa (D9)",
    title: "Go deeper than the surface chart.",
    body: "The Navamsa divisional chart reveals what a planet's placement actually means for marriage, inner strength, and dharma — the layer most tools skip entirely.",
  },
  {
    eyebrow: "03 — Vimshottari Dasha",
    title: "Know exactly where you are, right now.",
    body: "Your current Mahadasha and Antardasha, mapped across a full 120-year cycle — so you understand not just who you are, but what this chapter of your life is for.",
  },
];

function DashaBars({ active }: { active: boolean }) {
  return (
    <div className="flex h-64 w-full max-w-sm items-end justify-center gap-2 px-4">
      {DASHA_SAMPLE.map((d, i) => (
        <motion.div
          key={d.lord}
          className="flex flex-1 flex-col items-center gap-2"
          initial={{ height: 0 }}
          animate={{ height: active ? `${(d.years / 20) * 100}%` : "6%" }}
          transition={{ duration: 0.7, delay: i * 0.05, ease: EASE_OUT_EXPO }}
        >
          <div
            className="w-full flex-1 rounded-t-md"
            style={{
              background: d.active
                ? "linear-gradient(180deg, var(--color-gold-bright), var(--color-gold))"
                : "var(--color-border)",
            }}
          />
          <span className={`text-[10px] ${d.active ? "text-gold-bright" : "text-muted"}`}>{d.lord}</span>
        </motion.div>
      ))}
    </div>
  );
}

function StepBlock({ step, index, onActive }: { step: (typeof STEPS)[number]; index: number; onActive: (i: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-45% 0px -45% 0px" });

  useEffect(() => {
    if (inView) onActive(index);
  }, [inView, index, onActive]);

  return (
    <div ref={ref} className="flex min-h-[70vh] flex-col justify-center py-16 md:min-h-screen">
      <Reveal step={step} active={inView} />
    </div>
  );
}

function Reveal({ step, active }: { step: (typeof STEPS)[number]; active: boolean }) {
  return (
    <motion.div
      animate={{ opacity: active ? 1 : 0.35 }}
      transition={{ duration: 0.5 }}
      className="max-w-md"
    >
      <p className="text-xs font-semibold tracking-[0.2em] text-gold-bright uppercase">{step.eyebrow}</p>
      <h3 className="mt-4 text-3xl leading-[1.1] font-bold tracking-tight text-cream md:text-4xl">{step.title}</h3>
      <p className="mt-5 text-base leading-relaxed text-muted">{step.body}</p>
    </motion.div>
  );
}

export default function StickyChartStory() {
  const [active, setActive] = useState(0);

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-2 md:gap-16">
      <div className="order-2 md:order-1">
        {STEPS.map((step, i) => (
          <StepBlock key={step.title} step={step} index={i} onActive={setActive} />
        ))}
      </div>

      <div className="relative order-1 md:sticky md:top-0 md:order-2 md:flex md:h-screen md:items-center md:justify-center">
        <div className="glow-blob glow-blob-gold h-[420px] w-[420px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-70" />
        <div className="card-edge relative flex h-[420px] w-full max-w-md items-center justify-center rounded-3xl py-8 shadow-[0_0_40px_rgba(212,175,106,0.08)]">
          <AnimatePresence mode="wait">
            {active === 0 && (
              <motion.div
                key="rasi"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
                className="w-full px-8"
              >
                <NorthIndianChart ascendantSignIndex={5} planets={RASI_SAMPLE} />
              </motion.div>
            )}
            {active === 1 && (
              <motion.div
                key="navamsa"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
                className="w-full px-8"
              >
                <NorthIndianChart ascendantSignIndex={5} planets={NAVAMSA_SAMPLE} />
              </motion.div>
            )}
            {active === 2 && (
              <motion.div
                key="dasha"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
              >
                <DashaBars active={active === 2} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
