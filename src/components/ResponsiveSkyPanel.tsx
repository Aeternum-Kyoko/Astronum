"use client";

import { useState, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n/locale";

/** Desktop keeps the observatory visible; phones open it when requested. */
export default function ResponsiveSkyPanel({ children, locale }: { children: ReactNode; locale: Locale }) {
  const [expanded, setExpanded] = useState(false);
  const hi = locale === "hi";
  return <div className="responsive-sky-panel" data-expanded={expanded}>
    <button type="button" className="mobile-sky-trigger" aria-expanded={expanded} aria-controls="home-sky-panel" onClick={() => setExpanded(!expanded)}><span><strong>{hi ? "आज का आकाश" : "Today's sky"}</strong><small>{hi ? "गोचर, नक्षत्र और ग्रह स्थितियाँ" : "Gochar, nakshatras & planet positions"}</small></span><span aria-hidden="true">{expanded ? "−" : "+"}</span></button>
    <div id="home-sky-panel" className="responsive-sky-content">{children}</div>
  </div>;
}
