"use client";

import { useLocale } from "@/lib/i18n/LocaleContext";

export default function KundaliIntro() {
  const hi = useLocale() === "hi";
  return (
    <div className="kundli-entry-intro">
      <div className="kundli-entry-copy">
        <span className="kundli-entry-eyebrow">{hi ? "आपका आकाश, आपकी कहानी" : "A clearer view of your sky"}</span>
        <h1>{hi ? "अपनी जन्म कुंडली समझें।" : "Your birth chart, clearly explained."}</h1>
        <p>{hi ? "जन्म की तारीख, समय और स्थान से अपनी वैदिक कुंडली बनाएं। ग्रहों, दशाओं और गोचर को एक सहज जगह पर देखें।" : "Create your Vedic birth chart from your date, time, and place. Explore your planets, dashas, and transits in one thoughtful space."}</p>
        <div className="kundli-entry-points" aria-label={hi ? "कुंडली की विशेषताएँ" : "What you can explore"}>
          <span>{hi ? "जन्म कुंडली" : "Birth chart"}</span>
          <span>{hi ? "दशा और समय" : "Dashas & timing"}</span>
          <span>{hi ? "आज के गोचर" : "Today's transits"}</span>
        </div>
      </div>
      <div className="kundli-entry-art" aria-hidden="true">
        <svg viewBox="0 0 480 480" fill="none">
          <circle cx="240" cy="240" r="208" className="instrument-orbit" />
          <circle cx="240" cy="240" r="180" className="instrument-orbit instrument-orbit-inner" />
          <circle cx="240" cy="240" r="147" className="instrument-orbit instrument-orbit-core" />
          <path d="M240 62V418M62 240H418M114 114L366 366M366 114L114 366" className="instrument-guides" />
          <rect x="130" y="130" width="220" height="220" rx="4" transform="rotate(45 240 240)" className="instrument-chart" />
          <path d="M84 240L240 84L396 240L240 396L84 240ZM130 130L350 350M350 130L130 350" className="instrument-chart-lines" />
          <circle cx="240" cy="240" r="5" className="instrument-centre" />
          <circle cx="378" cy="97" r="7" className="instrument-marker" />
          <circle cx="122" cy="110" r="3" className="instrument-star" />
          <circle cx="398" cy="318" r="3" className="instrument-star" />
          <circle cx="183" cy="420" r="2" className="instrument-star" />
        </svg>
        <span className="kundli-entry-art-caption">{hi ? "आकाश का एक रूप" : "A portrait of the sky"}</span>
      </div>
    </div>
  );
}
