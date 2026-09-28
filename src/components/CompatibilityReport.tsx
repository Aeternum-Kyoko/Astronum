import Link from "next/link";
import type { CompatibilityResponse, MatchPartner } from "@/lib/astrology/matching";
import { RELATIONSHIP_LABEL, type Verdict } from "@/lib/astrology/compatibility";

const VERDICT_CLASS: Record<Verdict, string> = {
  Strong: "text-gold-bright",
  Good: "text-cream",
  Neutral: "text-muted",
  Caution: "text-rose",
  Challenging: "text-rose",
};

export default function CompatibilityReport({ result }: { result: CompatibilityResponse }) {
  const { a, b, compatibility: c, type } = result;
  const positive = c.score >= 60;
  const r = 52;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="space-y-6">
      <section className="card-edge flex flex-col items-center gap-8 rounded-3xl p-7 text-center md:flex-row md:p-10 md:text-left">
        <div className="relative h-40 w-40 shrink-0" role="img" aria-label={`${c.score} out of 100`}>
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
            <circle cx="60" cy="60" r={r} fill="none" stroke="var(--color-border)" strokeWidth="9" />
            <circle
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke={positive ? "var(--color-gold)" : "var(--color-rose)"}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - c.score / 100)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-tabular text-4xl font-bold text-cream">{c.score}</span>
            <span className="text-xs text-muted">out of 100</span>
          </div>
        </div>
        <div>
          <p className="text-sm text-gold-bright">{RELATIONSHIP_LABEL[type]} compatibility</p>
          <h2 className="mt-2 text-3xl font-bold text-cream md:text-4xl">
            {a.name} and {b.name}
          </h2>
          <p className={`mt-3 text-lg font-semibold ${positive ? "text-gold-bright" : "text-rose"}`}>{c.label}</p>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{c.summary}</p>
        </div>
      </section>

      {(c.strengths.length > 0 || c.cautions.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          <section className="card-edge rounded-2xl p-6">
            <h3 className="text-lg font-bold text-cream">Strengths</h3>
            {c.strengths.length ? (
              <ul className="mt-3 space-y-1.5 text-sm text-muted">
                {c.strengths.map((s) => (
                  <li key={s} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                    {s}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">No single factor stands out as especially strong.</p>
            )}
          </section>
          <section className="card-edge rounded-2xl p-6">
            <h3 className="text-lg font-bold text-cream">Handle with care</h3>
            {c.cautions.length ? (
              <ul className="mt-3 space-y-1.5 text-sm text-muted">
                {c.cautions.map((s) => (
                  <li key={s} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose" aria-hidden="true" />
                    {s}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">No checkpoint is a real concern.</p>
            )}
          </section>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <PartnerCard partner={a} />
        <PartnerCard partner={b} />
      </div>

      <section className="card-edge rounded-2xl p-6">
        <h3 className="text-lg font-bold text-cream">Checkpoint by checkpoint</h3>
        <p className="mt-1 text-xs text-muted">Each checkpoint is weighted for a {RELATIONSHIP_LABEL[type].toLowerCase()}; together they total 100.</p>
        <ol className="mt-5 divide-y divide-border">
          {c.checkpoints.map((cp) => (
            <li key={cp.key} className="grid gap-2 py-4 md:grid-cols-[minmax(0,1fr)_120px] md:gap-6">
              <div>
                <p className="font-semibold text-cream">
                  {cp.title} <span className={`ml-1 text-sm font-medium ${VERDICT_CLASS[cp.verdict]}`}>{cp.verdict}</span>
                </p>
                <p className="text-xs text-muted">{cp.measures}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{cp.detail}</p>
              </div>
              <div className="md:text-right">
                <span className="font-tabular font-semibold text-cream">{cp.points}</span>
                <span className="text-muted"> / {cp.max}</span>
                <span className="mt-2 block h-1.5 w-full overflow-hidden rounded-full bg-border/60 md:ml-auto md:w-24">
                  <span
                    className={`block h-full rounded-full ${cp.verdict === "Caution" || cp.verdict === "Challenging" ? "bg-rose/70" : "bg-gold"}`}
                    style={{ width: `${(cp.points / cp.max) * 100}%` }}
                  />
                </span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-gold/30 bg-gold/5 p-6 text-center">
        <p className="text-sm leading-relaxed text-muted">
          These checkpoints adapt classical Guna Milan and chart-to-chart overlays to a {RELATIONSHIP_LABEL[type].toLowerCase()}. They show
          tendencies, not destiny — how you both choose to show up matters more.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link href={`/learn/compatibility#${type}`} className="rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-cream hover:border-gold hover:text-gold-bright">
            How this is calculated
          </Link>
          <Link href="/consultation" className="rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-on-gold hover:bg-gold-bright">
            Book a compatibility reading
          </Link>
        </div>
      </section>
    </div>
  );
}

function PartnerCard({ partner }: { partner: MatchPartner }) {
  const rows: [string, string][] = [
    ["Born", `${partner.date}, ${partner.time}`],
    ["Place", partner.place],
    ["Moon sign", partner.moonSign],
    ["Nakshatra", `${partner.nakshatra}, pada ${partner.pada}`],
    ["Lagna", partner.ascendant],
  ];
  return (
    <section className="card-edge rounded-2xl p-5">
      <p className="font-display text-xl text-cream">{partner.name}</p>
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
