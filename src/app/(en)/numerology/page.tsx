import type { Metadata } from "next";
import Link from "next/link";
import NumerologyCalculator from "@/components/NumerologyCalculator";

export const metadata: Metadata = {
  title: "Detailed Numerology Profile — Moolank, Bhagyank & Name Numbers",
  description:
    "Explore Indian Chaldean and Western Pythagorean numerology: Moolank, Bhagyank, name numbers, personal cycles, pinnacles and challenges with calculation details.",
};

export default function NumerologyPage() {
  return (
    <section className="relative">
      <div className="relative mx-auto max-w-5xl px-5 py-14 md:py-20">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-gold-bright">Numerology</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-cream md:text-5xl">A fuller reading of your numbers</h1>
          <p className="mt-4 text-base leading-relaxed text-muted">
            Compare Indian Chaldean and Western Pythagorean calculations, explore your name and birth numbers, and follow your personal cycles.
          </p>
        </header>
        <div className="mt-10">
          <NumerologyCalculator />
        </div>
        <p className="mt-10 text-center text-sm text-muted">
          Numerology is a quick lens; your{" "}
          <Link href="/kundali" className="font-semibold text-gold-bright hover:text-gold">
            birth chart
          </Link>{" "}
          gives the full picture.
        </p>
      </div>
    </section>
  );
}
