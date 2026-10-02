"use client";

import { useState } from "react";
import { DateTime } from "luxon";
import KundliChart, { type ChartPoint } from "@/components/KundliChart";
import { NAKSHATRAS, SIGN_LORDS, SIGN_SANSKRIT, SIGNS } from "@/lib/astrology/constants";
import { computeAvakahada, computeBirthPanchang } from "@/lib/astrology/birthDetails";
import { birthTime, grahaTable, type GrahaRow } from "@/lib/astrology/dashboard";
import { natalMarkers, planetMarkers } from "@/lib/astrology/chartMarkers";
import { dignityColorClass, type Dignity } from "@/lib/astrology/dignity";
import { nakshatraLord, type DashaPeriod } from "@/lib/astrology/dasha";
import type { KundaliChart } from "@/lib/astrology/types";

/** 12.5083 → 12°30′30″ */
function dms(deg: number): string {
  const total = Math.round(deg * 3600);
  return `${Math.floor(total / 3600)}°${String(Math.floor((total % 3600) / 60)).padStart(2, "0")}′${String(total % 60).padStart(2, "0")}″`;
}

const SHORT_DIGNITY: Record<Dignity, string> = {
  Exalted: "Exalted",
  Moolatrikona: "MT",
  "Own Sign": "Own",
  "Friend's Sign": "Friend",
  "Neutral Sign": "Neutral",
  "Enemy's Sign": "Enemy",
  Debilitated: "Debil.",
};

const KARAKA_SHORT: Record<string, string> = {
  Atmakaraka: "AK",
  Amatyakaraka: "AmK",
  Bhratrikaraka: "BK",
  Matrikaraka: "MK",
  Putrakaraka: "PK",
  Gnatikaraka: "GK",
  Darakaraka: "DK",
};

const fmt = (d: Date | string, zone: string, f = "d LLL yyyy") => DateTime.fromJSDate(new Date(d), { zone }).toFormat(f);

/** An astrologer's first look: every number needed to start reading the chart, on one screen. */
export default function AstroDashboard({ chart }: { chart: KundaliChart }) {
  const [style, setStyle] = useState<"north" | "south">("north");
  const zone = chart.input.timezone;
  const rows = grahaTable(chart);
  const time = birthTime(chart);
  const moon = chart.planets.find((p) => p.planet === "Moon")!;
  const sun = chart.planets.find((p) => p.planet === "Sun")!;
  const panchang = computeBirthPanchang(sun.siderealLongitude, moon.siderealLongitude);
  const avakahada = computeAvakahada(moon);
  const lagna = rows[0];
  const birth = DateTime.fromISO(`${chart.input.date}T${chart.input.time}`, { zone });

  const d1Markers = natalMarkers(chart);
  const d1Points: ChartPoint[] = chart.planets.map((p) => ({ ...p, markers: d1Markers[p.planet] }));
  const d9 = chart.divisionalCharts.D9;
  const d9Sign = new Map(d9.planets.map((p) => [p.planet, p]));
  const d9Markers = planetMarkers(chart, (pl) => d9Sign.get(pl)!.signIndex, (pl) => d9Sign.get(pl)!.retrograde, { vargottama: true });
  const d9Points: ChartPoint[] = d9.planets.map((p) => ({ ...p, markers: d9Markers[p.planet] }));

  const facts: [string, string, string?][] = [
    ["Born", birth.isValid ? birth.toFormat("d LLL yyyy, h:mm a") : `${chart.input.date} ${chart.input.time}`, `${chart.input.place} · UTC${birth.isValid ? birth.toFormat("ZZ") : ""}`],
    ["Lagna", `${lagna.sign} ${dms(lagna.degree)}`, `${lagna.nakshatra} ${lagna.pada} · lord ${SIGN_LORDS[chart.ascendant.signIndex]} · D9 ${lagna.d9Sign}`],
    ["Rashi", `${moon.sign} (${SIGN_SANSKRIT[moon.signIndex]})`, `${moon.nakshatra} pada ${moon.pada} · nak. lord ${nakshatraLord(moon.nakshatraIndex)}`],
    ["Sun sign", `${sun.sign} ${dms(sun.degreeInSign)}`, `${sun.nakshatra} ${sun.pada}`],
    ["Tithi", `${panchang.paksha} ${panchang.tithi}`, `Tithi ${panchang.tithiNumber} of 30`],
    ["Yoga · Karana", `${panchang.yoga} · ${panchang.karana}`],
    ...(time
      ? ([
          ["Vara", `${time.vara.name} (${time.vara.sanskrit})`, `Lord ${time.vara.lord}${time.night ? " · night birth" : " · day birth"}`],
          ["Sunrise · Sunset", `${fmt(time.sunrise, zone, "h:mm a")} · ${fmt(time.sunset, zone, "h:mm a")}`, "Local time at the birth place"],
          ["Ishta Kaal", `${time.ishtaKaal.ghati} ghati ${time.ishtaKaal.pala} pala`, "From sunrise to birth"],
        ] as [string, string, string][])
      : []),
    ["Ayanamsa", `Lahiri ${dms(chart.ayanamsa)}`, `MC ${SIGNS[Math.floor(chart.midheaven / 30)]} ${dms(chart.midheaven % 30)}`],
    ["Avakahada", `${avakahada.gana} gana · ${avakahada.yoni}`, `${avakahada.nadi} nadi · ${avakahada.varna} · ${avakahada.vashya}`],
    [
      "Atmakaraka · Darakaraka",
      `${rows.find((r) => r.karaka === "Atmakaraka")?.planet} · ${rows.find((r) => r.karaka === "Darakaraka")?.planet}`,
      `Amatyakaraka ${rows.find((r) => r.karaka === "Amatyakaraka")?.planet}`,
    ],
  ];

  const md = chart.currentDasha;
  const ad = chart.currentAntardasha;
  const pd = chart.currentPratyantardasha;
  const nextAds = (md?.subPeriods ?? []).filter((p) => ad && new Date(p.start) >= new Date(ad.end)).slice(0, 3);

  const present = chart.yogas.filter((y) => y.present);
  const doshas = chart.doshas.filter((d) => d.present || d.cancelled);
  const flag = (pred: (r: GrahaRow) => boolean) => rows.slice(1).filter(pred).map((r) => r.planet);
  const strongestFirst = [...rows].filter((r) => r.shadbala).sort((a, b) => b.shadbala!.ratio - a.shadbala!.ratio);
  const maxRatio = Math.max(1.6, ...strongestFirst.map((r) => r.shadbala!.ratio));

  return (
    <div className="space-y-8">
      <section aria-label="Birth facts" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {facts.map(([label, value, sub]) => (
          <div key={label} className="card-edge rounded-2xl px-4 py-3">
            <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">{label}</p>
            <p className="mt-1 text-sm font-semibold text-cream">{value}</p>
            {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
          </div>
        ))}
      </section>

      {md && (
        <section className="card-edge rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-cream">Running Vimshottari dasha</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {[
              ["Mahadasha", md],
              ["Antardasha", ad],
              ["Pratyantardasha", pd],
            ].map(([label, p]) =>
              p ? (
                <div key={label as string} className="rounded-xl border border-border/70 px-4 py-3">
                  <p className="text-xs text-muted">{label as string}</p>
                  <p className="font-display text-xl text-gold-bright">{(p as DashaPeriod).lord}</p>
                  <p className="text-xs text-muted font-tabular">
                    {fmt((p as DashaPeriod).start, zone)} → {fmt((p as DashaPeriod).end, zone)}
                  </p>
                </div>
              ) : null
            )}
          </div>
          {nextAds.length > 0 && (
            <p className="mt-3 text-xs text-muted">
              Next antardashas:{" "}
              {nextAds.map((p, i) => (
                <span key={p.lord + i}>
                  {i > 0 && " · "}
                  <span className="text-cream">
                    {md.lord}–{p.lord}
                  </span>{" "}
                  from {fmt(p.start, zone, "LLL yyyy")}
                </span>
              ))}
            </p>
          )}
        </section>
      )}

      <section aria-label="Graha table">
        <h3 className="text-xl font-bold tracking-tight text-cream">Grahas — D1 and D9 at a glance</h3>
        <div className="card-edge mt-4 overflow-x-auto rounded-2xl">
          <table className="w-full text-sm font-tabular">
            <thead>
              <tr className="border-b border-border text-left text-xs whitespace-nowrap text-muted">
                <th className="sticky left-0 bg-surface px-3 py-3">Graha</th>
                <th className="px-3 py-3">Longitude</th>
                <th className="px-3 py-3">D1 sign · degree</th>
                <th className="px-3 py-3">Nakshatra</th>
                <th className="px-3 py-3" title="KP star lord / sub lord">Star · Sub</th>
                <th className="px-3 py-3" title="Whole-sign house / Sripati Bhava Chalit house">House</th>
                <th className="px-3 py-3">D1 dignity</th>
                <th className="px-3 py-3">D9 sign · degree</th>
                <th className="px-3 py-3">D9 dignity</th>
                <th className="px-3 py-3" title="Baladi avastha">Avastha</th>
                <th className="px-3 py-3" title="Jaimini Chara karaka">Karaka</th>
                <th className="px-3 py-3">Lord of</th>
                <th className="px-3 py-3" title="Shadbala in rupas against the required minimum">Shadbala</th>
                <th className="px-3 py-3" title="Shodashavarga Vimshopaka, out of 20">Vimshopaka</th>
              </tr>
            </thead>
            <tbody className="whitespace-nowrap">
              {rows.map((r) => (
                <tr key={r.planet} className={`border-b border-border/50 last:border-0 ${r.planet === "Lagna" ? "bg-gold/5" : ""}`}>
                  <td className={`sticky left-0 px-3 py-2.5 font-semibold ${r.planet === "Lagna" ? "bg-surface text-gold-bright" : "bg-surface text-cream"}`}>
                    {r.planet}
                    {r.retrograde && <abbr title="Retrograde" className="ml-1 text-xs text-rose no-underline">R</abbr>}
                    {r.combust && <abbr title="Combust" className="ml-1 text-xs text-rose no-underline">C</abbr>}
                    {r.vargottama && <abbr title="Vargottama" className="ml-1 text-xs text-gold-bright no-underline">V</abbr>}
                  </td>
                  <td className="px-3 py-2.5 text-muted">{dms(r.longitude)}</td>
                  <td className="px-3 py-2.5 text-cream">
                    {r.sign} {dms(r.degree)}
                  </td>
                  <td className="px-3 py-2.5 text-muted">
                    {r.nakshatra} <span className="text-xs">{r.pada}</span>
                  </td>
                  <td className="px-3 py-2.5 text-muted">
                    {r.starLord} · {r.subLord}
                  </td>
                  <td className="px-3 py-2.5 text-muted">
                    {r.house}
                    {r.chalitHouse !== r.house && <span className="ml-1 text-xs text-gold-bright" title="Bhava Chalit house">→{r.chalitHouse}</span>}
                  </td>
                  <td className="px-3 py-2.5">{r.dignity ? <span className={dignityColorClass(r.dignity)}>{SHORT_DIGNITY[r.dignity]}</span> : <span className="text-muted">—</span>}</td>
                  <td className="px-3 py-2.5 text-cream">
                    {r.d9Sign} {dms(r.d9Degree)}
                  </td>
                  <td className="px-3 py-2.5">{r.d9Dignity ? <span className={dignityColorClass(r.d9Dignity)}>{SHORT_DIGNITY[r.d9Dignity]}</span> : <span className="text-muted">—</span>}</td>
                  <td className="px-3 py-2.5 text-muted">{r.avastha ?? "—"}</td>
                  <td className="px-3 py-2.5 text-muted">{r.karaka ? <abbr title={r.karaka} className="no-underline">{KARAKA_SHORT[r.karaka]}</abbr> : "—"}</td>
                  <td className="px-3 py-2.5 text-muted">{r.rules.length ? r.rules.join(", ") : "—"}</td>
                  <td className="px-3 py-2.5">
                    {r.shadbala ? (
                      <span className={r.shadbala.ratio >= 1 ? "text-gold-bright" : "text-rose"}>
                        {r.shadbala.rupas.toFixed(2)}
                        <span className="text-xs text-muted"> / {r.shadbala.required}</span>
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-muted">{r.vimshopaka != null ? r.vimshopaka.toFixed(1) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-border/50 px-3 py-2.5 text-xs text-muted">
            <span className="text-rose">R</span> retrograde · <span className="text-rose">C</span> combust · <span className="text-gold-bright">V</span> vargottama ·
            House shows whole-sign house <span className="text-gold-bright">→</span> Bhava Chalit house where they differ · Star · Sub are KP lords ·
            Karakas are Jaimini Chara karakas (AK Atmakaraka … DK Darakaraka).
          </p>
        </div>
      </section>

      <section aria-label="D1 and D9 charts" className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-center text-sm font-semibold text-cream">D1 · Rasi ({chart.ascendant.sign} lagna)</h3>
          <KundliChart ascendantSignIndex={chart.ascendant.signIndex} planets={d1Points} style={style} onStyleChange={setStyle} showLegend={false} />
        </div>
        <div>
          <h3 className="mb-3 text-center text-sm font-semibold text-cream">D9 · Navamsa ({d9.ascendant.sign} lagna)</h3>
          <KundliChart ascendantSignIndex={d9.ascendant.signIndex} planets={d9Points} style={style} onStyleChange={setStyle} showLegend={false} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card-edge rounded-2xl p-5" aria-label="Shadbala">
          <h3 className="text-sm font-semibold text-cream">Shadbala, strongest first</h3>
          <p className="mt-1 text-xs text-muted">Rupas as a share of each planet&rsquo;s required minimum; the line marks 100%.</p>
          <ul className="mt-4 space-y-2.5">
            {strongestFirst.map((r) => {
              const pct = (r.shadbala!.ratio / maxRatio) * 100;
              return (
                <li key={r.planet} className="grid grid-cols-[5rem_1fr_3.5rem] items-center gap-3 text-xs">
                  <span className="font-semibold text-cream">{r.planet}</span>
                  <span className="relative h-2.5 rounded-full bg-surface-raised">
                    <span className={`absolute inset-y-0 left-0 rounded-full ${r.shadbala!.ratio >= 1 ? "bg-gold" : "bg-rose"}`} style={{ width: `${pct}%` }} />
                    <span className="absolute inset-y-[-3px] w-px bg-cream/70" style={{ left: `${(1 / maxRatio) * 100}%` }} />
                  </span>
                  <span className="text-right font-tabular text-muted">{Math.round(r.shadbala!.ratio * 100)}%</span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="card-edge rounded-2xl p-5" aria-label="Sarvashtakavarga">
          <h3 className="text-sm font-semibold text-cream">Sarvashtakavarga by house</h3>
          <p className="mt-1 text-xs text-muted">28 is average; 30+ strong, 24 or less weak. Total {chart.ashtakavarga.sarva.reduce((a, b) => a + b, 0)}.</p>
          <ol className="mt-4 grid grid-cols-6 gap-2">
            {Array.from({ length: 12 }, (_, i) => {
              const sign = (chart.ascendant.signIndex + i) % 12;
              const b = chart.ashtakavarga.sarva[sign];
              return (
                <li key={i} className={`rounded-xl border px-2 py-2 text-center ${b >= 30 ? "border-gold/60 bg-gold/10" : b <= 24 ? "border-rose/50 bg-rose/5" : "border-border/70"}`}>
                  <span className="block text-[10px] text-muted">H{i + 1} · {SIGNS[sign].slice(0, 3)}</span>
                  <span className={`font-tabular text-base font-semibold ${b >= 30 ? "text-gold-bright" : b <= 24 ? "text-rose" : "text-cream"}`}>{b}</span>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      <section className="card-edge rounded-2xl p-5" aria-label="Key flags">
        <h3 className="text-sm font-semibold text-cream">Key flags</h3>
        <dl className="mt-3 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          <Flag label="Yogas present" value={present.length ? present.map((y) => y.name).join(", ") : "None of the listed yogas"} />
          <Flag
            label="Doshas"
            value={doshas.length ? doshas.map((d) => `${d.name}${d.cancelled ? " (cancelled)" : ""}`).join(", ") : "None"}
            tone={doshas.some((d) => d.present && !d.cancelled) ? "rose" : undefined}
          />
          <Flag label="Mangal dosha" value={`${chart.mangalDosha.status.charAt(0).toUpperCase()}${chart.mangalDosha.status.slice(1)}${chart.mangalDosha.status === "present" ? ` · ${chart.mangalDosha.severity}` : ""}`} tone={chart.mangalDosha.status === "present" ? "rose" : undefined} />
          <Flag label="Sade Sati (today)" value={chart.sadeSati.active ? `Active · ${chart.sadeSati.phase} phase` : "Not active"} tone={chart.sadeSati.active ? "rose" : undefined} />
          <Flag label="Retrograde" value={flag((r) => r.retrograde && r.planet !== "Rahu" && r.planet !== "Ketu").join(", ") || "None"} />
          <Flag label="Combust" value={flag((r) => r.combust).join(", ") || "None"} />
          <Flag label="Vargottama" value={[...(lagna.vargottama ? ["Lagna"] : []), ...flag((r) => r.vargottama)].join(", ") || "None"} />
          <Flag label="Lagna nakshatra lord" value={`${nakshatraLord(Math.floor(chart.ascendant.siderealLongitude / (360 / 27)))} (${NAKSHATRAS[Math.floor(chart.ascendant.siderealLongitude / (360 / 27))]})`} />
        </dl>
      </section>
    </div>
  );
}

function Flag({ label, value, tone }: { label: string; value: string; tone?: "rose" }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={`mt-0.5 ${tone === "rose" ? "text-rose" : "text-cream"}`}>{value}</dd>
    </div>
  );
}
