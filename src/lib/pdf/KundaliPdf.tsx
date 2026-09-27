import { Document, Page, Text, View, StyleSheet, Svg, Polygon, Line, Rect, Text as SvgText } from "@react-pdf/renderer";
import type { KundaliChart } from "@/lib/astrology/types";
import type { KundaliReport } from "@/lib/astrology/report";
import type { RemedyPlan } from "@/lib/astrology/remedies";
import { PLANET_REMEDIES } from "@/lib/astrology/remedies";
import { computeAvakahada, computeBirthPanchang } from "@/lib/astrology/birthDetails";
import { nakshatraLord } from "@/lib/astrology/dasha";
import { NAKSHATRAS } from "@/lib/astrology/constants";
import { analyzeYogas } from "@/lib/astrology/yogaAnalysis";
import { A, B, C, D, HOUSE_LABEL_ANCHORS, HOUSE_POLYGONS, P1, P2, P3, P4, PLANET_ABBR, polygonPoints } from "@/lib/chartGeometry";

/**
 * The downloadable kundli report, rendered server-side to PDF. Uses the
 * built-in Helvetica font (Latin only), so it is English regardless of the
 * page language.
 */

const GOLD = "#9a6b1f";
const INK = "#1a1a1a";
const MUTED = "#555555";
const RULE = "#d8c9ad";

const s = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 50, paddingHorizontal: 42, fontSize: 9.5, color: INK, fontFamily: "Helvetica", lineHeight: 1.45 },
  brand: { fontSize: 10, color: GOLD, letterSpacing: 2 },
  title: { fontSize: 22, fontFamily: "Helvetica-Bold", marginTop: 4, lineHeight: 1.2 },
  sub: { color: MUTED, marginTop: 6 },
  h2: { fontSize: 13, fontFamily: "Helvetica-Bold", color: GOLD, marginTop: 16, marginBottom: 6 },
  h3: { fontSize: 10.5, fontFamily: "Helvetica-Bold", marginTop: 8 },
  p: { marginTop: 3 },
  muted: { color: MUTED },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: RULE, paddingVertical: 3 },
  th: { fontFamily: "Helvetica-Bold", fontSize: 8.5, color: MUTED },
  cols: { flexDirection: "row", gap: 16 },
  col: { flex: 1 },
  kv: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 0.5, borderBottomColor: RULE, paddingVertical: 2.5 },
  footer: { position: "absolute", bottom: 22, left: 42, right: 42, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: MUTED },
});

const fmtDate = (d: Date | string) => new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
const fmtMonth = (d: Date | string) => new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "short" });
const ord = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;

function KV({ k, v }: { k: string; v: string }) {
  return (
    <View style={s.kv}>
      <Text style={s.muted}>{k}</Text>
      <Text>{v}</Text>
    </View>
  );
}

function Table({ head, rows, widths }: { head: string[]; rows: string[][]; widths: number[] }) {
  return (
    <View>
      <View style={s.row}>
        {head.map((h, i) => (
          <Text key={h} style={[s.th, { width: `${widths[i]}%` }]}>
            {h}
          </Text>
        ))}
      </View>
      {rows.map((r, ri) => (
        <View key={ri} style={s.row} wrap={false}>
          {r.map((c, i) => (
            <Text key={i} style={{ width: `${widths[i]}%` }}>
              {c}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

function ChartSvg({ ascendantSignIndex, planets }: { ascendantSignIndex: number; planets: { planet: string; house: number; retrograde: boolean }[] }) {
  return (
    <Svg viewBox="0 0 400 400" style={{ width: 230, height: 230 }}>
      <Rect x={2} y={2} width={396} height={396} stroke={GOLD} strokeWidth={2} fill="#fffdf9" />
      <Line x1={A[0]} y1={A[1]} x2={C[0]} y2={C[1]} stroke={GOLD} strokeWidth={1} />
      <Line x1={B[0]} y1={B[1]} x2={D[0]} y2={D[1]} stroke={GOLD} strokeWidth={1} />
      <Polygon points={`${P1.join(",")} ${P2.join(",")} ${P3.join(",")} ${P4.join(",")}`} stroke={GOLD} strokeWidth={1} fill="none" />
      <Polygon points={polygonPoints(HOUSE_POLYGONS[0])} fill="#f3ecdf" stroke="none" />
      {HOUSE_LABEL_ANCHORS.map(([x, y], i) => {
        const house = i + 1;
        const sign = ((ascendantSignIndex + i) % 12) + 1;
        const occupants = planets.filter((p) => p.house === house);
        return (
          <View key={house}>
            <SvgText x={x - 4} y={y - 12} style={{ fontSize: 11 }} fill={MUTED}>
              {String(sign)}
            </SvgText>
            {occupants.map((p, idx) => (
              <SvgText key={p.planet} x={x - 10} y={y + 4 + idx * 14} style={{ fontSize: 13, fontFamily: "Helvetica-Bold" }} fill={INK}>
                {`${PLANET_ABBR[p.planet]}${p.retrograde && p.planet !== "Rahu" && p.planet !== "Ketu" ? "(R)" : ""}`}
              </SvgText>
            ))}
          </View>
        );
      })}
    </Svg>
  );
}

function Footer({ name }: { name: string }) {
  return (
    <View style={s.footer} fixed>
      <Text>Astronum · Kundli report for {name}</Text>
      <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
  );
}

export default function KundaliPdf({ chart, report, remedies }: { chart: KundaliChart; report: KundaliReport; remedies: RemedyPlan }) {
  const { input } = chart;
  const moon = chart.planets.find((p) => p.planet === "Moon")!;
  const sun = chart.planets.find((p) => p.planet === "Sun")!;
  const av = computeAvakahada(moon);
  const pan = computeBirthPanchang(sun.siderealLongitude, moon.siderealLongitude);
  const ascNak = Math.floor(chart.ascendant.siderealLongitude / (360 / 27));

  return (
    <Document title={`Kundli report — ${input.name}`} author="Astronum" subject="Vedic birth chart">
      <Page size="A4" style={s.page}>
        <Text style={s.brand}>ASTRONUM</Text>
        <Text style={s.title}>{input.name}&rsquo;s Kundli Report</Text>
        <Text style={s.sub}>
          Born {input.date} at {input.time}, {input.place} · Lahiri ayanamsa {chart.ayanamsa.toFixed(4)}°
        </Text>

        <View style={[s.cols, { marginTop: 14 }]}>
          <View style={s.col}>
            <Text style={s.h2}>Birth chart (Lagna)</Text>
            <ChartSvg ascendantSignIndex={chart.ascendant.signIndex} planets={chart.planets} />
          </View>
          <View style={s.col}>
            <Text style={s.h2}>Basic details</Text>
            <KV k="Lagna" v={`${chart.ascendant.sign} ${chart.ascendant.degreeInSign.toFixed(2)}°`} />
            <KV k="Rashi (Moon sign)" v={`${moon.sign} — lord ${av.signLord}`} />
            <KV k="Nakshatra" v={`${moon.nakshatra} ${moon.pada} — lord ${av.nakshatraLord}`} />
            <KV k="Lagna nakshatra" v={`${NAKSHATRAS[ascNak]} — lord ${nakshatraLord(ascNak)}`} />
            <KV k="Varna · Vashya" v={`${av.varna} · ${av.vashya}`} />
            <KV k="Yoni · Gana · Nadi" v={`${av.yoni} · ${av.gana} · ${av.nadi}`} />
            <KV k="Tithi" v={`${pan.paksha} ${pan.tithi}`} />
            <KV k="Yoga · Karana" v={`${pan.yoga} · ${pan.karana}`} />
            <KV k="Mangal Dosha" v={chart.mangalDosha.status === "present" ? `Present (${chart.mangalDosha.severity})` : chart.mangalDosha.status === "cancelled" ? "Cancelled" : "No"} />
            <KV k="Sade Sati" v={chart.sadeSati.active ? `Active (${chart.sadeSati.phase})` : "Not active"} />
          </View>
        </View>

        <Text style={s.h2}>Planetary positions</Text>
        <Table
          head={["Planet", "Sign", "Degree", "Nakshatra", "House", "Dignity"]}
          widths={[14, 16, 12, 26, 10, 22]}
          rows={chart.planets.map((p) => [
            `${p.planet}${p.retrograde && p.planet !== "Rahu" && p.planet !== "Ketu" ? " (R)" : ""}`,
            p.sign,
            `${p.degreeInSign.toFixed(2)}°`,
            `${p.nakshatra} (${p.pada})`,
            String(p.house),
            p.dignity ?? "—",
          ])}
        />
        <Footer name={input.name} />
      </Page>

      <Page size="A4" style={s.page}>
        <Text style={s.h2}>Life areas at a glance</Text>
        {report.lifeAreas.map((a) => (
          <View key={a.key} wrap={false} style={{ marginBottom: 6 }}>
            <Text style={s.h3}>
              {a.title} — {a.rating}/5 · {a.verdict}
            </Text>
            <Text style={s.p}>{a.summary}</Text>
            {a.points.slice(0, 3).map((pt) => (
              <Text key={pt} style={[s.p, s.muted]}>
                • {pt}
              </Text>
            ))}
            {a.periods.length > 0 && (
              <Text style={[s.p, { color: GOLD }]}>
                In focus: {a.periods.map((p) => `${p.label} (${fmtMonth(p.start)}–${fmtMonth(p.end)})`).join("; ")}
              </Text>
            )}
          </View>
        ))}
        <Footer name={input.name} />
      </Page>

      <Page size="A4" style={s.page}>
        <Text style={s.h2}>House by house</Text>
        {report.houses.map((h) => (
          <View key={h.house} style={{ marginBottom: 7 }}>
            <Text style={s.h3} minPresenceAhead={40}>
              {ord(h.house)} house ({h.sanskrit}) — {h.sign}, lord {h.lord} in the {ord(h.lordHouse)} · {h.strength.verdict} {h.strength.score}/100
            </Text>
            <Text style={s.p}>{h.summary}</Text>
            <Text style={[s.p, s.muted]}>{h.lordText}</Text>
            {h.occupants.map((o) => (
              <Text key={o.planet} style={[s.p, s.muted]}>
                • {o.planet}: {o.text} {o.note ?? ""}
              </Text>
            ))}
            <Text style={[s.p, s.muted]}>
              {h.aspectText} {h.savText} Body: {h.body}.
            </Text>
          </View>
        ))}
        <Footer name={input.name} />
      </Page>

      <Page size="A4" style={s.page}>
        <Text style={s.h2}>Career</Text>
        {report.career.tenth.text.map((t) => (
          <Text key={t} style={s.p}>
            {t}
          </Text>
        ))}
        {report.career.d10?.text.map((t) => (
          <Text key={t} style={s.p}>
            {t}
          </Text>
        ))}
        <Text style={s.p}>{report.career.amatyaText}</Text>
        <Text style={s.h3}>Suitable fields</Text>
        {report.career.fields.map((f) => (
          <Text key={f.planet} style={s.p}>
            • Through {f.planet}: {f.fields.join(", ")}. <Text style={s.muted}>({f.why})</Text>
          </Text>
        ))}
        <Text style={s.h3}>
          Job or business: {report.career.mode.verdict === "Either" ? "either suits" : report.career.mode.verdict.toLowerCase()} (employment {report.career.mode.jobScore}, business {report.career.mode.businessScore})
        </Text>
        {report.career.mode.reasons.map((r) => (
          <Text key={r} style={[s.p, s.muted]}>
            • {r}
          </Text>
        ))}
        <Text style={s.h3}>Career timing</Text>
        <Table head={["Period", "From", "To", "Kind", "Why"]} widths={[16, 14, 14, 10, 46]} rows={report.career.periods.map((p) => [p.label, fmtMonth(p.start), fmtMonth(p.end), p.kind, p.why])} />

        <Text style={s.h2}>Yogas by lordship</Text>
        {analyzeYogas(chart, new Date(report.generatedAt)).findings.filter((f) => f.strength !== "Weak").map((f) => (
          <View key={f.id} wrap={false} style={{ marginBottom: 4 }}>
            <Text style={s.h3}>
              {f.name} — {f.strength}
            </Text>
            <Text style={s.p}>{f.formation}</Text>
            <Text style={[s.p, s.muted]}>{f.effect}</Text>
          </View>
        ))}
        <Footer name={input.name} />
      </Page>

      <Page size="A4" style={s.page}>
        <Text style={s.h2}>Life timeline by age</Text>
        <Text style={[s.p, s.muted]}>Each sub-period with the events it most likely brings. Tendencies to plan around, not certainties.</Text>
        {report.timeline.mahas.map((m) => (
          <View key={m.lord + String(m.start)} style={{ marginTop: 6 }}>
            <Text style={s.h3} minPresenceAhead={40}>
              Age {Math.floor(m.ageStart)}–{Math.floor(m.ageEnd)}: {m.lord} Mahadasha ({fmtMonth(m.start)} – {fmtMonth(m.end)}) · {m.tone}
            </Text>
            <Text style={[s.p, s.muted]}>{m.summary}</Text>
            {m.antars
              .filter((a) => a.themes.length)
              .map((a) => (
                <Text key={a.lord + String(a.start)} style={s.p}>
                  • Age {Math.floor(a.ageStart)}–{Math.floor(a.ageEnd)}, {m.lord}–{a.lord}: {a.themes.map((t) => t.label).join("; ")}
                </Text>
              ))}
          </View>
        ))}
        <Text style={s.h3}>Milestones</Text>
        {report.timeline.milestones.map((ms) => (
          <Text key={ms.label + String(ms.date)} style={[s.p, s.muted]}>
            • Age {Math.round(ms.age)} — {ms.label}: {ms.text}
          </Text>
        ))}
        <Footer name={input.name} />
      </Page>

      <Page size="A4" style={s.page}>
        <Text style={s.h2}>Life sectors</Text>
        {report.sectors.map((sec) => (
          <View key={sec.key} style={{ marginBottom: 8 }}>
            <Text style={s.h3} minPresenceAhead={40}>
              {sec.title} — {sec.verdict} ({sec.score}/100)
            </Text>
            <Text style={s.p}>{sec.promise}</Text>
            {sec.traits.map((t) => (
              <Text key={t} style={[s.p, s.muted]}>
                • {t}
              </Text>
            ))}
            {sec.stages
              .filter((st) => st.windows.length)
              .map((st) => (
                <Text key={st.label} style={s.p}>
                  ◦ {st.label} (ages {st.ages[0]}–{st.ages[1]}): {st.windows.map((w) => `${w.label} at ${w.ages}`).join("; ")}
                </Text>
              ))}
            {sec.peak && <Text style={[s.p, { color: GOLD }]}>Best window: {sec.peak}</Text>}
          </View>
        ))}
        <Footer name={input.name} />
      </Page>

      <Page size="A4" style={s.page}>
        <Text style={s.h2}>Yogini and Chara dasha</Text>
        <Table
          head={["Yogini", "Lord", "From", "To", "Nature"]}
          widths={[20, 15, 22, 22, 21]}
          rows={report.yogini.slice(0, 14).map((y) => [y.yogini.name, y.yogini.lord, fmtMonth(y.start), fmtMonth(y.end), y.yogini.nature])}
        />
        <Text style={s.h3}>Chara karakas</Text>
        <Text style={s.p}>{report.chara.karakas.map((k) => `${k.karaka}: ${k.planet}`).join(" · ")}</Text>
        <Table
          head={["Chara dasha sign", "House", "Years", "From", "To"]}
          widths={[26, 14, 12, 24, 24]}
          rows={report.chara.periods.slice(0, 14).map((p) => [p.sign, ord(p.house), String(p.years), fmtMonth(p.start), fmtMonth(p.end)])}
        />
        <Text style={s.h2}>KP system</Text>
        <Table
          head={["Cusp", "Sign", "Sign lord", "Star lord", "Sub lord"]}
          widths={[12, 22, 22, 22, 22]}
          rows={report.kp.cusps.map((c) => [String(c.house), c.sign, c.signLord, c.starLord, c.subLord])}
        />
        {report.kp.promises.map((p) => (
          <Text key={p.event} style={s.p}>
            • <Text style={{ fontFamily: "Helvetica-Bold" }}>{p.event}: {p.verdict}.</Text> {p.reason}
          </Text>
        ))}
        <Footer name={input.name} />
      </Page>

      <Page size="A4" style={s.page}>
        <Text style={s.h2}>Vimshottari dasha</Text>
        <Table
          head={["Mahadasha", "From", "To", "Tone"]}
          widths={[25, 25, 25, 25]}
          rows={report.dashaDetail.map((d) => [d.lord, fmtDate(d.start), fmtDate(d.end), d.tone])}
        />
        {report.dashaDetail
          .filter((d) => new Date(d.end) > new Date(report.generatedAt))
          .slice(0, 2)
          .map((d) => (
            <View key={`${d.lord}-${String(d.start)}`}>
              <Text style={s.h3} minPresenceAhead={40}>
                {d.lord} Mahadasha ({fmtMonth(d.start)} – {fmtMonth(d.end)}) · {d.tone}
              </Text>
              <Text style={s.p}>{d.overview}</Text>
              {d.condition.map((c) => (
                <Text key={c} style={[s.p, s.muted]}>
                  • {c}
                </Text>
              ))}
              {d.areas.map((a) => (
                <Text key={a.area} style={s.p}>
                  • <Text style={{ fontFamily: "Helvetica-Bold" }}>{a.area}:</Text> {a.effect}
                </Text>
              ))}
              {d.sadeSati && <Text style={[s.p, s.muted]}>{d.sadeSati}</Text>}
              <Text style={[s.p, s.muted]}>
                Focus: {d.advice.focus.join("; ")}. Avoid: {d.advice.avoid.join("; ")}.
              </Text>
              {d.antars
                .filter((x) => new Date(x.end) > new Date(report.generatedAt))
                .map((x) => (
                  <Text key={String(x.start)} style={s.p}>
                    ◦ {d.lord}–{x.lord} ({fmtMonth(x.start)} – {fmtMonth(x.end)}, {x.tone.toLowerCase()}): {x.reasons.slice(1).join(" ")} {x.events.length ? `Likely: ${x.events.map((e) => e.split(" — ")[0]).join("; ")}.` : ""}
                  </Text>
                ))}
            </View>
          ))}

        <Text style={s.h2}>Planet readings</Text>
        {report.planets.map((r) => (
          <View key={r.planet} wrap={false} style={{ marginBottom: 4 }}>
            <Text style={s.h3}>{r.headline}</Text>
            <Text style={s.p}>{r.house}</Text>
            <Text style={[s.p, s.muted]}>{r.sign}</Text>
          </View>
        ))}
        <Footer name={input.name} />
      </Page>

      <Page size="A4" style={s.page}>
        <Text style={s.h2}>Yogas and doshas</Text>
        {chart.yogas.filter((y) => y.present).map((y) => (
          <Text key={y.name} style={s.p}>
            • <Text style={{ fontFamily: "Helvetica-Bold" }}>{y.name}</Text> — {y.description}
          </Text>
        ))}
        {chart.doshas.map((d) => (
          <Text key={d.name} style={s.p}>
            • <Text style={{ fontFamily: "Helvetica-Bold" }}>{d.name}</Text> ({d.present ? "present" : d.cancelled ? "cancelled" : "not present"}) — {d.description}
          </Text>
        ))}

        <Text style={s.h2}>Remedies</Text>
        {remedies.stones.map((st) => (
          <Text key={st.kind} style={s.p}>
            • {st.kind}: {st.gem} for {st.planet} — {PLANET_REMEDIES[st.planet].metal}, {PLANET_REMEDIES[st.planet].finger.toLowerCase()}, on a{" "}
            {PLANET_REMEDIES[st.planet].day}.
          </Text>
        ))}
        {remedies.support.map((sp) => (
          <Text key={sp.planet} style={s.p}>
            • {sp.planet}: chant {PLANET_REMEDIES[sp.planet].mantra} (108×); {PLANET_REMEDIES[sp.planet].charity.toLowerCase()}.
          </Text>
        ))}

        <Text style={s.h2}>Current transits</Text>
        <Table
          head={["Planet", "Transit sign", "From Moon", "Effect", "Next change"]}
          widths={[14, 20, 14, 18, 34]}
          rows={report.transits.map((t) => [t.planet, t.sign, ord(t.houseFromMoon), t.favourable ? "Favourable" : "Challenging", t.next ? `${t.next.sign}, ${fmtDate(t.next.date)}` : "—"])}
        />
        <Text style={[s.p, s.muted, { marginTop: 18, fontSize: 8 }]}>
          Generated {fmtDate(report.generatedAt)} from classical Vedic rules and astronomical calculation. This report is
          for guidance and self-reflection; it is not medical, legal or financial advice.
        </Text>
        <Footer name={input.name} />
      </Page>
    </Document>
  );
}
