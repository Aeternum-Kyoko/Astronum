import { DateTime } from "luxon";
import type { KundaliChart } from "@/lib/astrology/types";
import { NAKSHATRAS, SIGN_SANSKRIT, SIGN_LORDS } from "@/lib/astrology/constants";
import { computeAvakahada, computeBirthPanchang } from "@/lib/astrology/birthDetails";
import { birthTime } from "@/lib/astrology/dashboard";
import { nakshatraLord } from "@/lib/astrology/dasha";

/** The "basic details" block Indian kundli reports open with: birth data, Avakahada Chakra, and birth Panchang. */
export default function BasicDetails({ chart }: { chart: KundaliChart }) {
  const { input } = chart;
  const moon = chart.planets.find((p) => p.planet === "Moon")!;
  const sun = chart.planets.find((p) => p.planet === "Sun")!;
  const avakahada = computeAvakahada(moon);
  const panchang = computeBirthPanchang(sun.siderealLongitude, moon.siderealLongitude);
  // The Vedic weekday turns at sunrise, so a birth before sunrise belongs to the previous day.
  const vara = birthTime(chart)?.vara;
  const birth = DateTime.fromISO(`${input.date}T${input.time}`, { zone: input.timezone });
  const ascNakshatraIndex = Math.floor(chart.ascendant.siderealLongitude / (360 / 27));

  const birthRows: [string, string][] = [
    ["Date", birth.isValid ? birth.toFormat("d LLLL yyyy") : input.date],
    ["Time", birth.isValid ? birth.toFormat("h:mm a") : input.time],
    ["Weekday", vara ? `${vara.name} (${vara.sanskrit})` : birth.isValid ? birth.toFormat("cccc") : "—"],
    ["Place", input.place],
    ["Coordinates", `${formatCoord(input.latitude, "N", "S")}, ${formatCoord(input.longitude, "E", "W")}`],
    ["Timezone", `${input.timezone}${birth.isValid ? ` (UTC${birth.toFormat("ZZ")})` : ""}`],
    ["Ayanamsa", `Lahiri ${chart.ayanamsa.toFixed(4)}°`],
  ];

  const astroRows: [string, string][] = [
    ["Lagna", `${chart.ascendant.sign} (${SIGN_SANSKRIT[chart.ascendant.signIndex]}) ${chart.ascendant.degreeInSign.toFixed(2)}°`],
    ["Lagna lord", SIGN_LORDS[chart.ascendant.signIndex]],
    ["Lagna nakshatra", `${NAKSHATRAS[ascNakshatraIndex]} (lord ${nakshatraLord(ascNakshatraIndex)})`],
    ["Rashi (Moon sign)", `${moon.sign} (${SIGN_SANSKRIT[moon.signIndex]})`],
    ["Rashi lord", avakahada.signLord],
    ["Nakshatra", `${moon.nakshatra}, pada ${moon.pada}`],
    ["Nakshatra lord", avakahada.nakshatraLord],
    ["Sun sign (sidereal)", `${sun.sign} (${SIGN_SANSKRIT[sun.signIndex]})`],
  ];

  const avakahadaRows: [string, string][] = [
    ["Varna", avakahada.varna],
    ["Vashya", avakahada.vashya],
    ["Yoni", avakahada.yoni],
    ["Gana", avakahada.gana],
    ["Nadi", avakahada.nadi],
  ];

  const panchangRows: [string, string][] = [
    ["Tithi", `${panchang.paksha} ${panchang.tithi}`],
    ["Yoga", panchang.yoga],
    ["Karana", panchang.karana],
    [
      "Sade Sati",
      chart.sadeSati.active ? `Active — ${chart.sadeSati.phase} phase` : "Not active",
    ],
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <DetailTable title="Birth Details" rows={birthRows} />
      <DetailTable title="Astrological Details" rows={astroRows} />
      <DetailTable title="Avakahada Chakra" rows={avakahadaRows} note="Used in Ashtakoota (Guna Milan) matching." />
      <DetailTable
        title="Panchang at Birth"
        rows={panchangRows}
        note="Tithi, yoga and karana from the Sun–Moon positions at the moment of birth."
      />
    </div>
  );
}

function DetailTable({ title, rows, note }: { title: string; rows: [string, string][]; note?: string }) {
  return (
    <section className="card-edge rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-cream">{title}</h3>
      <dl className="mt-3 divide-y divide-border/50 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 py-2">
            <dt className="shrink-0 text-muted">{label}</dt>
            <dd className="text-right font-medium text-cream">{value}</dd>
          </div>
        ))}
      </dl>
      {note && <p className="mt-3 text-xs text-muted">{note}</p>}
    </section>
  );
}

function formatCoord(value: number, pos: string, neg: string): string {
  const totalMinutes = Math.round(Math.abs(value) * 60);
  const deg = Math.floor(totalMinutes / 60);
  const min = totalMinutes % 60;
  return `${deg}°${String(min).padStart(2, "0")}′ ${value >= 0 ? pos : neg}`;
}
