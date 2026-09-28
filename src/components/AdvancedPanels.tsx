"use client";

import { useMemo, useState } from "react";
import KundliChart from "@/components/KundliChart";
import SegmentedControl from "@/components/SegmentedControl";
import { lalKitab } from "@/lib/astrology/lalKitab";
import { ghatakChakra, jaiminiTables, prastarashtakavarga, vimshopakaBala, VIMSHOPAKA_SCHEMES } from "@/lib/astrology/kundliTables";
import { ASHTAKAVARGA_PLANETS, SIGN_SANSKRIT, type AshtakavargaPlanet } from "@/lib/astrology/constants";
import type { KundaliChart } from "@/lib/astrology/types";

const ord = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
const VERDICT = { Good: "text-gold-bright", Mixed: "text-cream", Weak: "text-rose" } as const;

// ——— Lal Kitab ———————————————————————————————————————————————————

export function LalKitabPanel({ chart }: { chart: KundaliChart }) {
  const lk = useMemo(() => lalKitab(chart), [chart]);
  // Lal Kitab fixes Aries as the 1st house, so each house shows the sign of the same number.
  const points = chart.planets.map((p) => ({ planet: p.planet, house: p.house, signIndex: p.house - 1, retrograde: p.retrograde }));
  return (
    <div className="space-y-6">
      <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted">
        Lal Kitab reads planets by house alone, with Aries fixed as the 1st house. It is known for karmic debts (rin) and simple, inexpensive remedies (upay).
      </p>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <section className="card-edge rounded-2xl p-6">
          <h3 className="text-lg font-bold text-cream">Lal Kitab chart</h3>
          <div className="mt-4">
            <KundliChart ascendantSignIndex={0} planets={points} toggleId="lk-style" showLegend={false} />
          </div>
        </section>
        <section className="card-edge rounded-2xl p-6">
          <h3 className="text-lg font-bold text-cream">Karmic debts (rin)</h3>
          {lk.rins.length ? (
            <ul className="mt-3 space-y-3 text-sm">
              {lk.rins.map((r) => (
                <li key={r.name} className="rounded-xl border border-rose/40 bg-rose/5 p-4">
                  <span className="font-semibold text-rose">{r.name}</span>
                  <span className="block text-xs text-muted">Shown by {r.signs}</span>
                  <span className="mt-1 block text-muted">{r.cause}</span>
                  <span className="mt-1 block text-cream">Remedy: {r.remedy}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">No karmic debt is shown by this chart.</p>
          )}
          <h4 className="mt-5 text-xs font-semibold text-gold-bright">How to do Lal Kitab remedies</h4>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted">
            {lk.rules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>
      </div>
      <section className="card-edge rounded-2xl p-6">
        <h3 className="text-lg font-bold text-cream">Planet by planet</h3>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {lk.planets.map((p) => (
            <li key={p.planet} className="rounded-xl border border-border/70 p-4 text-sm">
              <p className="flex justify-between gap-2">
                <span className="font-semibold text-cream">
                  {p.planet} in the {ord(p.house)} house
                </span>
                <span className={`font-semibold ${VERDICT[p.verdict]}`}>{p.verdict}</span>
              </p>
              {p.status.length > 0 && <p className="text-xs text-gold-bright">{p.status.join(" · ")}</p>}
              <p className="mt-1 text-muted">{p.reading}</p>
              {p.remedies.length > 0 && (
                <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-cream">
                  {p.remedies.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// ——— Special tables ————————————————————————————————————————————————

export function SpecialTablesPanel({ chart }: { chart: KundaliChart }) {
  const j = useMemo(() => jaiminiTables(chart), [chart]);
  const v = useMemo(() => vimshopakaBala(chart), [chart]);
  const g = useMemo(() => ghatakChakra(chart), [chart]);
  const [target, setTarget] = useState<AshtakavargaPlanet>("Sun");
  const prastara = useMemo(() => prastarashtakavarga(chart, target), [chart, target]);
  const order = Array.from({ length: 12 }, (_, i) => (chart.ascendant.signIndex + i) % 12);

  return (
    <div className="space-y-6">
      <section className="card-edge overflow-x-auto rounded-2xl p-6">
        <h3 className="text-lg font-bold text-cream">Jaimini: Arudha padas</h3>
        <p className="mt-1 text-sm text-muted">The image of each house in the world — how its matters appear to others. Count from a house to its lord, then the same number again; it can&rsquo;t fall in the house itself or the 7th from it.</p>
        <table className="mt-3 w-full min-w-[36rem] text-left text-sm">
          <thead className="text-xs text-muted">
            <tr className="border-b border-border">
              <th className="py-2 pr-3">Pada</th>
              <th className="py-2 pr-3">Sign</th>
              <th className="py-2 pr-3">Your house</th>
              <th className="py-2">Planets there</th>
            </tr>
          </thead>
          <tbody>
            {j.padas.map((p) => (
              <tr key={p.house} className="border-b border-border/50 last:border-0">
                <td className="py-2 pr-3 text-cream">{p.name}</td>
                <td className="py-2 pr-3 text-muted">{p.sign}</td>
                <td className="py-2 pr-3 text-muted">{ord(p.houseFromLagna)}</td>
                <td className="py-2 text-muted">{p.planets.join(", ") || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm">
          <div className="rounded-xl border border-border/70 p-4">
            <p className="font-semibold text-gold-bright">Upapada (marriage) in {j.upapada.sign}</p>
            <p className="mt-1 text-muted">{j.upapada.note}</p>
          </div>
          <div className="rounded-xl border border-border/70 p-4">
            <p className="font-semibold text-gold-bright">
              Karakamsha in {j.karakamsha.sign} (Atmakaraka {j.karakamsha.atmakaraka})
            </p>
            <p className="mt-1 text-muted">{j.karakamsha.meaning}</p>
            {j.karakamsha.planetsInD9.length > 0 && <p className="mt-1 text-muted">Joined in the Navamsa by {j.karakamsha.planetsInD9.join(", ")}.</p>}
          </div>
        </div>
      </section>

      <section className="card-edge overflow-x-auto rounded-2xl p-6">
        <h3 className="text-lg font-bold text-cream">Vimshopaka bala</h3>
        <p className="mt-1 text-sm text-muted">Each planet&rsquo;s strength across the divisional charts, out of 20, in the four classical schemes.</p>
        <table className="mt-3 w-full min-w-[34rem] text-left text-sm">
          <thead className="text-xs text-muted">
            <tr className="border-b border-border">
              <th className="py-2 pr-3">Planet</th>
              {VIMSHOPAKA_SCHEMES.map((s) => (
                <th key={s} className="py-2 pr-3">
                  {s}
                </th>
              ))}
              <th className="py-2">Verdict</th>
            </tr>
          </thead>
          <tbody>
            {v.map((r) => (
              <tr key={r.planet} className="border-b border-border/50 last:border-0">
                <td className="py-2 pr-3 font-semibold text-cream">{r.planet}</td>
                {VIMSHOPAKA_SCHEMES.map((s) => (
                  <td key={s} className="font-tabular py-2 pr-3 text-muted">
                    {r.scores[s].toFixed(2)}
                  </td>
                ))}
                <td className={`py-2 font-semibold ${r.verdict.includes("trong") ? "text-gold-bright" : r.verdict === "Weak" ? "text-rose" : "text-cream"}`}>{r.verdict}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card-edge overflow-x-auto rounded-2xl p-6">
        <h3 className="text-lg font-bold text-cream">Prastarashtakavarga</h3>
        <p className="mt-1 text-sm text-muted">Which of the eight contributors gave a bindu in each sign of the chosen planet&rsquo;s Ashtakavarga. Signs run from your Lagna.</p>
        <div className="mt-4">
          <SegmentedControl layoutId="prastara-planet" value={target} onChange={setTarget} options={ASHTAKAVARGA_PLANETS.map((p) => ({ value: p, label: p }))} />
        </div>
        <table className="mt-4 w-full min-w-[44rem] text-center text-xs">
          <thead className="text-muted">
            <tr className="border-b border-border">
              <th className="py-2 pr-2 text-left">Contributor</th>
              {order.map((s) => (
                <th key={s} className="px-1 py-2 font-normal">
                  {SIGN_SANSKRIT[s].slice(0, 4)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {prastara.map((row) => (
              <tr key={row.contributor} className="border-b border-border/40">
                <td className="py-1.5 pr-2 text-left font-semibold text-cream">{row.contributor}</td>
                {order.map((s) => (
                  <td key={s} className={row.bindus[s] ? "text-gold-bright" : "text-border"} aria-label={row.bindus[s] ? "bindu" : "no bindu"}>
                    {row.bindus[s] ? "●" : "·"}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="py-2 pr-2 text-left font-semibold text-gold-bright">Total</td>
              {order.map((s) => (
                <td key={s} className="font-tabular py-2 font-semibold text-cream">
                  {prastara.filter((r) => r.bindus[s]).length}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </section>

      <section className="card-edge rounded-2xl p-6">
        <h3 className="text-lg font-bold text-cream">Ghatak chakra</h3>
        <p className="mt-1 text-sm text-muted">For your {g.moonSign} Moon, these moments are traditionally avoided for important beginnings, surgery and long journeys.</p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5 text-sm">
          {(
            [
              ["Ghatak rasi (Moon transit)", g.ghatakRasi],
              ["Month", g.month],
              ["Tithi", g.tithi],
              ["Weekday", g.weekday],
              ["Nakshatra", g.nakshatra],
              ["Yoga", g.yoga],
              ["Karana", g.karana],
              ["Prahar", String(g.prahar)],
              ["Lagna", g.lagna],
            ] as const
          ).map(([k, val]) => (
            <div key={k} className="rounded-xl border border-border/70 px-3 py-2">
              <dt className="text-xs text-muted">{k}</dt>
              <dd className="font-semibold text-rose">{val}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
