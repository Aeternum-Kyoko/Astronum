import Link from "next/link";
import type { MatchPartner, MatchResponse } from "@/lib/astrology/matching";

const VERDICT_TEXT: Record<MatchResponse["match"]["verdict"], string> = {
  "Not recommended":
    "Below the traditional 18-point threshold. Classically this match is not advised without a closer look at the full charts and possible remedies.",
  Average: "Above the 18-point threshold — an acceptable match by the traditional count, with some areas that need understanding.",
  Good: "A good match by the traditional count, with strong agreement across most of the eight kootas.",
  Excellent: "An excellent match by the traditional count — the kootas agree almost across the board.",
};

const MANGLIK_LABEL: Record<MatchPartner["mangalDosha"]["status"], string> = {
  present: "Manglik",
  cancelled: "Manglik (cancelled)",
  absent: "Not Manglik",
};

export default function MatchingResult({ result }: { result: MatchResponse }) {
  const { boy, girl, match, manglik } = result;
  const good = match.total >= 18;

  return (
    <div className="space-y-6">
      <section className="card-edge flex flex-col items-center gap-8 rounded-3xl p-7 text-center md:flex-row md:p-10 md:text-left">
        <ScoreRing score={match.total} max={match.max} good={good} />
        <div>
          <p className="text-sm font-semibold text-gold-bright">Ashtakoota Guna Milan</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-cream md:text-4xl">
            {boy.name} &amp; {girl.name}
          </h2>
          <p className={`mt-3 text-lg font-semibold ${good ? "text-gold-bright" : "text-rose"}`}>{match.verdict}</p>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{VERDICT_TEXT[match.verdict]}</p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <PartnerCard label="Boy" partner={boy} />
        <PartnerCard label="Girl" partner={girl} />
      </div>

      <section className="card-edge overflow-x-auto rounded-2xl">
        <table className="w-full text-sm">
          <caption className="px-5 pt-5 text-left">
            <span className="block text-lg font-bold text-cream">Koota breakdown</span>
            <span className="text-xs text-muted">Each koota scores a different area of the relationship; together they total 36.</span>
          </caption>
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="px-5 py-3">Koota</th>
              <th className="hidden px-3 py-3 sm:table-cell">Boy</th>
              <th className="hidden px-3 py-3 sm:table-cell">Girl</th>
              <th className="px-5 py-3 text-right">Points</th>
            </tr>
          </thead>
          <tbody>
            {match.kootas.map((k) => (
              <tr key={k.name} className="border-b border-border/50 align-top last:border-0">
                <td className="px-5 py-3.5">
                  <span className="block font-semibold text-cream">{k.name}</span>
                  <span className="block text-xs text-muted">{k.area}</span>
                  <span className="mt-1 block text-xs text-cream sm:hidden">
                    Boy: {k.boy} · Girl: {k.girl}
                  </span>
                  {k.note && (
                    <span className={`mt-1.5 block max-w-sm text-xs leading-relaxed ${k.score === 0 ? "text-rose/90" : "text-muted"}`}>
                      {k.note}
                    </span>
                  )}
                </td>
                <td className="hidden px-3 py-3.5 text-muted sm:table-cell">{k.boy}</td>
                <td className="hidden px-3 py-3.5 text-muted sm:table-cell">{k.girl}</td>
                <td className="px-5 py-3.5 text-right">
                  <span className={`font-tabular font-semibold ${k.score === 0 ? "text-rose" : "text-cream"}`}>
                    {k.score}
                  </span>
                  <span className="text-muted"> / {k.max}</span>
                  <span className="mt-2 ml-auto block h-1.5 w-20 overflow-hidden rounded-full bg-border/60">
                    <span
                      className={`block h-full rounded-full ${k.score === 0 ? "bg-rose/70" : "bg-gold"}`}
                      style={{ width: `${(k.score / k.max) * 100}%` }}
                    />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border">
              <td className="px-5 py-4 font-bold text-cream sm:hidden">Total</td>
              <td className="hidden px-5 py-4 font-bold text-cream sm:table-cell" colSpan={3}>
                Total
              </td>
              <td className="px-5 py-4 text-right font-tabular font-bold text-gold-bright">
                {match.total} / {match.max}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section className="card-edge rounded-2xl p-6">
        <h3 className="text-lg font-bold text-cream">Mangal Dosha</h3>
        <p className={`mt-2 text-sm font-semibold ${manglik.compatible ? "text-gold-bright" : "text-rose"}`}>
          {manglik.compatible ? "Compatible" : "Needs attention"}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">{manglik.summary}</p>
      </section>

      <section className="rounded-2xl border border-gold/30 bg-gold/5 p-6 text-center">
        <p className="text-sm leading-relaxed text-muted">
          Guna Milan compares only the two Moons. A full compatibility reading also weighs the 7th house, Venus,
          dashas and the whole of both charts.
        </p>
        <Link
          href="/consultation"
          className="mt-4 inline-block rounded-full bg-gold px-7 py-3 text-sm font-semibold text-on-gold transition-colors hover:bg-gold-bright"
        >
          Book a compatibility reading
        </Link>
      </section>
    </div>
  );
}

function ScoreRing({ score, max, good }: { score: number; max: number; good: boolean }) {
  const r = 52;
  const circumference = 2 * Math.PI * r;
  return (
    <div className="relative h-40 w-40 shrink-0" role="img" aria-label={`${score} out of ${max} points`}>
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--color-border)" strokeWidth="9" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={good ? "var(--color-gold)" : "var(--color-rose)"}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / max)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-tabular text-4xl font-bold text-cream">{score}</span>
        <span className="text-xs text-muted">out of {max}</span>
      </div>
    </div>
  );
}

function PartnerCard({ label, partner }: { label: string; partner: MatchPartner }) {
  const rows: [string, string][] = [
    ["Born", `${partner.date} · ${partner.time}`],
    ["Place", partner.place],
    ["Moon sign", partner.moonSign],
    ["Nakshatra", `${partner.nakshatra}, pada ${partner.pada}`],
    ["Ascendant", partner.ascendant],
    ["Mangal Dosha", MANGLIK_LABEL[partner.mangalDosha.status]],
  ];
  return (
    <section className="card-edge rounded-2xl p-5">
      <p className="text-xs font-semibold text-gold-bright">{label}</p>
      <p className="mt-1 font-display text-xl text-cream">{partner.name}</p>
      <dl className="mt-3 divide-y divide-border/50 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 py-2">
            <dt className="shrink-0 text-muted">{k}</dt>
            <dd className="text-right font-medium text-cream">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
