import type { Metadata } from "next";
import Link from "next/link";
import { DateTime } from "luxon";
import ToolShell, { birthFromParams } from "@/components/views/ToolShell";
import KundliChart from "@/components/KundliChart";
import { natalMarkers } from "@/lib/astrology/chartMarkers";
import { calculateKundali } from "@/lib/astrology/kundali";
import { computeVarshphal } from "@/lib/astrology/varshphal";
import { toBirthQuery } from "@/lib/birthParams";

export const metadata: Metadata = {
  title: "Varshphal — Your Annual Horoscope (Solar Return Chart)",
  description:
    "Your Tajik Varshphal: the annual chart cast for the moment the Sun returns to its birth position, with the year's ascendant, planet placements and Muntha.",
};

const ordinal = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;

export default async function VarshphalPage({ searchParams }: PageProps<"/varshphal">) {
  const params = await searchParams;
  const birth = birthFromParams(params);
  let body: React.ReactNode = null;

  if (birth) {
    const natal = calculateKundali(birth);
    const birthYear = Number(birth.date.slice(0, 4));
    const thisYear = DateTime.now().setZone(birth.timezone).year;
    const rawYear = typeof params.year === "string" ? Number(params.year) : thisYear;
    const year = Number.isInteger(rawYear) && rawYear > birthYear && rawYear <= birthYear + 110 ? rawYear : Math.max(thisYear, birthYear + 1);
    const v = computeVarshphal(birth, natal, year);
    const annualMarks = natalMarkers(v.chart);
    const yearHref = (y: number) => `/varshphal?${toBirthQuery(birth)}&year=${y}`;

    body = (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-cream">
            Varshphal {year}–{String(year + 1).slice(2)} <span className="text-base font-normal text-muted">(age {v.age})</span>
          </h2>
          <nav aria-label="Year" className="flex gap-2">
            {year - 1 > birthYear && (
              <Link href={yearHref(year - 1)} className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-cream hover:border-gold hover:text-gold-bright">
                ← {year - 1}
              </Link>
            )}
            <Link href={yearHref(year + 1)} className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-cream hover:border-gold hover:text-gold-bright">
              {year + 1} →
            </Link>
          </nav>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="card-edge rounded-2xl p-6">
            <h3 className="text-lg font-bold text-cream">Annual chart</h3>
            <p className="mt-1 text-xs text-muted">
              Varsha Pravesh (solar return): {DateTime.fromFormat(v.localReturn, "yyyy-LL-dd HH:mm").toFormat("d LLLL yyyy, h:mm a")} at {birth.place}
            </p>
            <div className="mt-4">
              <KundliChart ascendantSignIndex={v.chart.ascendant.signIndex} planets={v.chart.planets.map((p) => ({ ...p, markers: annualMarks[p.planet] }))} toggleId="varshphal-style" />
            </div>
          </section>
          <div className="space-y-6">
            <section className="card-edge rounded-2xl p-6">
              <h3 className="text-lg font-bold text-cream">Muntha</h3>
              <p className={`mt-2 text-sm font-semibold ${v.muntha.verdict === "Challenging" ? "text-rose" : "text-gold-bright"}`}>
                {v.muntha.sign} · {ordinal(v.muntha.house)} house · {v.muntha.verdict}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{v.muntha.text}</p>
              <p className="mt-2 text-xs text-muted">The Muntha starts at your natal Lagna ({natal.ascendant.sign}) and moves one sign each year.</p>
            </section>
            <section className="card-edge rounded-2xl p-6">
              <h3 className="text-lg font-bold text-cream">Year ascendant</h3>
              <p className="mt-2 text-sm text-muted">
                The year&rsquo;s Lagna is <span className="font-semibold text-gold-bright">{v.chart.ascendant.sign}</span> (natal Lagna {natal.ascendant.sign}). Its lord and
                the planets in the annual 1st, 10th and 11th houses set the year&rsquo;s tone.
              </p>
              <ul className="mt-3 space-y-1 text-sm">
                {v.chart.planets.filter((p) => [1, 10, 11].includes(p.house)).map((p) => (
                  <li key={p.planet} className="text-muted">
                    <span className="font-semibold text-cream">{p.planet}</span> in the annual {ordinal(p.house)} house ({p.sign})
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        <section className="card-edge overflow-x-auto rounded-2xl">
          <table className="w-full text-sm">
            <caption className="px-5 pt-5 text-left text-lg font-bold text-cream">Planets in the annual chart</caption>
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-5 py-3">Planet</th>
                <th className="px-5 py-3">Sign</th>
                <th className="px-5 py-3">Annual house</th>
                <th className="px-5 py-3">Natal house</th>
              </tr>
            </thead>
            <tbody>
              {v.chart.planets.map((p) => (
                <tr key={p.planet} className="border-b border-border/50 last:border-0">
                  <td className="px-5 py-2.5 font-medium text-cream">{p.planet}</td>
                  <td className="px-5 py-2.5 text-muted">
                    {p.sign} {p.degreeInSign.toFixed(1)}°
                  </td>
                  <td className="px-5 py-2.5 text-muted">{ordinal(p.house)}</td>
                  <td className="px-5 py-2.5 text-muted">{ordinal(natal.planets.find((n) => n.planet === p.planet)!.house)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    );
  }

  return (
    <ToolShell
      eyebrow="Varshphal"
      title="Your annual horoscope"
      intro="Each year's Tajik chart is cast for the moment the Sun returns to its exact birth position — a map of the year ahead, read alongside your natal chart."
      path="/varshphal"
      submit="See my Varshphal"
      birth={birth}
    >
      {body}
    </ToolShell>
  );
}
