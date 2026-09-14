import type { KundaliChart } from "@/lib/astrology/types";
import { VARGA_KEYS, ASHTAKAVARGA_PLANETS } from "@/lib/astrology/constants";
import { VARGA_INFO, HOUSE_SIGNIFICATION } from "@/lib/astrology/content";
import { analyzeHouses, findConjunctions, type AnalyzablePlanet } from "@/lib/astrology/houseAnalysis";
import NorthIndianChart from "@/components/NorthIndianChart";

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function Section({ title, children, breakBefore = true }: { title: string; children: React.ReactNode; breakBefore?: boolean }) {
  return (
    <section className={`mt-10 ${breakBefore ? "break-before-page" : ""}`}>
      <h2 className="text-xl font-bold text-black">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function PlainTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <table className="w-full border-collapse text-xs text-black">
      <thead>
        <tr>
          {head.map((h) => (
            <th key={h} className="border border-gray-300 bg-gray-100 px-2 py-1 text-left">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j} className="border border-gray-300 px-2 py-1">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const MORE_VARGAS = VARGA_KEYS.filter((k) => k !== "D1" && k !== "D9");

function HouseAndConjunctionDetail({
  ascendantSignIndex,
  planets,
}: {
  ascendantSignIndex: number;
  planets: AnalyzablePlanet[];
}) {
  const houses = analyzeHouses(ascendantSignIndex, planets);
  const conjunctions = findConjunctions(ascendantSignIndex, planets);

  return (
    <div className="mt-5">
      <h3 className="text-sm font-semibold">House-by-House</h3>
      <ul className="mt-1 list-disc pl-5 text-xs leading-relaxed">
        {houses.map((h) => (
          <li key={h.house}>
            <span className="font-semibold">
              House {h.house} ({h.sign})
            </span>{" "}
            &mdash; {h.narrative}
          </li>
        ))}
      </ul>

      <h3 className="mt-4 text-sm font-semibold">Conjunctions</h3>
      {conjunctions.length === 0 ? (
        <p className="mt-1 text-xs text-gray-700">No two (or more) planets share a sign in this chart.</p>
      ) : (
        <ul className="mt-1 list-disc pl-5 text-xs leading-relaxed">
          {conjunctions.map((c, i) => (
            <li key={i}>
              <span className="font-semibold">{c.planets.join(" + ")}</span> &mdash; {c.narrative}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function PrintReport({ chart }: { chart: KundaliChart }) {
  return (
    <div className="bg-white p-8 text-black">
      <h1 className="text-2xl font-bold">{chart.input.name ? `${chart.input.name}'s` : "Your"} Kundli Report</h1>
      <p className="mt-2 text-sm">
        Born {formatDate(chart.utcDate)} &middot; {chart.input.place} &middot; Ascendant {chart.ascendant.sign}{" "}
        {chart.ascendant.degreeInSign.toFixed(2)}&deg; &middot; Ayanamsa {chart.ayanamsa.toFixed(2)}&deg;
      </p>

      <Section title="D1 &middot; Rasi Chart" breakBefore={false}>
        <div className="grid grid-cols-2 gap-6">
          <NorthIndianChart ascendantSignIndex={chart.ascendant.signIndex} planets={chart.planets} />
          <PlainTable
            head={["Planet", "Sign", "Degree", "House", "Nakshatra", "Dignity"]}
            rows={chart.planets.map((p) => [
              p.planet + (p.retrograde ? " (R)" : ""),
              p.sign,
              `${p.degreeInSign.toFixed(2)}°`,
              p.house,
              `${p.nakshatra} (${p.pada})`,
              p.dignity ?? "—",
            ])}
          />
        </div>
        <HouseAndConjunctionDetail ascendantSignIndex={chart.ascendant.signIndex} planets={chart.planets} />
      </Section>

      {MORE_VARGAS.length > 0 && (
        <Section title="D9 &middot; Navamsa">
          <div className="grid grid-cols-2 gap-6">
            <NorthIndianChart
              ascendantSignIndex={chart.divisionalCharts.D9.ascendant.signIndex}
              planets={chart.divisionalCharts.D9.planets}
            />
            <PlainTable
              head={["Planet", "Sign", "House"]}
              rows={chart.divisionalCharts.D9.planets.map((p) => [p.planet + (p.retrograde ? " (R)" : ""), p.sign, p.house])}
            />
          </div>
          <HouseAndConjunctionDetail
            ascendantSignIndex={chart.divisionalCharts.D9.ascendant.signIndex}
            planets={chart.divisionalCharts.D9.planets}
          />
        </Section>
      )}

      {MORE_VARGAS.map((key) => {
        const varga = chart.divisionalCharts[key];
        const info = VARGA_INFO[key];
        return (
          <Section key={key} title={`${key} · ${info.title}`}>
            <p className="text-xs text-gray-700">{info.blurb}</p>
            <div className="mt-3 grid grid-cols-2 gap-6">
              <NorthIndianChart ascendantSignIndex={varga.ascendant.signIndex} planets={varga.planets} />
              <PlainTable
                head={["Planet", "Sign", "House"]}
                rows={varga.planets.map((p) => [p.planet + (p.retrograde ? " (R)" : ""), p.sign, p.house])}
              />
            </div>
            <HouseAndConjunctionDetail ascendantSignIndex={varga.ascendant.signIndex} planets={varga.planets} />
          </Section>
        );
      })}

      <Section title="Ashtakavarga">
        <h3 className="text-sm font-semibold">Sarvashtakavarga (bindus per sign)</h3>
        <PlainTable head={chart.ashtakavarga.sarva.map((_, i) => `Sign ${i + 1}`)} rows={[chart.ashtakavarga.sarva]} />
        {ASHTAKAVARGA_PLANETS.map((planet) => (
          <div key={planet} className="mt-4">
            <h3 className="text-sm font-semibold">{planet} Bhinnashtakavarga</h3>
            <PlainTable
              head={chart.ashtakavarga.bhinna[planet].map((_, i) => `Sign ${i + 1}`)}
              rows={[chart.ashtakavarga.bhinna[planet]]}
            />
          </div>
        ))}
      </Section>

      <Section title="Shadbala (Planetary Strength)">
        <PlainTable
          head={["Planet", "Sthana", "Dig", "Kaala", "Chesta", "Naisargika", "Drik", "Rupas", "Required", "Verdict"]}
          rows={chart.shadbala.map((s) => [
            s.planet,
            s.sthanaBala.toFixed(1),
            s.digBala.toFixed(1),
            s.kaalaBala.toFixed(1),
            s.chestaBala.toFixed(1),
            s.naisargikaBala.toFixed(1),
            s.drikBala.toFixed(1),
            s.rupas.toFixed(2),
            s.requiredRupas,
            s.isStrong ? "Strong" : "Weak",
          ])}
        />
        <p className="mt-2 text-[10px] text-gray-600">
          Approximation: Kaala Bala includes only Nathonnata + Paksha; Chesta Bala is approximated from speed/retrograde state.
        </p>
      </Section>

      <Section title="Vimshottari Dasha">
        <PlainTable
          head={["Mahadasha", "Start", "End"]}
          rows={chart.dashas.map((d) => [d.lord, formatDate(d.start), formatDate(d.end)])}
        />
        {chart.currentDasha && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold">
              Current: {chart.currentDasha.lord} Mahadasha
              {chart.currentAntardasha && ` → ${chart.currentAntardasha.lord} Antardasha`}
              {chart.currentPratyantardasha && ` → ${chart.currentPratyantardasha.lord} Pratyantardasha`}
            </h3>
            <PlainTable
              head={["Antardasha", "Start", "End"]}
              rows={chart.antardashas.map((d) => [d.lord, formatDate(d.start), formatDate(d.end)])}
            />
          </div>
        )}
      </Section>

      <Section title="Yogas &amp; Doshas">
        <h3 className="text-sm font-semibold">Yogas</h3>
        <ul className="mt-1 list-disc pl-5 text-xs">
          {chart.yogas.map((y) => (
            <li key={y.name}>
              <span className="font-semibold">{y.name}</span> &mdash; {y.present ? "Present" : "Not present"}: {y.description}
            </li>
          ))}
        </ul>
        <h3 className="mt-4 text-sm font-semibold">Doshas</h3>
        <ul className="mt-1 list-disc pl-5 text-xs">
          {chart.doshas.map((d) => (
            <li key={d.name}>
              <span className="font-semibold">{d.name}</span> &mdash; {d.present ? "Present" : "Not present"}: {d.description}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="House Lords">
        <PlainTable
          head={["House", "Signifies", "Sign", "Lord", "Lord Placed In"]}
          rows={chart.houseLords.map((hl) => [
            hl.house,
            HOUSE_SIGNIFICATION[hl.house],
            hl.sign,
            hl.lord,
            `House ${hl.lordHouse} (${hl.lordSign})`,
          ])}
        />
      </Section>
    </div>
  );
}
