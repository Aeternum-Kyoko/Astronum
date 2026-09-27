"use client";

import { useMemo, useState } from "react";
import type { KundaliChart } from "@/lib/astrology/types";
import { analyzeYogas, type YogaCategory, type YogaFinding, type YogaStrength } from "@/lib/astrology/yogaAnalysis";

const SECTIONS: { category: YogaCategory; title: string; intro: string }[] = [
  {
    category: "yogakaraka",
    title: "Yogakaraka",
    intro:
      "The planet that rules both a kendra (4th, 7th, 10th) and a trikona (5th, 9th) for your Lagna. Only Taurus, Libra, Cancer, Leo, Capricorn and Aquarius Lagnas have one.",
  },
  {
    category: "raja",
    title: "Raj Yogas",
    intro:
      "Formed when a kendra lord (1, 4, 7, 10 — effort and position) links with a trikona lord (1, 5, 9 — fortune and merit) by exchange, conjunction, aspect or placement. They give rise, authority and recognition.",
  },
  {
    category: "dhana",
    title: "Dhan Yogas",
    intro: "Formed when the wealth lords (2nd — savings, 11th — gains) link with each other or with the lords of 1, 5 and 9. They show capacity to earn and hold money.",
  },
  {
    category: "arishta",
    title: "Arisht Yogas",
    intro:
      "Classical afflictions that flag an area needing care — health, mind or sudden events. They describe tendencies, not fate, and each is checked for the factors that soften it.",
  },
];

const STRENGTH_CLASS: Record<YogaStrength, string> = {
  Strong: "border-gold/50 bg-gold/15 text-gold-bright",
  Moderate: "border-border bg-surface-raised text-cream",
  Weak: "border-border text-muted",
  Mitigated: "border-gold/40 bg-gold/5 text-gold-bright",
};

const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: "short", year: "numeric" });

export default function YogaAnalysisPanel({ chart }: { chart: KundaliChart }) {
  const analysis = useMemo(() => analyzeYogas(chart), [chart]);
  const count = (c: YogaCategory) => analysis.findings.filter((f) => f.category === c && f.strength !== "Weak").length;

  return (
    <div className="space-y-6">
      <section className="card-edge rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gold-bright">Yogas worked out from your {analysis.lagnaSign} Lagna</h3>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
          Parashari yogas depend on which houses each planet rules for your Lagna, so we first sort the planets by what they rule. Then every pair is checked for a link,
          and each yoga is graded by the dignity, house and combustion of the planets that form it.
        </p>
        <dl className="mt-5 grid gap-4 sm:grid-cols-4">
          <Stat label="Yogakaraka" value={analysis.yogakaraka ?? "None for this Lagna"} />
          <Stat label="Raj Yogas" value={String(count("raja"))} />
          <Stat label="Dhan Yogas" value={String(count("dhana"))} />
          <Stat label="Arisht Yogas" value={String(count("arishta"))} />
        </dl>
        <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
          <p>
            <span className="font-semibold text-gold-bright">Functional benefics:</span>{" "}
            <span className="text-muted">{analysis.functional.benefics.join(", ") || "—"}</span>
          </p>
          <p>
            <span className="font-semibold text-rose">Functional malefics:</span> <span className="text-muted">{analysis.functional.malefics.join(", ") || "—"}</span>
          </p>
          <p>
            <span className="font-semibold text-cream">Neutral:</span> <span className="text-muted">{analysis.functional.neutral.join(", ") || "—"}</span>
          </p>
        </div>
        <p className="mt-2 text-xs text-muted">
          Lords of the 1st, 5th and 9th help; lords of the 3rd, 6th, 8th and 11th harm; the rest give the results of the planets they join.
        </p>
      </section>

      {SECTIONS.map((s) => (
        <Section key={s.category} {...s} findings={analysis.findings.filter((f) => f.category === s.category)} chart={chart} />
      ))}
    </div>
  );
}

function Section({ category, title, intro, findings, chart }: { category: YogaCategory; title: string; intro: string; findings: YogaFinding[]; chart: KundaliChart }) {
  const [showWeak, setShowWeak] = useState(false);
  const main = findings.filter((f) => f.strength !== "Weak");
  const weak = findings.filter((f) => f.strength === "Weak");
  const shown = showWeak ? findings : main;

  return (
    <section className="card-edge rounded-2xl p-6">
      <h3 className={`text-xl font-bold ${category === "arishta" ? "text-rose" : "text-gold-bright"}`}>{title}</h3>
      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">{intro}</p>
      {findings.length === 0 ? (
        <p className="mt-4 text-sm text-cream">
          {category === "yogakaraka"
            ? `A ${chart.ascendant.sign} Lagna has no single planet that rules both a kendra and a trikona. The trikona lords listed above do that job instead.`
            : category === "arishta"
              ? "None of the classical Arisht Yogas checked here is present in your chart."
              : `No ${title.replace(/s$/, "")} is formed in this chart.`}
        </p>
      ) : (
        <ul className="mt-5 space-y-4">
          {shown.map((f) => (
            <Finding key={f.id} f={f} />
          ))}
        </ul>
      )}
      {main.length === 0 && weak.length > 0 && !showWeak && <p className="mt-4 text-sm text-cream">Only weak combinations are formed — see them below.</p>}
      {weak.length > 0 && (
        <button type="button" onClick={() => setShowWeak(!showWeak)} className="mt-4 text-sm font-semibold text-gold-bright hover:underline" aria-expanded={showWeak}>
          {showWeak ? "Hide weaker combinations" : `Show ${weak.length} weaker combination${weak.length > 1 ? "s" : ""}`}
        </button>
      )}
      {category === "arishta" && findings.length > 0 && (
        <p className="mt-4 text-sm text-muted">The Remedies tab lists the mantras, charity and gemstone guidance for the planets involved.</p>
      )}
    </section>
  );
}

function Finding({ f }: { f: YogaFinding }) {
  return (
    <li className="rounded-xl border border-border/70 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-cream">{f.name}</p>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STRENGTH_CLASS[f.strength]}`}>{f.strength}</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-cream">{f.formation}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">{f.effect}</p>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-semibold text-gold-bright">{f.category === "arishta" ? "What softens it" : "Why this strength"}</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
          {f.reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </details>
      <div className="mt-3 text-xs text-muted">
        {f.activation.length ? (
          <>
            <span className="font-semibold text-cream">When it works most: </span>
            {f.activation.map((w, i) => (
              <span key={i}>
                {i > 0 && "; "}
                {w.label} ({fmt(w.start)} – {fmt(w.end)}){w.peak && `, peaking in the ${w.peak.label} (${fmt(w.peak.start)} – ${fmt(w.peak.end)})`}
              </span>
            ))}
          </>
        ) : (
          "No dasha of these planets falls ahead of you in a normal lifespan; the combination works in the background and through transits."
        )}
      </div>
    </li>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 px-4 py-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-cream">{value}</dd>
    </div>
  );
}
