import type { Metadata } from "next";
import Link from "next/link";
import LearnPageHeader from "@/components/learn/LearnPageHeader";
import { PLANETS } from "@/lib/astrology/constants";
import { PLANET_REMEDIES } from "@/lib/astrology/remedies";

export const metadata: Metadata = {
  title: "Navaratna Gemstone Guide",
  description:
    "The nine Vedic gemstones (navaratna): which planet each strengthens, the metal, finger and day to wear it, substitutes, mantras and the rule for choosing one safely.",
};

export default function GemstonesPage() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-16 md:py-20">
      <LearnPageHeader
        eyebrow="Remedies"
        title="The Nine Gemstones"
        description="Each navaratna gem strengthens one planet. That is exactly why a gem should only be worn for a planet that works in your favour."
      />

      <div className="mt-10 rounded-2xl border border-gold/30 bg-gold/5 p-6">
        <h2 className="font-semibold text-cream">How to choose safely</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Classically, gemstones are worn for the lords of your Lagna (life stone), 5th house (lucky stone) and 9th
          house (fortune stone). A planet that rules the 6th, 8th or 12th house is strengthened for harm as well as
          good, so its gem is avoided unless it also rules the Lagna. Your{" "}
          <Link href="/kundali?tab=remedies" className="font-semibold text-gold-bright hover:text-gold">
            free kundli&apos;s Remedies tab
          </Link>{" "}
          applies this rule to your chart.
        </p>
      </div>

      <ul className="mt-8 grid gap-4 md:grid-cols-2">
        {PLANETS.map((planet) => {
          const r = PLANET_REMEDIES[planet];
          return (
            <li key={planet} id={planet} className="card-edge scroll-mt-24 rounded-2xl p-6">
              <p className="text-xs font-semibold text-gold-bright">{planet}</p>
              <h2 className="mt-1 text-xl font-bold text-cream">{r.gem}</h2>
              <dl className="mt-4 space-y-1.5 text-sm">
                {(
                  [
                    ["Metal", r.metal],
                    ["Finger", r.finger],
                    ["Day to wear", r.day],
                    ["Substitute", r.gemAlt],
                    ["Mantra", r.mantra],
                    ["Rudraksha", r.rudraksha],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k} className="flex gap-3">
                    <dt className="w-28 shrink-0 text-muted">{k}</dt>
                    <dd className="text-cream">{v}</dd>
                  </div>
                ))}
              </dl>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
