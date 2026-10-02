import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import LoShuMaker from "@/components/LoShuMaker";

export const metadata: Metadata = {
  title: "Lo Shu Grid Maker — Detailed Lo Shu Grid Analysis from Date of Birth",
  description:
    "Make your Lo Shu grid from your date of birth, with Driver, Conductor and Kua numbers. Get a detailed reading of every number, repeated and missing numbers with remedies, the eight planes and Raj Yogas, and your lucky directions.",
  alternates: { canonical: "/lo-shu" },
};

export default function LoShuPage() {
  return (
    <section className="relative">
      <div className="relative mx-auto max-w-5xl px-5 py-14 md:py-20">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-gold-bright">Numerology · Lo Shu grid</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-cream md:text-5xl">Your Lo Shu grid, read in full</h1>
          <p className="mt-4 text-base leading-relaxed text-muted">
            The ancient 3×3 magic square where every row, column and diagonal adds to 15. Your birth date fills it — and the numbers
            you have, repeat or miss describe your strengths, your lessons and the simple remedies that balance them.
          </p>
        </header>
        <div className="mt-10">
          <Suspense>
            <LoShuMaker />
          </Suspense>
        </div>
        <section className="card-edge mt-10 rounded-2xl p-6 text-sm leading-relaxed text-muted">
          <h2 className="text-lg font-bold text-cream">How the grid is made</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Every non-zero digit of your date of birth is placed in its square (4 9 2 / 3 5 7 / 8 1 6).</li>
            <li>Your Driver number (day of birth) and Conductor number (whole date) are added, as Indian Lo Shu numerology does; with gender, so is your Kua number.</li>
            <li>Each square belongs to a planet, an element and a direction of the home — which is why missing numbers are balanced through those directions.</li>
          </ul>
          <p className="mt-4">
            For your Moolank, Bhagyank and name number, see the{" "}
            <Link href="/numerology" className="font-semibold text-gold-bright hover:text-gold">
              numerology calculator
            </Link>
            .
          </p>
        </section>
      </div>
    </section>
  );
}
