import type { Metadata } from "next";
import DivisionalChartsExplorer from "@/components/learn/DivisionalChartsExplorer";

export const metadata: Metadata = {
  title: "The 16 Divisional Charts",
  description: "What every varga from D2 to D60 is used to examine, and how to read it alongside the main Rasi chart.",
};

export default function DivisionalChartsLearnPage() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-16 md:py-20">
      <div className="text-center">
        <p className="text-sm font-medium tracking-[0.2em] text-gold-bright uppercase">Reference</p>
        <h1 className="mt-3 font-display text-3xl text-cream md:text-4xl">The 16 Divisional Charts</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          The full classical Shodasavarga — what each varga is used to examine, beyond the main Rasi chart.
        </p>
      </div>
      <div className="mt-12">
        <DivisionalChartsExplorer />
      </div>
    </section>
  );
}
