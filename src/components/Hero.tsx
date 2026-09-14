"use client";

import Link from "next/link";
import { motion } from "motion/react";
import ZodiacWheel from "@/components/ZodiacWheel";
import Starfield from "@/components/Starfield";

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

const CREDIBILITY = ["16 divisional charts", "Ashtakavarga & Shadbala", "Real ephemeris, not approximation"];

export default function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-ink">
      <Starfield />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ink/30 to-ink" />
      <div className="glow-blob glow-blob-gold top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2" />

      <motion.div
        className="absolute top-1/2 left-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 opacity-[0.14]"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 240, repeat: Infinity, ease: "linear" }}
      >
        <ZodiacWheel className="h-full w-full" />
      </motion.div>

      <div className="relative mx-auto max-w-4xl px-5 text-center">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
          className="text-xs font-semibold tracking-[0.3em] text-gold-bright uppercase"
        >
          Vedic Astrology, Done Right
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: EASE_OUT_EXPO }}
          className="mt-6 text-5xl leading-[1.02] font-bold tracking-tight text-cream sm:text-6xl md:text-7xl lg:text-8xl"
        >
          Your birth chart.
          <br />
          <span className="text-gold-bright">Finally done right.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.25, ease: EASE_OUT_EXPO }}
          className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-muted md:text-xl"
        >
          Generate a precise Vedic kundali in seconds, then go as deep as you want —
          Navamsa, dashas, yogas, doshas — all in one place.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4, ease: EASE_OUT_EXPO }}
          className="mt-11 flex flex-wrap justify-center gap-4"
        >
          <Link
            href="/kundali"
            className="btn-shimmer rounded-full bg-gold px-8 py-4 text-base font-semibold text-ink-deep transition-transform hover:scale-[1.03] hover:bg-gold-bright"
          >
            Generate My Free Kundali
          </Link>
          <Link
            href="/consultation"
            className="rounded-full border border-border px-8 py-4 text-base font-medium text-cream transition-colors hover:border-gold hover:text-gold-bright"
          >
            Book a Personal Reading
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.55, ease: EASE_OUT_EXPO }}
          className="mt-10 flex flex-wrap justify-center gap-2.5"
        >
          {CREDIBILITY.map((item) => (
            <span
              key={item}
              className="rounded-full border border-border/80 bg-ink-deep/60 px-4 py-1.5 text-xs text-muted backdrop-blur-sm"
            >
              {item}
            </span>
          ))}
        </motion.div>
      </div>

      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-9 w-6 items-start justify-center rounded-full border border-border p-1.5"
        >
          <div className="h-1.5 w-1.5 rounded-full bg-gold-bright" />
        </motion.div>
      </motion.div>
    </section>
  );
}
