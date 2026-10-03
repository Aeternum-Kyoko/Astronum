"use client";

import { useState } from "react";
import { rudrakshaPlan, type Mukhi, type RudrakshaRec } from "@/lib/astrology/rudraksha";
import { ROLE_HI } from "@/lib/astrology/rudraksha.hi";
import type { KundaliChart } from "@/lib/astrology/types";
import type { Locale } from "@/lib/i18n/locale";

const COPY = {
  en: {
    intro:
      "Each rudraksha is ruled by a graha. Your beads are chosen from the planets your chart most needs to support — your Lagna lord for life, the planets running your dasha now, and any planet that is weak or behind a dosha — with every reason shown.",
    yours: "Your rudraksha",
    mukhi: (m: string) => `${m} Mukhi`,
    why: "Why these beads, for you",
    planetLine: "Planet",
    inChart: "in your chart",
    deity: "Deity",
    startOn: "Start on a",
    whyTitle: "Why it is suggested",
    what: "What it does",
    mantra: "Mantra",
    copied: "copied",
    tap: "tap to copy",
    alternative: (p: string) => `Alternative for ${p}:`,
    also: "Also helpful",
    goalsTitle: "By life goal",
    goalsBody: "If you want to support one area of life, wear the bead of the planet that rules that house in your chart.",
    sections: ["How to wear", "Energising (pran pratishtha)", "Care", "Buying a genuine bead"],
    note: "Rudraksha is a traditional spiritual support, not a substitute for medical, legal or financial advice. Mukhi–planet pairings follow the common Jyotish tradition; some lineages differ for a few beads.",
  },
  hi: {
    intro:
      "हर रुद्राक्ष का एक स्वामी ग्रह होता है। आपके रुद्राक्ष उन ग्रहों से चुने गए हैं जिन्हें आपकी कुंडली को सबसे ज़्यादा सहारा चाहिए — आजीवन के लिए लग्नेश, अभी चल रही दशा के ग्रह, और कोई भी कमज़ोर या दोष देने वाला ग्रह — हर कारण के साथ।",
    yours: "आपके रुद्राक्ष",
    mukhi: (m: string) => (Number.isFinite(Number(m)) ? `${m} मुखी` : m),
    why: "ये रुद्राक्ष आपके लिए क्यों",
    planetLine: "ग्रह",
    inChart: "आपकी कुंडली में",
    deity: "देवता",
    startOn: "आरंभ का दिन:",
    whyTitle: "क्यों सुझाया गया",
    what: "इसके लाभ",
    mantra: "मंत्र",
    copied: "कॉपी हुआ",
    tap: "कॉपी करने के लिए टैप करें",
    alternative: (p: string) => `${p} के लिए विकल्प:`,
    also: "ये भी सहायक",
    goalsTitle: "जीवन के लक्ष्य अनुसार",
    goalsBody: "जीवन के किसी एक क्षेत्र को सहारा देना हो, तो आपकी कुंडली में उस भाव के स्वामी ग्रह का रुद्राक्ष पहनें।",
    sections: ["कैसे पहनें", "प्राण प्रतिष्ठा (सिद्ध करना)", "देखभाल", "असली रुद्राक्ष कैसे खरीदें"],
    note: "रुद्राक्ष एक पारंपरिक आध्यात्मिक सहारा है, चिकित्सा, कानूनी या वित्तीय सलाह का विकल्प नहीं। मुखी–ग्रह संबंध सामान्य ज्योतिष परंपरा के अनुसार हैं; कुछ परंपराओं में कुछ मुखियों के लिए अंतर है।",
  },
};
type Copy = (typeof COPY)["en"];

const ROLE_STYLE: Record<RudrakshaRec["role"], string> = {
  Lifelong: "border-gold/60 bg-gold/10 text-gold-bright",
  "Current period": "border-gold/40 text-gold-bright",
  Remedial: "border-rose/50 text-rose",
  Supportive: "border-border text-muted",
};

/** A rudraksha bead drawn with its actual number of mukhis (the natural lines running pole to pole). */
export function Bead({ mukhi, size = 56 }: { mukhi: string; size?: number }) {
  const n = Number(mukhi);
  const lines = Number.isFinite(n) ? n : mukhi === "Gauri Shankar" ? 2 : 6;
  const twin = mukhi === "Gauri Shankar";
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" className="shrink-0">
      <defs>
        <radialGradient id={`bead-${mukhi}`} cx="38%" cy="32%" r="70%">
          <stop offset="0%" stopColor="#c8875a" />
          <stop offset="55%" stopColor="#8a4f2c" />
          <stop offset="100%" stopColor="#4a2814" />
        </radialGradient>
      </defs>
      {(twin ? [20, 44] : [32]).map((cx) => (
        <g key={cx}>
          <ellipse cx={cx} cy="32" rx={twin ? 13 : 24} ry="26" fill={`url(#bead-${mukhi})`} />
          {Array.from({ length: twin ? 1 : lines }, (_, i) => {
            // Meridians: each mukhi is an arc from the top pole to the bottom one, spread round the bead.
            const a = ((i + 0.5) / lines) * Math.PI;
            const rx = (twin ? 13 : 24) * Math.cos(a);
            return <path key={i} d={`M${cx} 6 Q${cx + rx * 1.3} 32 ${cx} 58`} fill="none" stroke="#2b160a" strokeWidth="1.4" strokeOpacity="0.75" />;
          })}
          <ellipse cx={cx - 5} cy="20" rx="5" ry="3" fill="#ffffff" opacity="0.12" />
        </g>
      ))}
    </svg>
  );
}

function Mantra({ text, t }: { text: string; t: Copy }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="rounded-xl border border-border/70 px-3 py-2 text-left text-sm text-cream hover:border-gold"
      title="Copy mantra"
    >
      <span className="block text-[11px] text-muted">
        {t.mantra} · {copied ? t.copied : t.tap}
      </span>
      <span className="font-semibold">{text}</span>
    </button>
  );
}

function BeadFacts({ bead }: { bead: Mukhi }) {
  return (
    <>
      <ul className="mt-3 space-y-1 text-sm text-muted">
        {bead.benefits.map((b) => (
          <li key={b} className="flex gap-2">
            <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" />
            {b}
          </li>
        ))}
      </ul>
      {bead.note && <p className="mt-2 text-xs text-muted">{bead.note}</p>}
    </>
  );
}

/** Rudraksha suggestions from the chart: which beads, why each one, and how to wear, energise and buy them. */
export default function RudrakshaPanel({ chart, locale = "en" }: { chart: KundaliChart; locale?: Locale }) {
  const t = COPY[locale] as Copy;
  const plan = rudrakshaPlan(chart, locale);
  const role = (r: RudrakshaRec) => (locale === "hi" ? ROLE_HI[r.role] : r.role);
  const [main] = plan.top;

  return (
    <div className="space-y-8">
      <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted">
        {t.intro}
      </p>

      {main && (
        <section className="card-edge rounded-3xl p-6 md:p-7" aria-label="Your rudraksha combination">
          <p className="text-sm font-semibold text-gold-bright">{t.yours}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {plan.top.map((r, i) => (
              <div key={r.planet} className="flex items-center gap-3">
                {i > 0 && <span className="text-2xl text-muted">+</span>}
                <Bead mukhi={r.bead.mukhi} size={64} />
                <div>
                  <p className="font-display text-xl text-cream">{t.mukhi(r.bead.mukhi)}</p>
                  <p className="text-xs text-muted">{r.planetName}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-cream">{plan.combination.text}</p>
        </section>
      )}

      <section aria-label="Recommended beads" className="space-y-4">
        <h3 className="text-xl font-bold tracking-tight text-cream">{t.why}</h3>
        {plan.top.map((r) => (
          <article key={r.planet} className="card-edge rounded-3xl p-6">
            <div className="flex flex-wrap items-start gap-4">
              <Bead mukhi={r.bead.mukhi} size={72} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-lg font-bold text-cream">
                    {r.bead.name}
                    {locale === "en" ? ` · ${r.bead.mukhi} Mukhi` : ""}
                  </h4>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ROLE_STYLE[r.role]}`}>{role(r)}</span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {t.planetLine} <b className="text-cream">{r.planetName}</b> ({t.inChart} {r.grade}, {r.diagnosis.score}/100) · {t.deity} <b className="text-cream">{r.bead.deity}</b> · {t.startOn}{" "}
                  <b className="text-cream">{r.day}</b>
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-muted">{t.whyTitle}</p>
                <ul className="mt-2 space-y-2 text-sm">
                  {r.reasons.map((x) => (
                    <li key={x.text} className="flex gap-3">
                      <span className="w-8 shrink-0 text-right font-tabular text-xs font-semibold text-gold-bright">+{x.points}</span>
                      <span className="text-cream">{x.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted">{t.what}</p>
                <BeadFacts bead={r.bead} />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Mantra text={r.bead.mantra} t={t} />
                </div>
                {r.alternative && (
                  <p className="mt-3 text-xs text-muted">
                    {t.alternative(r.planetName)} <b className="text-cream">{t.mukhi(r.alternative.mukhi)}</b> ({r.alternative.name}) — {r.alternative.benefits[0]}.
                    {r.alternative.note ? ` ${r.alternative.note}` : ""}
                  </p>
                )}
              </div>
            </div>
          </article>
        ))}
      </section>

      {plan.others.length > 0 && (
        <section className="card-edge rounded-2xl p-5" aria-label="Also helpful">
          <h3 className="text-sm font-semibold text-cream">{t.also}</h3>
          <ul className="mt-3 space-y-3">
            {plan.others.map((r) => (
              <li key={r.planet} className="flex items-start gap-3">
                <Bead mukhi={r.bead.mukhi} size={36} />
                <p className="text-sm text-muted">
                  <b className="text-cream">
                    {t.mukhi(r.bead.mukhi)} ({r.planetName})
                  </b>{" "}
                  — {r.reasons.map((x) => x.text).join(" ")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Beads for life goals">
        <h3 className="text-xl font-bold tracking-tight text-cream">{t.goalsTitle}</h3>
        <p className="mt-1 text-sm text-muted">{t.goalsBody}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {plan.goals.map((g) => (
            <div key={g.goal} className="card-edge flex items-start gap-3 rounded-2xl p-4">
              <Bead mukhi={g.bead.mukhi} size={40} />
              <div>
                <p className="text-xs text-muted">{g.goal}</p>
                <p className="font-semibold text-cream">{g.bead.name}</p>
                <p className="mt-1 text-sm text-muted">{g.why}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {(
          [
            [t.sections[0], plan.wearing],
            [t.sections[1], plan.energising],
            [t.sections[2], plan.care],
            [t.sections[3], plan.buying],
          ] as [string, string[]][]
        ).map(([title, items]) => (
          <details key={title} className="card-edge group rounded-2xl p-5" open={title === t.sections[0]}>
            <summary className="cursor-pointer list-none text-sm font-semibold text-cream">
              {title} <span className="text-muted group-open:hidden">+</span>
            </summary>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted">
              {items.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ol>
          </details>
        ))}
      </div>

      <p className="text-center text-xs text-muted">
        {t.note}
      </p>
    </div>
  );
}
