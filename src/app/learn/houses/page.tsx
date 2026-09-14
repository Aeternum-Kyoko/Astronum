import type { Metadata } from "next";
import HousesExplorer from "@/components/learn/HousesExplorer";

export const metadata: Metadata = {
  title: "The 12 Houses",
  description: "What each bhava governs, its classical classification (Kendra/Trikona/Dushthana/Upachaya), and natural significator.",
};

export default function HousesLearnPage() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-16 md:py-20">
      <div className="text-center">
        <p className="text-sm font-medium tracking-[0.2em] text-gold-bright uppercase">Reference</p>
        <h1 className="mt-3 font-display text-3xl text-cream md:text-4xl">The 12 Houses</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          The twelve bhavas — what each one governs, how it&apos;s classified, and which planet naturally signifies it.
        </p>
      </div>
      <div className="mt-12">
        <HousesExplorer />
      </div>
    </section>
  );
}
