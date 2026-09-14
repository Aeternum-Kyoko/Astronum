import type { Metadata } from "next";
import { DASHA_SEQUENCE, DASHA_YEARS } from "@/lib/astrology/constants";

export const metadata: Metadata = {
  title: "The Dasha System",
  description: "How Vimshottari Dasha works — the Moon's nakshatra, the 120-year cycle, and Mahadasha/Antardasha/Pratyantardasha.",
};

export default function DashaSystemLearnPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 md:py-20">
      <div className="text-center">
        <p className="text-sm font-medium tracking-[0.2em] text-gold-bright uppercase">Reference</p>
        <h1 className="mt-3 font-display text-3xl text-cream md:text-4xl">The Vimshottari Dasha System</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          The most widely used planetary period system in Vedic astrology — how it&apos;s built, and how this site
          computes it down to three levels.
        </p>
      </div>

      <div className="card-edge mt-12 space-y-6 rounded-3xl p-7 text-sm leading-relaxed text-cream md:p-9">
        <p>
          Vimshottari (&ldquo;120&rdquo;) Dasha divides a full 120-year cycle among the nine grahas, each ruling
          a fixed span of years in a set order:{" "}
          <span className="text-gold-bright">{DASHA_SEQUENCE.join(" → ")}</span>, which then repeats.
        </p>
        <p>
          The starting point isn&rsquo;t the birth date itself but the Moon&rsquo;s exact nakshatra at birth.
          Each of the 27 nakshatras is ruled by one of the nine dasha lords (in the same fixed order, cycling
          every 9 nakshatras), and how far the Moon has already moved through that nakshatra at birth determines
          how much of the first Mahadasha has already &ldquo;elapsed&rdquo; before the person was even born —
          which is why the very first period in anyone&rsquo;s dasha timeline is almost always a partial one.
        </p>
        <p>
          Three levels are computed here. A <span className="text-gold-bright">Mahadasha</span> is the major
          period, running anywhere from 6 to 20 years depending on the lord. Each Mahadasha is subdivided into
          nine <span className="text-gold-bright">Antardashas</span> (sub-periods), in the same nine-lord order
          starting with the Mahadasha lord itself, each spanning a share of the Mahadasha proportional to that
          lord&rsquo;s own years out of 120. Each Antardasha is further subdivided the same way into nine{" "}
          <span className="text-gold-bright">Pratyantardashas</span> — the finest level this site tracks.
        </p>
        <p>
          The self-similar proportional split is what makes the system tractable: a Jupiter Antardasha within a
          Saturn Mahadasha always gets the same fraction of that Mahadasha&rsquo;s length, and a Mercury
          Pratyantardasha within that Antardasha always gets the same fraction again — regardless of which
          Mahadasha it&apos;s nested in.
        </p>
      </div>

      <div className="card-edge mt-8 overflow-x-auto rounded-2xl">
        <table className="w-full text-sm font-tabular">
          <thead>
            <tr className="border-b border-border text-left text-xs tracking-wide text-muted uppercase">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Lord</th>
              <th className="px-4 py-3">Mahadasha Years</th>
            </tr>
          </thead>
          <tbody>
            {DASHA_SEQUENCE.map((lord, i) => (
              <tr key={lord} className="border-b border-border/50 last:border-0">
                <td className="px-4 py-3 text-muted">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-cream">{lord}</td>
                <td className="px-4 py-3 text-muted">{DASHA_YEARS[lord]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-center text-xs text-muted">
        The nine years sum to exactly 120 — the full Vimshottari cycle.
      </p>
    </section>
  );
}
