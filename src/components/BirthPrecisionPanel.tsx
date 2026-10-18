"use client";
import { useState } from "react";
import Link from "next/link";
import type { KundaliChart } from "@/lib/astrology/types";
import type { BirthSensitivity } from "@/lib/astrology/birthSensitivity";
import { useDeviceStore } from "@/lib/useDeviceStore";
import { toBirthQuery } from "@/lib/birthParams";
import { precisionKey, sensitivityKey, type SensitivityRecord } from "@/lib/birthReliability";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { pick } from "@/lib/i18n/ui";
import { term } from "@/lib/i18n/terms";

export default function BirthPrecisionPanel({ chart }: { chart: KundaliChart }) {
  const locale = useLocale(); const L = pick(locale);
  const [precision, setPrecision] = useDeviceStore<string>(precisionKey(chart.input), "unknown");
  const [, saveAssessment] = useDeviceStore<SensitivityRecord | null>(sensitivityKey(chart.input), null);
  const [result, setResult] = useState<BirthSensitivity | null>(null); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const [onlyChanges, setOnlyChanges] = useState(true);
  const selectedPrecision = ["unknown", "0", "5", "15", "30"].includes(precision) ? precision : "unknown";
  async function analyze() {
    setBusy(true); setError(""); setResult(null);
    try { const res = await fetch("/api/kundali/sensitivity", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ birth: chart.input, window: Number(selectedPrecision) }) }); const data: BirthSensitivity = await res.json(); if (!res.ok) throw new Error("Could not analyze the interval."); setResult(data); saveAssessment({ precision: selectedPrecision as SensitivityRecord["precision"], sampleCount: data.sampleCount, fields: data.fields.map(field => ({ key: field.key, stable: field.stable })) }); }
    catch (err) { setError(err instanceof Error ? err.message : L("Could not analyze the interval.", "अंतराल का विश्लेषण नहीं हो सका।")); }
    finally { setBusy(false); }
  }
  return <div className="space-y-6">
    <header><h2 className="text-3xl font-bold text-cream">{L("Birth-time precision", "जन्म-समय की सटीकता")}</h2><p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{L("Record how well you know the birth time, then check which chart placements change around it. Your assessment is saved on this device.", "जन्म-समय कितना ज्ञात है, दर्ज करें; फिर देखें आसपास के समय में कौन-सी स्थितियाँ बदलती हैं। जानकारी इस उपकरण पर सहेजी जाती है।")}</p></header>
    <div className="birth-precision-controls"><fieldset><legend>{L("How precise is the time?", "समय कितना सटीक है?")}</legend><div>{([ ["unknown", L("Unknown", "अज्ञात")], ["0", L("Recorded exact", "सटीक दर्ज")], ["5", "±5 min"], ["15", "±15 min"], ["30", "±30 min"] ] as const).map(([value, label]) => <button type="button" key={value} disabled={busy} aria-pressed={selectedPrecision === value} onClick={() => { setPrecision(value); saveAssessment(null); setResult(null); }}>{label}</button>)}</div></fieldset><button type="button" disabled={busy || selectedPrecision === "unknown"} onClick={analyze} className="birth-precision-run">{busy ? L("Comparing…", "तुलना…") : L("Check sensitivity", "संवेदनशीलता जाँचें")}</button></div>
    {selectedPrecision === "unknown" && <p className="rounded-2xl border border-gold/30 p-5 text-sm leading-relaxed text-muted">{L("Without a known interval, sensitive divisional houses cannot be treated as settled. Start with recorded birth documents or event-based rectification. Choose a realistic interval to explore changes.", "ज्ञात अंतराल के बिना संवेदनशील वर्ग भावों को निश्चित न मानें। जन्म के रिकॉर्ड या घटना-आधारित समय शोधन से शुरू करें। बदलाव देखने के लिए वास्तविक अंतराल चुनें।")}</p>}
    {error && <p role="alert" className="text-sm text-rose">{error}</p>}
    {result && <>
      <section className="rounded-2xl border border-border p-5"><h3 className="font-semibold text-cream">{L("What stays stable", "क्या स्थिर रहता है")}</h3><p className="mt-2 text-sm text-muted">{result.sampleCount} {L("sampled times", "नमूना समय")} · {result.fields.filter((f) => f.stable).length} {L("stable fields", "स्थिर स्थितियाँ")} · {result.fields.filter((f) => !f.stable).length} {L("changing fields", "बदलती स्थितियाँ")}</p><p className="mt-3 text-xs leading-relaxed text-muted">{L("Checked at one-minute intervals, preserving entered seconds. Stability applies only to these samples; continuous degrees and dasha dates can still change. An exact-time selection tests only the entered instant.", "दर्ज सेकंड रखते हुए एक-मिनट अंतराल पर जाँच हुई। स्थिरता केवल नमूना समयों की है; अंश और दशा तिथियाँ फिर भी बदल सकती हैं। सटीक समय चुनने पर केवल दर्ज क्षण जाँचा जाता है।")}</p></section>
      <label className="flex items-center gap-2 text-sm text-cream"><input type="checkbox" checked={onlyChanges} onChange={(e) => setOnlyChanges(e.target.checked)} />{L("Show changing fields only", "केवल बदलती स्थितियाँ दिखाएँ")}</label>
      <div className="overflow-x-auto rounded-2xl border border-border"><table className="w-full text-left text-sm"><thead className="text-xs text-muted"><tr><th className="p-3">{L("Placement", "स्थिति")}</th><th className="p-3">{L("Observed values", "मिली स्थितियाँ")}</th><th className="p-3">{L("Result", "परिणाम")}</th></tr></thead><tbody>{result.fields.filter((f) => !onlyChanges || !f.stable).map((f) => <tr key={f.key} className="border-t border-border"><th className="p-3 font-medium text-cream">{fieldLabel(f.key, locale)}</th><td className="p-3 text-muted">{f.values.map((v) => typeof v === "string" ? term(locale, v) : v).join(" / ")}</td><td className={`p-3 ${f.stable ? "text-sky-300" : "text-rose"}`}>{f.stable ? L("Stable in samples", "नमूनों में स्थिर") : L("Time-sensitive", "समय-संवेदनशील")}</td></tr>)}</tbody></table>{onlyChanges && result.fields.every((f) => f.stable) && <p className="p-4 text-sm text-muted">{L("No placement changes in the tested samples.", "जाँचे नमूनों में स्थिति नहीं बदली।")}</p>}</div>
      <p className="text-xs text-muted">{L("First Mahadasha balance ends between", "प्रथम महादशा शेष समाप्ति अंतराल")}: {new Date(result.dashaBalanceEndRange.from).toLocaleString(locale === "hi" ? "hi-IN" : "en-IN", {timeZone:chart.input.timezone})} – {new Date(result.dashaBalanceEndRange.to).toLocaleString(locale === "hi" ? "hi-IN" : "en-IN", {timeZone:chart.input.timezone})}</p>
      <details className="rounded-2xl border border-border p-4"><summary className="cursor-pointer font-medium text-cream">{L("All candidate times", "सभी संभावित समय")}</summary><ul className="mt-3 grid gap-2 sm:grid-cols-3">{result.samples.map((s) => <li key={`${s.date}-${s.time}`} className="text-xs text-muted">{s.date} {s.time} · {term(locale, s.lagna)} / D9 {term(locale, s.navamsa)}</li>)}</ul></details>
    </>}
    <Link href={`/rectification?${toBirthQuery(chart.input)}`} className="inline-flex rounded-full border border-gold/40 px-5 py-2 text-sm font-semibold text-gold-bright">{L("Open birth-time rectification", "जन्म-समय शोधन खोलें")}</Link>
  </div>;
}
function fieldLabel(key: string, locale: "en" | "hi") { if (locale !== "hi") return key; return key.replace("lagna", "लग्न").replace("moonNakshatra", "चंद्र नक्षत्र / पद").replace("ascendant", "लग्न").replace("house", "भाव").replace("Chalit", "चलित").replace("sign", "राशि").replace(/Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu/g, (p) => term(locale, p)); }
