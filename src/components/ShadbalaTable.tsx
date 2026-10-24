"use client";
import { useState } from "react";
import type { ShadbalaResult } from "@/lib/astrology/types";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { term } from "@/lib/i18n/terms";

function fmt(n: number): string {
  return n.toFixed(1);
}

export default function ShadbalaTable({ shadbala }: { shadbala: ShadbalaResult[] }) {
  const locale = useLocale(); const hi = locale === "hi";
  const [sort, setSort] = useState("ratio");
  const ratio = (s: ShadbalaResult) => s.requiredRupas > 0 ? s.rupas / s.requiredRupas : 0;
  const ranked = [...shadbala].sort((a,b) => sort === "total" ? b.rupas - a.rupas : ratio(b) - ratio(a));
  return (
    <div>
      <header className="rebuilt-ranking-header"><div><h3>{hi ? "ग्रह बल की रैंकिंग" : "Planet strength ranking"}</h3><p>{hi ? "100% आवश्यक न्यूनतम बल है। बल का अर्थ शुभ फल नहीं है।" : "100% meets the required minimum. Strength does not mean a favourable outcome."}</p></div><label>{hi ? "क्रम " : "Rank by "}<select value={sort} onChange={event => setSort(event.target.value)}><option value="ratio">{hi ? "आवश्यक बल का प्रतिशत" : "% of required strength"}</option><option value="total">{hi ? "कुल रूपा" : "Total Rupas"}</option></select></label></header>
      <p className="mt-3 text-sm text-muted">{hi ? "बार आवश्यक बल के प्रतिशत को दर्शाते हैं। बीच की रेखा 100% है; पूरा बार 200% है।" : "Bars show strength against each planet’s own requirement. The middle marker is 100%; a full bar is 200%."}</p>
      <ol className="rebuilt-ranking" aria-label={hi ? "ग्रह बल का क्रम" : "Ranked planetary strengths"}>{ranked.map((s,index) => <li key={s.planet} className="rebuilt-rank-row" data-strong={s.isStrong}><span>{index+1}</span><strong>{term(locale,s.planet)}<small>{fmt(s.rupas)} / {fmt(s.requiredRupas)} {hi ? "रूपा" : "Rupas"}</small></strong><div className="rebuilt-rank-track" aria-hidden="true"><span style={{width:`${Math.max(0,Math.min(100,ratio(s)*50))}%`}} /></div><strong>{Math.round(ratio(s)*100)}%<small>{s.isStrong ? hi ? "पर्याप्त" : "Meets minimum" : hi ? "न्यून" : "Below minimum"}</small></strong></li>)}</ol>
      <div className="card-edge overflow-x-auto rounded-2xl">
        <table className="w-full text-sm font-tabular">
          <caption className="p-4 text-left font-semibold text-cream">{hi ? "छह बलों का विवरण · घटक विरूपा में, कुल रूपा में" : "Six-component breakdown · components in Virupas, totals in Rupas"}</caption>
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="px-4 py-3">Planet</th>
              <th className="px-4 py-3">Sthana</th>
              <th className="px-4 py-3">Dig</th>
              <th className="px-4 py-3">Kaala</th>
              <th className="px-4 py-3">Chesta</th>
              <th className="px-4 py-3">Naisargika</th>
              <th className="px-4 py-3">Drik</th>
              <th className="px-4 py-3">Total (Rupas)</th>
              <th className="px-4 py-3">Required</th>
              <th className="px-4 py-3">Verdict</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((s) => (
              <tr key={s.planet} className="border-b border-border/50 last:border-0">
                <td className="px-4 py-3 font-medium text-cream">{term(locale,s.planet)}</td>
                <td className="px-4 py-3 text-muted">{fmt(s.sthanaBala)}</td>
                <td className="px-4 py-3 text-muted">{fmt(s.digBala)}</td>
                <td className="px-4 py-3 text-muted">{fmt(s.kaalaBala)}</td>
                <td className="px-4 py-3 text-muted">{fmt(s.chestaBala)}</td>
                <td className="px-4 py-3 text-muted">{fmt(s.naisargikaBala)}</td>
                <td className="px-4 py-3 text-muted">{fmt(s.drikBala)}</td>
                <td className="px-4 py-3 font-semibold text-cream">{fmt(s.rupas)}</td>
                <td className="px-4 py-3 text-muted">{fmt(s.requiredRupas)}</td>
                <td className="px-4 py-3">
                  <span className={s.isStrong ? "text-gold-bright" : "text-rose"}>
                    {s.isStrong ? "Strong" : "Weak"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-muted">
        Shadbala here is a documented approximation, not full classical precision: Sthana, Dig and Naisargika Bala use the implemented classical formulas; Drik Bala uses a graded aspect approximation. Kaala Bala includes only its Nathonnata and Paksha components (Tribhaga
        and the Varsha/Masa/Dina/Hora-lord balas are omitted); Chesta Bala is approximated from retrograde state
        and speed. Totals in Rupas (virupas ÷ 60) are compared against each planet&rsquo;s classical minimum
        requirement to flag Strong/Weak — treat this as a relative strength signal, not a definitive classical
        reading.
      </p>
    </div>
  );
}
