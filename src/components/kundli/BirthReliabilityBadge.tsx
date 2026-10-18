"use client";

import type { KundaliChart } from "@/lib/astrology/types";
import type { PlanetName, VargaKey } from "@/lib/astrology/constants";
import { precisionKey, sensitivityKey, sensitivityRecordSchema, reliabilityState, type SensitivityRecord } from "@/lib/birthReliability";
import { useDeviceStore } from "@/lib/useDeviceStore";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { pick } from "@/lib/i18n/ui";

export default function BirthReliabilityBadge({ chart, varga, planet, go }: { chart: KundaliChart; varga: VargaKey; planet?: PlanetName; go?: (slug: string) => void }) {
  const locale = useLocale();
  const L = pick(locale);
  const [precision] = useDeviceStore<string>(precisionKey(chart.input), "unknown");
  const [stored] = useDeviceStore<SensitivityRecord | null>(sensitivityKey(chart.input), null);
  const parsed = sensitivityRecordSchema.safeParse(stored);
  const state = reliabilityState(precision, parsed.success ? parsed.data : null, varga, planet);
  const label = state === "unknown" ? L("Birth time unverified", "जन्म-समय अप्रमाणित")
    : state === "exact" ? L("Recorded time; interval not tested", "दर्ज समय; अंतराल नहीं जाँचा")
    : state === "unchecked" ? L(`±${precision} min; not tested`, `±${precision} मिनट; जाँच नहीं हुई`)
    : state === "changes" ? L(`Changes within ±${precision} min`, `±${precision} मिनट में बदलाव`)
    : L(`Stable in ±${precision} min samples`, `±${precision} मिनट के नमूनों में स्थिर`);
  const detail = planet ? `${varga} ${planet} ${L("sign and ascendant", "राशि और लग्न")}` : `${varga} ${L("ascendant", "लग्न")}`;
  return <span className="birth-reliability" data-state={state} title={`${detail}: ${label}. ${L("Minute samples are not a guarantee between samples.", "मिनट के नमूने बीच के सभी क्षणों की गारंटी नहीं हैं।")}`}>
    <span aria-hidden="true">{state === "stable" ? "✓" : state === "changes" ? "!" : "?"}</span>{label}
    {go && <button type="button" onClick={() => go("precision")}>{L("Check", "जाँचें")}</button>}
  </span>;
}
