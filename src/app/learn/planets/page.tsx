import type { Metadata } from "next";
import PlanetsExplorer from "@/components/learn/PlanetsExplorer";

export const metadata: Metadata = {
  title: "The 9 Planets",
  description: "Nature, significations, dignity, natural friendships, and house-by-house meaning for every graha.",
};

export default function PlanetsLearnPage() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-16 md:py-20">
      <div className="text-center">
        <p className="text-sm font-medium tracking-[0.2em] text-gold-bright uppercase">Reference</p>
        <h1 className="mt-3 font-display text-3xl text-cream md:text-4xl">The 9 Planets</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          The nine grahas — nature, significations, classical dignity, and what each one means placed in every house.
        </p>
      </div>
      <div className="mt-12">
        <PlanetsExplorer />
      </div>
    </section>
  );
}
