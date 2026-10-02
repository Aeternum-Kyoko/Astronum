"use client";

import { useState } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import type { VargaKey } from "@/lib/astrology/constants";
import { VARGA_INFO } from "@/lib/astrology/content";
import type { KundaliChart } from "@/lib/astrology/types";
import { readConjunctions, readHouses, readPlanets, summarise, VARGA_SUBJECT, type VargaContext, type VargaPlanet, type Verdict } from "@/lib/astrology/vargaReading";

const VERDICT_COLOR: Record<Verdict, string> = {
  Strong: "text-gold-bright",
  Balanced: "text-cream",
  Weak: "text-rose",
};

export default function ChartDetail({
  vargaKey,
  ascendantSignIndex,
  planets,
  natal,
}: {
  vargaKey: VargaKey;
  ascendantSignIndex: number;
  planets: VargaPlanet[];
  /** The birth chart, to spot vargottama planets and place the relevant D1 house lord in this chart. */
  natal: KundaliChart;
}) {
  const [view, setView] = useState<"houses" | "planets">("houses");

  const ctx: VargaContext = {
    varga: vargaKey,
    ascendantSignIndex,
    planets,
    natalSigns: Object.fromEntries(natal.planets.map((p) => [p.planet, p.signIndex])),
    natalLords: natal.houseLords,
  };
  const summary = summarise(ctx);
  // The Hora uses only Cancer and Leo, so it is read by hora rather than house by house.
  const byHouse = vargaKey !== "D2";
  const houses = byHouse ? readHouses(ctx) : [];
  const planetReadings = byHouse ? readPlanets(ctx) : [];
  const conjunctions = byHouse ? readConjunctions(ctx) : [];
  const title = vargaKey === "D1" ? "your birth chart" : `the ${VARGA_INFO[vargaKey].title} (${vargaKey})`;

  return (
    <div className="mt-14 space-y-10">
      <section className="card-edge rounded-3xl p-6 md:p-7">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-semibold text-gold-bright">
            What {title} says about {VARGA_SUBJECT[vargaKey]}
          </p>
          <span className={`text-sm font-semibold ${VERDICT_COLOR[summary.verdict]}`}>{summary.verdict}</span>
        </div>
        <p className="mt-3 text-lg leading-relaxed text-cream">{summary.headline}</p>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted">
          {summary.points.map((p) => (
            <li key={p} className="flex gap-2">
              <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </section>

      {byHouse && (
        <>
          <div className="flex justify-center">
            <SegmentedControl
              layoutId="chart-detail-view"
              value={view}
              onChange={setView}
              options={[
                { value: "houses", label: "House Analysis" },
                { value: "planets", label: "Planet Analysis" },
              ]}
            />
          </div>

          {view === "houses" ? (
            <>
              <div>
                <h3 className="text-xl font-bold tracking-tight text-cream">House-by-House</h3>
                <p className="mt-2 text-sm text-muted">
                  Each house read in this chart&rsquo;s own subject: where its lord went, who sits in it and who aspects it.
                </p>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {houses.map((h) => (
                    <div key={h.house} className={`card-edge rounded-2xl p-5 ${h.key ? "ring-1 ring-gold/40" : ""}`}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-muted">
                          House {h.house} · {h.sign}
                          {h.key && <span className="ml-2 text-gold-bright">Key house</span>}
                        </p>
                        <span className={`text-xs font-semibold ${VERDICT_COLOR[h.verdict]}`}>{h.verdict}</span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-cream">{h.reading}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold tracking-tight text-cream">Conjunctions</h3>
                <p className="mt-2 text-sm text-muted">Planets sharing a sign blend their significations into one combined force.</p>
                {conjunctions.length === 0 ? (
                  <p className="mt-4 text-sm text-muted">No two (or more) planets share a sign in this chart.</p>
                ) : (
                  <div className="mt-5 space-y-4">
                    {conjunctions.map((c) => (
                      <div key={c.sign} className="card-edge rounded-2xl p-5">
                        <p className="text-xs font-semibold text-gold-bright">
                          {c.planets.join(" + ")} · {c.sign}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-cream">{c.reading}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div>
              <h3 className="text-xl font-bold tracking-tight text-cream">Planet-by-Planet</h3>
              <p className="mt-2 text-sm text-muted">
                What each planet means in this chart, and how well it can deliver it here — by its dignity in this chart, house, lordships and aspects.
              </p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {planetReadings.map((p) => (
                  <div key={p.planet} className="card-edge rounded-2xl p-5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-muted">
                        {p.planet} · House {p.house} · {p.sign}
                      </p>
                      <span className={`text-xs font-semibold ${VERDICT_COLOR[p.verdict]}`}>{p.verdict}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted">{p.basis}</p>
                    <p className="mt-2 text-sm leading-relaxed text-cream">{p.reading}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <p className="text-center text-xs text-muted">
        Verdicts weigh each planet&rsquo;s dignity in this chart, its house (with the classical upachaya and dusthana rules), its
        lordships, aspects and vargottama status. They are a guide, not the classical Shadbala or Bhava Bala figures.
      </p>
    </div>
  );
}
