import type { Metadata } from "next";
import NakshatrasExplorer from "@/components/learn/NakshatrasExplorer";

export const metadata: Metadata = {
  title: "The 27 Nakshatras",
  description: "Ruling planet, deity, symbol, gana, and temperament of every lunar mansion from Ashwini to Revati.",
};

export default function NakshatrasLearnPage() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 md:py-20">
      <div className="text-center">
        <p className="text-sm font-medium tracking-[0.2em] text-gold-bright uppercase">Reference</p>
        <h1 className="mt-3 font-display text-3xl text-cream md:text-4xl">The 27 Nakshatras</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          The lunar mansions — ruling planet, deity, symbol, and temperament of each, in zodiac order.
        </p>
      </div>
      <div className="mt-12">
        <NakshatrasExplorer />
      </div>
    </section>
  );
}
