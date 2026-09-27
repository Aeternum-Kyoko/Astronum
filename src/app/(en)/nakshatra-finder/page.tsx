import type { Metadata } from "next";
import Link from "next/link";
import ToolShell, { birthFromParams } from "@/components/views/ToolShell";
import { calculateKundali } from "@/lib/astrology/kundali";
import { NAKSHATRA_REFERENCE } from "@/lib/astrology/reference/nakshatras";
import { NAMAKSHAR } from "@/lib/astrology/namakshar";
import { toBirthQuery } from "@/lib/birthParams";

export const metadata: Metadata = {
  title: "Nakshatra Finder — Your Birth Star, Pada & Name Letters",
  description:
    "Find your janma nakshatra (birth star) and pada, its ruling planet, deity, symbol and gana, and the traditional first letters for a name.",
};

export default async function NakshatraFinderPage({ searchParams }: PageProps<"/nakshatra-finder">) {
  const birth = birthFromParams(await searchParams);
  let body: React.ReactNode = null;

  if (birth) {
    const chart = calculateKundali(birth);
    const moon = chart.planets.find((p) => p.planet === "Moon")!;
    const ref = NAKSHATRA_REFERENCE[moon.nakshatraIndex];
    const syllables = NAMAKSHAR[moon.nakshatraIndex];
    const others = [
      { label: "Lagna nakshatra", index: Math.floor(chart.ascendant.siderealLongitude / (360 / 27)) },
      { label: "Sun nakshatra", index: chart.planets.find((p) => p.planet === "Sun")!.nakshatraIndex },
    ];

    body = (
      <div className="space-y-6">
        <section className="card-edge rounded-3xl p-7 text-center">
          <p className="text-xs font-semibold text-muted">Janma nakshatra (birth star)</p>
          <h2 className="mt-2 font-display text-5xl text-gold-bright">{moon.nakshatra}</h2>
          <p className="mt-2 text-sm text-muted">
            Pada {moon.pada} · Moon in {moon.sign} · lord {ref.rulingPlanet}
          </p>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-cream">{ref.keynote}</p>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="card-edge rounded-2xl p-6">
            <h2 className="text-lg font-bold text-cream">About your nakshatra</h2>
            <dl className="mt-3 divide-y divide-border/50 text-sm">
              {(
                [
                  ["Ruling planet", ref.rulingPlanet],
                  ["Deity", ref.deity],
                  ["Symbol", ref.symbol],
                  ["Gana", ref.gana],
                  ["Nature", ref.nature],
                  ["Span", ref.degreeSpan],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right font-medium text-cream">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="card-edge rounded-2xl p-6">
            <h2 className="text-lg font-bold text-cream">Name letters (namakshar)</h2>
            <p className="mt-1 text-xs text-muted">Traditionally a name begins with the syllable of the birth pada.</p>
            <ul className="mt-4 grid grid-cols-4 gap-2 text-center">
              {syllables.map((s, i) => (
                <li key={i} className={`rounded-xl border p-3 ${i + 1 === moon.pada ? "border-gold bg-gold/10" : "border-border/70"}`}>
                  <span className="block text-lg font-bold text-cream">{s}</span>
                  <span className="text-[11px] text-muted">Pada {i + 1}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted">
              Your pada is <span className="font-semibold text-gold-bright">{moon.pada}</span>, so the traditional first
              letter is <span className="font-semibold text-gold-bright">{syllables[moon.pada - 1]}</span>.
            </p>
          </section>
        </div>

        <section className="card-edge rounded-2xl p-6">
          <h2 className="text-lg font-bold text-cream">Your other nakshatras</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {others.map((o) => (
              <li key={o.label} className="rounded-xl border border-border/70 p-4 text-sm">
                <p className="text-xs text-muted">{o.label}</p>
                <p className="font-semibold text-cream">{NAKSHATRA_REFERENCE[o.index].name}</p>
                <p className="mt-1 text-xs text-muted">{NAKSHATRA_REFERENCE[o.index].keynote}</p>
              </li>
            ))}
          </ul>
          <Link href={`/kundali?${toBirthQuery(birth)}`} className="mt-5 inline-block text-sm font-semibold text-gold-bright hover:text-gold">
            See the full kundli
          </Link>
        </section>
      </div>
    );
  }

  return (
    <ToolShell
      eyebrow="Nakshatra finder"
      title="Find your birth nakshatra"
      intro="Your janma nakshatra is the lunar mansion the Moon occupied at birth — the basis of your dasha, matching and traditional name letters."
      path="/nakshatra-finder"
      submit="Find my nakshatra"
      birth={birth}
    >
      {body}
    </ToolShell>
  );
}
