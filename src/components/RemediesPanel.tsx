import Link from "next/link";
import type { KundaliChart } from "@/lib/astrology/types";
import { computeRemedies, PLANET_REMEDIES } from "@/lib/astrology/remedies";

export default function RemediesPanel({ chart }: { chart: KundaliChart }) {
  const { stones, support, doshas } = computeRemedies(chart);

  return (
    <div className="space-y-6">
      <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted">
        Traditional upayas drawn from your chart. Mantra, charity and fasting are considered safe for any planet;
        gemstones are suggested only for the planets that rule your Lagna, 5th and 9th houses.
      </p>

      <section className="card-edge rounded-2xl p-6">
        <h3 className="text-xl font-bold tracking-tight text-cream">Gemstones for your chart</h3>
        {stones.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Your Lagna, 5th and 9th lords also rule difficult houses, so no gemstone is safely indicated — rely on the
            mantra and charity remedies below.
          </p>
        ) : (
          <ul className="mt-4 grid gap-4 md:grid-cols-3">
            {stones.map((s) => {
              const r = PLANET_REMEDIES[s.planet];
              return (
                <li key={s.kind} className="rounded-xl border border-gold/30 bg-gold/5 p-4">
                  <p className="text-xs font-semibold text-gold-bright">{s.kind}</p>
                  <p className="mt-1 text-lg font-semibold text-cream">{s.gem}</p>
                  <p className="text-xs text-muted">
                    For {s.planet}, lord of your {s.house === 1 ? "Lagna" : `${s.house}th house`}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{s.why}</p>
                  <dl className="mt-3 space-y-1 text-xs">
                    <Row k="Metal" v={r.metal} />
                    <Row k="Finger" v={r.finger} />
                    <Row k="Wear on" v={`${r.day} morning`} />
                    <Row k="Substitute" v={r.gemAlt} />
                  </dl>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-4 text-xs text-muted">
          Have a gemstone checked for quality and weight, and confirmed by an astrologer, before wearing it.
        </p>
      </section>

      <section className="card-edge rounded-2xl p-6">
        <h3 className="text-xl font-bold tracking-tight text-cream">Planets that need support</h3>
        {support.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No planet in your chart is weak, afflicted or running its period right now.</p>
        ) : (
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {support.map((s) => {
              const r = PLANET_REMEDIES[s.planet];
              return (
                <li key={s.planet} className="rounded-xl border border-border p-4">
                  <p className="text-lg font-semibold text-cream">{s.planet}</p>
                  <ul className="mt-1 text-xs text-rose/90">
                    {s.reasons.map((reason) => (
                      <li key={reason}>• {reason}</li>
                    ))}
                  </ul>
                  <dl className="mt-3 space-y-1.5 text-sm">
                    <Row k="Mantra" v={`${r.mantra} (108 times)`} />
                    <Row k="Day" v={r.day} />
                    <Row k="Worship" v={r.deity} />
                    <Row k="Charity" v={r.charity} />
                    <Row k="Rudraksha" v={r.rudraksha} />
                    <Row k="Gemstone" v={s.gemSuitable ? `${r.gem} — only after consulting an astrologer` : "Not advised for this chart"} />
                  </dl>
                  <p className="mt-3 text-xs leading-relaxed text-muted">{r.practice}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {doshas.length > 0 && (
        <section className="card-edge rounded-2xl p-6">
          <h3 className="text-xl font-bold tracking-tight text-cream">Dosha remedies</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {doshas.map((d) => (
              <div key={d.name} className="rounded-xl border border-border p-4">
                <p className="font-semibold text-cream">{d.name}</p>
                <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-muted">
                  {d.remedies.map((r) => (
                    <li key={r}>• {r}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-gold/30 bg-gold/5 p-6 text-center">
        <p className="text-sm leading-relaxed text-muted">
          Remedies are traditional spiritual practices, not a substitute for medical, legal or financial advice. For
          guidance specific to you — including which gemstone to wear and when — speak to an astrologer.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link href="/consultation" className="rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-on-gold hover:bg-gold-bright">
            Book a consultation
          </Link>
          <Link href="/learn/gemstones" className="rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-cream hover:border-gold hover:text-gold-bright">
            Gemstone guide
          </Link>
        </div>
      </section>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-24 shrink-0 text-muted">{k}</dt>
      <dd className="text-cream">{v}</dd>
    </div>
  );
}
