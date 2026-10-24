"use client";
import { useMemo, useState } from "react";
import type { KundaliChart } from "@/lib/astrology/types";
import {
  ASHTAKAVARGA_PLANETS,
  SIGNS,
  type AshtakavargaPlanet,
} from "@/lib/astrology/constants";
import {
  ashtakavargaAdvanced,
  KAKSHYA_LORDS,
} from "@/lib/astrology/ashtakavargaAdvanced";
import { analyzeBhavaStrength } from "@/lib/astrology/bhavaStrength";
import { planetDiagnosis } from "@/lib/astrology/planetDiagnosis";
import { analyzeYogas, type YogaCategory } from "@/lib/astrology/yogaAnalysis";
import { inspectChart } from "@/lib/astrology/chartInspection";
import { houseSignification } from "@/lib/astrology/content";
import { term } from "@/lib/i18n/terms";
import { useAnalysis } from "./AnalysisContext";
import {
  Research,
  Panel,
  Facts,
  Table,
  Tabs,
  Disclosure,
  Notes,
  Meter,
  useResearchCopy,
  useDateLabel,
} from "./ResearchUI";
type Props = { chart: KundaliChart; go: (slug: string) => void };

export function ShadbalaWorkspace({ chart }: Props) {
  const { locale, L } = useResearchCopy();
  const [view, setView] = useState<"ranking" | "components" | "diagnosis">(
    "ranking",
  );
  const [sort, setSort] = useState("ratio");
  const [planet, setPlanet] = useState<AshtakavargaPlanet>("Moon");
  const ranked = [...chart.shadbala].sort((a, b) =>
    sort === "ratio"
      ? b.rupas / b.requiredRupas - a.rupas / a.requiredRupas
      : b.rupas - a.rupas,
  );
  const selected = chart.shadbala.find((p) => p.planet === planet)!;
  const diagnosis = useMemo(() => planetDiagnosis(chart), [chart]);
  return (
    <Research kind="shadbala">
      <Facts
        items={[
          {
            label: L(
              "Strongest relative to requirement",
              "मानक के सापेक्ष सबसे अधिक",
            ),
            value: term(locale, ranked[0].planet),
          },
          {
            label: L("Meeting their minimum", "न्यूनतम बल पूरा"),
            value: `${chart.shadbala.filter((p) => p.isStrong).length} / 7`,
          },
          {
            label: L("Reading convention", "पढ़ने का नियम"),
            value: "100% = minimum",
            note: L(
              "Strength is not an outcome probability",
              "बल घटना का प्रतिशत नहीं है",
            ),
          },
        ]}
      />
      <Tabs
        label="Shadbala chapters"
        value={view}
        onChange={setView}
        items={[
          { key: "ranking", label: L("Ranked strength", "बल क्रम") },
          {
            key: "components",
            label: L("Six-component audit", "छह बलों का विवरण"),
          },
          {
            key: "diagnosis",
            label: L("Combined diagnosis", "समग्र ग्रह स्थिति"),
          },
        ]}
      />
      {view === "ranking" ? (
        <Panel
          title="Planetary capacity against its own requirement"
          actions={
            <select
              aria-label="Rank planetary strength by"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="ratio">Relative to requirement</option>
              <option value="total">Total Rupas</option>
            </select>
          }
        >
          {ranked.map((p, i) => (
            <Meter
              key={p.planet}
              label={`${i + 1}. ${term(locale, p.planet)} · ${Math.round((p.rupas / p.requiredRupas) * 100)}%`}
              value={p.rupas}
              max={p.requiredRupas * 2}
              note={`${p.rupas.toFixed(2)} / ${p.requiredRupas} Rupas · ${p.isStrong ? "meets minimum" : "below minimum"}. Full bar = twice the requirement.`}
            />
          ))}
        </Panel>
      ) : view === "components" ? (
        <>
          <Panel title="Inspect one planet’s six sources of strength">
            <Tabs
              label="Planet for Shadbala audit"
              value={planet}
              onChange={setPlanet}
              items={ASHTAKAVARGA_PLANETS.map((p) => ({
                key: p,
                label: term(locale, p),
              }))}
            />
            <div className="research-grid research-grid-three">
              {[
                {
                  label: "Sthana · position",
                  value: selected.sthanaBala,
                  note: "Exaltation, divisional and positional factors",
                },
                {
                  label: "Dig · direction",
                  value: selected.digBala,
                  note: "Actual ascendant degree and planetary longitude",
                },
                {
                  label: "Kaala · time",
                  value: selected.kaalaBala,
                  note: "Partial: Nathonnata and Paksha components",
                },
                {
                  label: "Chesta · motion",
                  value: selected.chestaBala,
                  note: "Approximation from motion and speed",
                },
                {
                  label: "Naisargika · nature",
                  value: selected.naisargikaBala,
                  note: "Fixed classical natural strength",
                },
                {
                  label: "Drik · aspects",
                  value: selected.drikBala,
                  note: "Graded aspect approximation",
                },
              ].map((c) => (
                <article key={c.label} className="research-stage">
                  <h4>{c.label}</h4>
                  <strong>{c.value.toFixed(2)} Virupas</strong>
                  <p>{c.note}</p>
                </article>
              ))}
            </div>
          </Panel>
          <Panel title="Compare every component">
            <Table
              caption="Components in Virupas; total and requirement in Rupas"
              columns={[
                "Planet",
                "Sthana",
                "Dig",
                "Kaala",
                "Chesta",
                "Naisargika",
                "Drik",
                "Total Rupas",
                "Required",
              ]}
              rows={ranked.map((p) => [
                p.planet,
                ...[
                  p.sthanaBala,
                  p.digBala,
                  p.kaalaBala,
                  p.chestaBala,
                  p.naisargikaBala,
                  p.drikBala,
                  p.rupas,
                  p.requiredRupas,
                ].map((v) => v.toFixed(2)),
              ])}
            />
          </Panel>
        </>
      ) : (
        <Panel title="Read strength alongside natal condition">
          {diagnosis.map((p) => (
            <Disclosure key={p.planet} title={`${p.planet} · ${p.grade}`}>
              <Meter label={p.planet} value={p.score} note={p.summary} />
              <Table
                caption={`${p.planet} rule contributions`}
                columns={["Factor", "Contribution"]}
                rows={p.factors.map((f) => [f.label, f.points])}
              />
            </Disclosure>
          ))}
        </Panel>
      )}
      <Disclosure title="Calculation coverage and units">
        <Notes
          items={[
            "One Rupa is 60 Virupas. Each planet has its own minimum; compare relative strength rather than only raw totals.",
            "Kaala Bala is partial. Chesta and Drik are approximations. This is not a complete classical Shadbala implementation.",
            "Dignity, rulership, conjunctions and aspects still matter: high capacity is not the same as favourable results.",
          ]}
        />
      </Disclosure>
    </Research>
  );
}

export function AshtakavargaWorkspace({ chart }: Props) {
  const { locale } = useResearchCopy();
  const [target, setTarget] = useState<AshtakavargaPlanet | "Sarva">("Sarva");
  const [auditPlanet, setAuditPlanet] = useState<AshtakavargaPlanet>("Jupiter");
  const [view, setView] = useState<
    "map" | "contributors" | "reductions" | "kakshya"
  >("map");
  const [sign, setSign] = useState(chart.ascendant.signIndex);
  const d = useMemo(
    () =>
      ashtakavargaAdvanced(chart, target === "Sarva" ? auditPlanet : target),
    [chart, target, auditPlanet],
  );
  const values =
    target === "Sarva"
      ? chart.ashtakavarga.sarva
      : chart.ashtakavarga.bhinna[target];
  const order = Array.from(
    { length: 12 },
    (_, i) => (chart.ascendant.signIndex + i) % 12,
  );
  return (
    <Research kind="ashtakavarga">
      <Panel title="Raw sign support">
        <Tabs
          label="Ashtakavarga target"
          value={target}
          onChange={setTarget}
          items={[
            { key: "Sarva", label: "Sarva · combined" },
            ...ASHTAKAVARGA_PLANETS.map((p) => ({
              key: p,
              label: term(locale, p),
            })),
          ]}
        />
        <Facts
          items={[
            {
              label: "Matrix",
              value:
                target === "Sarva" ? "Sarvashtakavarga" : "Bhinnashtakavarga",
            },
            { label: "Raw total", value: values.reduce((a, b) => a + b, 0) },
            {
              label: "Selected sign",
              value: term(locale, SIGNS[sign]),
              note: `${values[sign]} raw bindus`,
            },
          ]}
        />
        <div className="research-calendar">
          {order.map((i) => (
            <button
              type="button"
              key={i}
              aria-pressed={sign === i}
              onClick={() => setSign(i)}
            >
              <strong>
                {term(locale, SIGNS[i])} · {values[i]}
              </strong>
              <small>
                House {((i - chart.ascendant.signIndex + 12) % 12) + 1} ·{" "}
                {target === "Sarva"
                  ? values[i] >= 30
                    ? "supporting"
                    : values[i] <= 24
                      ? "demanding"
                      : "mixed"
                  : values[i] >= 5
                    ? "supporting"
                    : values[i] <= 3
                      ? "demanding"
                      : "mixed"}
              </small>
            </button>
          ))}
        </div>
      </Panel>
      <Tabs
        label="Ashtakavarga investigation"
        value={view}
        onChange={setView}
        items={[
          { key: "map", label: "House meanings" },
          { key: "contributors", label: "Who contributes" },
          { key: "reductions", label: "Reduction audit" },
          { key: "kakshya", label: "Eight Kakshyas" },
        ]}
      />
      {target === "Sarva" && view !== "map" && (
        <label>
          Planet for detailed BAV audit
          <select
            value={auditPlanet}
            onChange={(e) =>
              setAuditPlanet(e.target.value as AshtakavargaPlanet)
            }
          >
            {ASHTAKAVARGA_PLANETS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
      )}
      {view === "map" ? (
        <Panel title="What the selected sign relates to">
          <Notes
            items={[
              houseSignification(
                ((sign - chart.ascendant.signIndex + 12) % 12) + 1,
                locale,
              ),
              "Raw SAV bands: 30+ supporting, 25–29 mixed, 24 or less demanding. Raw BAV bands: 5–8 supporting, 4 mixed, 0–3 demanding.",
            ]}
          />
          <Table
            caption="Raw scores in natal-house order"
            columns={["House", "Sign", "Bindus"]}
            rows={order.map((s, i) => [
              i + 1,
              term(locale, SIGNS[s]),
              values[s],
            ])}
          />
        </Panel>
      ) : view === "contributors" ? (
        <Panel title="Prastara contributor matrix">
          <Table
            caption={`${target === "Sarva" ? auditPlanet : target} contributions: 1 contributes, 0 does not`}
            columns={["Contributor", ...SIGNS.map((s) => term(locale, s))]}
            rows={d.contributors.map((row) => [
              row.contributor,
              ...row.bindus.map((v) => (v ? "1" : "0")),
            ])}
          />
        </Panel>
      ) : view === "reductions" ? (
        <Panel title="Follow raw values through both reductions">
          <Table
            caption="Reduced values do not replace raw BAV or SAV"
            columns={["Step", ...SIGNS]}
            rows={[
              ["Raw BAV", ...d.raw],
              ["After Trikona", ...d.trikona.values],
              ["After Ekadhipatya", ...d.ekadhipatya.values],
            ]}
          />
          <Facts
            items={[
              { label: "Rasi pinda", value: d.rasiPinda },
              { label: "Graha pinda", value: d.grahaPinda },
              { label: "Sodhya pinda", value: d.sodhyaPinda },
            ]}
          />
          {[
            { name: "Trikona", steps: d.trikona.steps },
            { name: "Ekadhipatya", steps: d.ekadhipatya.steps },
          ].map((g) => (
            <Disclosure title={`${g.name} calculation steps`} key={g.name}>
              <Notes
                items={g.steps.map(
                  (s) =>
                    `${s.signs.map((i) => SIGNS[i]).join(" / ")}: ${s.before.join(" / ")} → ${s.after.join(" / ")}. ${s.rule}`,
                )}
              />
            </Disclosure>
          ))}
        </Panel>
      ) : (
        <Panel title={`Eight 3°45′ segments · ${SIGNS[sign]}`}>
          <div className="research-grid">
            {KAKSHYA_LORDS.map((lord, i) => (
              <article className="research-stage" key={lord}>
                <h4>{lord}</h4>
                <p>
                  {(i * 3.75).toFixed(2)}° — {((i + 1) * 3.75).toFixed(2)}°
                </p>
                <small>
                  {d.contributors.find((c) => c.contributor === lord)!.bindus[
                    sign
                  ]
                    ? "Contributes 1"
                    : "Contributes 0"}{" "}
                  in raw BAV
                </small>
              </article>
            ))}
          </div>
        </Panel>
      )}
      <p className="research-caption">
        These scores describe support under this method. Reductions and pindas
        are separate calculations; no longevity or event probability is
        inferred.
      </p>
    </Research>
  );
}

export function HouseRulersWorkspace({ chart, go }: Props) {
  const a = useAnalysis()!;
  const { locale } = useResearchCopy();
  const [house, setHouse] = useState(1);
  const strength = useMemo(
    () =>
      analyzeBhavaStrength(
        chart.ascendant.signIndex,
        chart.planets,
        chart.shadbala,
      ),
    [chart],
  );
  const d = inspectChart(chart, "D1", { kind: "house", house }, a.at);
  const score = strength.find((s) => s.house === house)!;
  return (
    <Research kind="lords">
      <Panel title="Follow a house through its ruler">
        <Tabs
          label="Choose a house ruler"
          value={String(house)}
          onChange={(v) => setHouse(Number(v))}
          items={chart.houseLords.map((h) => ({
            key: String(h.house),
            label: `${h.house} · ${h.lord}`,
          }))}
        />
        <Facts
          items={[
            { label: "House sign", value: term(locale, d.sign) },
            { label: "House ruler", value: term(locale, d.lord) },
            {
              label: "Ruler’s destination",
              value: `House ${d.lordPlacement.house}`,
              note: term(locale, d.lordPlacement.sign),
            },
            {
              label: "Aspected by",
              value: d.incoming.map((p) => p.planet).join(", ") || "None",
            },
          ]}
        />
        <Notes
          items={[d.houseReading?.reading ?? houseSignification(house, locale)]}
        />
        <Meter
          label="Relative house-support heuristic"
          value={score.score}
          note={score.rationale}
        />
        <button
          type="button"
          onClick={() => {
            go("rasi");
            a.update({ selected: { kind: "house", house } });
          }}
        >
          Open this house in D1
        </button>
      </Panel>
      <Panel title="All twelve ownership links">
        <Table
          caption="Whole-sign natal rulerships"
          columns={[
            "House",
            "Sign",
            "Ruler",
            "Ruler’s house",
            "Ruler’s sign",
            "Support heuristic",
          ]}
          rows={chart.houseLords.map((h) => [
            h.house,
            h.sign,
            h.lord,
            h.lordHouse,
            h.lordSign,
            `${strength.find((s) => s.house === h.house)!.score.toFixed(0)}/100`,
          ])}
        />
      </Panel>
      <p className="research-caption">
        The support score combines implemented lord, occupant and aspect checks.
        It is not the complete classical Bhava Bala system.
      </p>
    </Research>
  );
}

export function YogaWorkspace({ chart, go }: Props) {
  const a = useAnalysis()!;
  const { locale } = useResearchCopy();
  const date = useDateLabel();
  const [category, setCategory] = useState<
    YogaCategory | "doshas" | "classical" | "vargas"
  >("raja");
  const y = useMemo(
    () => analyzeYogas(chart, a.at, locale),
    [chart, a.at, locale],
  );
  return (
    <Research kind="yogas">
      <Facts
        items={[
          { label: "Yogakaraka", value: y.yogakaraka ?? "No single planet" },
          {
            label: "Functional benefics",
            value: y.functional.benefics.join(", ") || "—",
          },
          {
            label: "Functional malefics",
            value: y.functional.malefics.join(", ") || "—",
          },
        ]}
      />
      <Tabs
        label="Combination category"
        value={category}
        onChange={setCategory}
        items={[
          { key: "raja", label: "Raja · direction" },
          { key: "dhana", label: "Dhana · resources" },
          { key: "arishta", label: "Arishta · pressures" },
          { key: "yogakaraka", label: "Yogakaraka" },
          { key: "doshas", label: "Doshas & cancellation" },
          { key: "classical", label: "Classical checks" },
          { key: "vargas", label: "D9 & D10 combinations" },
        ]}
      />
      <Panel title="Formation, modification and activation">
        {category === "doshas" ? (
          <div className="research-stages">
            {chart.doshas.map((d, i) => (
              <article className="research-stage" key={i}>
                <h4>
                  {d.name}{" "}
                  <span className="research-tone">
                    {d.cancelled
                      ? "Cancelled"
                      : d.present
                        ? "Present"
                        : "Not present"}
                  </span>
                </h4>
                <p>{d.description}</p>
              </article>
            ))}
          </div>
        ) : category === "classical" ? (
          <div className="research-stages">
            {chart.yogas.map((d, i) => (
              <Disclosure
                key={i}
                title={`${d.name} · ${d.present ? "Present" : "Not present"}`}
              >
                <Notes items={[d.description]} />
              </Disclosure>
            ))}
          </div>
        ) : category === "vargas" ? (
          <>
            {(["D9", "D10"] as const).map((key) => (
              <Disclosure
                key={key}
                title={`${key} · ${chart.vargaYogas?.[key]?.length ?? 0} formed combinations`}
              >
                <Notes
                  items={(chart.vargaYogas?.[key] ?? []).map(
                    (v) => `${v.name}: ${v.description}`,
                  )}
                />
              </Disclosure>
            ))}
          </>
        ) : y.findings.filter((f) => f.category === category).length ? (
          <div className="research-stages">
            {y.findings
              .filter((f) => f.category === category)
              .map((f) => (
                <article key={f.id} className="research-stage">
                  <h4>
                    {f.name} <span className="research-tone">{f.strength}</span>
                  </h4>
                  <p>{f.formation}</p>
                  <Notes items={[f.effect]} />
                  <Disclosure title="Why it has this strength">
                    <Notes items={f.reasons} />
                  </Disclosure>
                  <Disclosure
                    title={`${f.activation.length} activating periods`}
                  >
                    <Table
                      caption="Activation windows, not promised events"
                      columns={["Period", "Start", "End", "Peak"]}
                      rows={f.activation.map((p) => [
                        p.label,
                        date(p.start),
                        date(p.end),
                        p.peak
                          ? `${p.peak.label} · ${date(p.peak.start)} — ${date(p.peak.end)}`
                          : "—",
                      ])}
                    />
                  </Disclosure>
                  <button
                    type="button"
                    onClick={() => {
                      go("rasi");
                      a.update({
                        selected: { kind: "planet", planet: f.planets[0] },
                      });
                    }}
                  >
                    Inspect participating planets · {f.planets.join(", ")}
                  </button>
                </article>
              ))}
          </div>
        ) : (
          <p className="research-caption">
            No combinations formed under this category’s implemented rules.
          </p>
        )}
      </Panel>
    </Research>
  );
}
