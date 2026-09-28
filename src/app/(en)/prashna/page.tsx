import type { Metadata } from "next";
import PrashnaTool from "@/components/PrashnaTool";

export const metadata: Metadata = {
  title: "Prashna Kundli — Ask a Question, No Birth Details Needed",
  description: "Horary astrology: the chart of the moment you ask answers the question. Judged by the KP cusp sub lord, the Lagna lord, the Moon and the ruling planets — with every reason shown.",
  alternates: { canonical: "/prashna" },
};

export default function PrashnaPage() {
  return (
    <section className="relative">
      <div className="relative mx-auto max-w-4xl px-5 py-14 md:py-20">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-gold-bright">Prashna · horary astrology</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-cream md:text-5xl">Ask a question, get an answer from this moment</h1>
          <p className="mt-4 text-base leading-relaxed text-muted">
            No birth time? Prashna casts a chart for the minute a sincere question is asked. It is judged mainly by the KP sub lord of the question&rsquo;s house, supported by the Lagna lord, the Moon and the ruling planets.
          </p>
        </header>
        <div className="mt-10">
          <PrashnaTool />
        </div>
        <section className="card-edge mt-10 rounded-2xl p-6 text-sm leading-relaxed text-muted">
          <h2 className="text-lg font-bold text-cream">How to ask well</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Ask one clear question you genuinely need answered — not a test.</li>
            <li>Don&rsquo;t ask the same question twice in a day; the first chart is the valid one.</li>
            <li>Use the place where you are when you ask, not your birth place.</li>
          </ul>
        </section>
      </div>
    </section>
  );
}
