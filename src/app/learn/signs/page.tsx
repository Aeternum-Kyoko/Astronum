import type { Metadata } from "next";
import SignsExplorer from "@/components/learn/SignsExplorer";

export const metadata: Metadata = {
  title: "The 12 Signs",
  description: "Element, quality, ruling planet, body part, and character of every rashi from Aries to Pisces.",
};

export default function SignsLearnPage() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-16 md:py-20">
      <div className="text-center">
        <p className="text-sm font-medium tracking-[0.2em] text-gold-bright uppercase">Reference</p>
        <h1 className="mt-3 font-display text-3xl text-cream md:text-4xl">The 12 Signs</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          The twelve rashis — element, quality, ruling planet, and the character each one carries.
        </p>
      </div>
      <div className="mt-12">
        <SignsExplorer />
      </div>
    </section>
  );
}
