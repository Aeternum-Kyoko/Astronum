"use client";
import { useMemo, useState } from "react";
import type { KundaliChart } from "@/lib/astrology/types";
import type { KundaliReport } from "@/lib/astrology/report";
import { kpAnalysis } from "@/lib/astrology/kp";
import { lalKitab } from "@/lib/astrology/lalKitab";
import {
  jaiminiTables,
  vimshopakaBala,
  VIMSHOPAKA_SCHEMES,
  ghatakChakra,
  prastarashtakavarga,
} from "@/lib/astrology/kundliTables";
import {
  ASHTAKAVARGA_PLANETS,
  SIGNS,
  type AshtakavargaPlanet,
} from "@/lib/astrology/constants";
import { term } from "@/lib/i18n/terms";
import KundliChart from "../KundliChart";
import { ChartStyleButtons } from "./ChartPicker";
import { useAnalysis } from "./AnalysisContext";
import {
  Research,
  Panel,
  Facts,
  Tabs,
  Table,
  Disclosure,
  Notes,
  Meter,
  Empty,
  useResearchCopy,
} from "./ResearchUI";
type Props = {
  chart: KundaliChart;
  report: KundaliReport | null;
  go: (slug: string) => void;
};

export function KpWorkspace({ chart }: Props) {
  const a = useAnalysis()!;
  const { locale } = useResearchCopy();
  const [view, setView] = useState<
    "cusps" | "planets" | "houses" | "promises" | "ruling"
  >("cusps");
  const d = useMemo(() => kpAnalysis(chart, a.at), [chart, a.at]);
  return (
    <Research kind="kp">
      <Facts
        items={[
          { label: "KP ayanamsa", value: `${d.ayanamsa.toFixed(6)}°` },
          { label: "House system", value: "Placidus cusps" },
          { label: "Snapshot", value: `${a.date} ${a.time.slice(0, 5)}` },
        ]}
      />
      <Tabs
        label="KP investigation layer"
        value={view}
        onChange={setView}
        items={[
          { key: "cusps", label: "Cusp hierarchy" },
          { key: "planets", label: "Planet significators" },
          { key: "houses", label: "House significators" },
          { key: "promises", label: "Event rules" },
          { key: "ruling", label: "Ruling planets" },
        ]}
      />
      <Panel
        title={
          view === "cusps"
            ? "Sign → star → sub → sub-sub"
            : view === "planets"
              ? "Planetary significations"
              : view === "houses"
                ? "A–D significator hierarchy"
                : view === "ruling"
                  ? "Ruling planets at the selected instant"
                  : "Cusp sub-lord event checks"
        }
      >
        {view === "cusps" ? (
          <Table
            caption="KP cusp ledger"
            columns={[
              "Cusp",
              "Sign",
              "Longitude",
              "Sign lord",
              "Star lord",
              "Sub lord",
              "Sub-sub lord",
            ]}
            rows={d.cusps.map((p) => [
              p.house,
              p.sign,
              `${p.longitude.toFixed(5)}°`,
              p.signLord,
              p.starLord,
              p.subLord,
              p.subSubLord,
            ])}
          />
        ) : view === "planets" ? (
          <Table
            caption="Stellar and planetary house significators"
            columns={[
              "Planet",
              "House",
              "Sign",
              "Star",
              "Sub",
              "Sub-sub",
              "Star-level houses",
              "Own houses",
              "Combined",
            ]}
            rows={d.planets.map((p) => [
              term(locale, p.planet),
              p.house,
              p.sign,
              p.starLord,
              p.subLord,
              p.subSubLord,
              p.levels.star.join(", "),
              p.levels.own.join(", "),
              p.signifies.join(", "),
            ])}
          />
        ) : view === "houses" ? (
          <Table
            caption="House significators by strength layer"
            columns={["House", "A", "B", "C", "D"]}
            rows={d.houseSignificators.map((p) => [
              p.house,
              p.a.join(", "),
              p.b.join(", "),
              p.c.join(", "),
              p.d.join(", "),
            ])}
          />
        ) : view === "ruling" ? (
          <>
            <Table
              caption="Ruling planets"
              columns={["Role", "Planet"]}
              rows={d.rulingPlanets.list.map((p) => [p.role, p.planet])}
            />
            <Notes
              items={[
                `Strongest recurring rulers: ${d.rulingPlanets.strongest.join(", ")}`,
              ]}
            />
          </>
        ) : (
          <div className="research-stages">
            {d.promises.map((p, i) => (
              <article className="research-stage" key={i}>
                <h4>
                  {p.event} <span className="research-tone">{p.verdict}</span>
                </h4>
                <p>{p.reason}</p>
                <Facts
                  items={[
                    {
                      label: "Cusp / sub lord",
                      value: `${p.cusp} · ${p.subLord}`,
                    },
                    {
                      label: "Supporting houses hit",
                      value: p.hits.join(", ") || "None",
                    },
                    {
                      label: "Negating houses hit",
                      value: p.blocks.join(", ") || "None",
                    },
                  ]}
                />
                <Disclosure title="House sets used by this rule">
                  <Notes
                    items={[
                      `Favourable: ${p.favourable.join(", ")}`,
                      `Negating: ${p.negating.join(", ")}`,
                    ]}
                  />
                </Disclosure>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </Research>
  );
}

export function LalKitabWorkspace({ chart }: Props) {
  const a = useAnalysis()!;
  const { locale } = useResearchCopy();
  const [planet, setPlanet] = useState(chart.planets[0].planet);
  const [view, setView] = useState<"planets" | "debts" | "practice">("planets");
  const lk = useMemo(() => lalKitab(chart), [chart]);
  const selected = lk.planets.find((p) => p.planet === planet)!;
  const points = chart.planets.map((p) => ({ ...p, signIndex: p.house - 1 }));
  return (
    <Research kind="lalkitab">
      <Panel title="The fixed-house Lal Kitab reference">
        <ChartStyleButtons
          value={a.style}
          onChange={(style) => a.update({ style })}
        />
        <div className="research-chart">
          <KundliChart
            ascendantSignIndex={0}
            planets={points}
            style={a.style}
            selected={{ kind: "planet", planet }}
            onPick={(pick) => {
              if (pick.kind === "planet")
                setPlanet(pick.planet as typeof planet);
            }}
          />
        </div>
        <p className="research-caption">
          Aries is fixed as house 1 in this representation. Interpretations
          below follow Lal Kitab’s house-based conventions.
        </p>
      </Panel>
      <Tabs
        label="Lal Kitab chapters"
        value={view}
        onChange={setView}
        items={[
          { key: "planets", label: "Planet readings" },
          { key: "debts", label: "Rin indicators" },
          { key: "practice", label: "Practice rules" },
        ]}
      />
      {view === "planets" ? (
        <Panel title="One planet at a time">
          <Tabs
            label="Lal Kitab planet"
            value={planet}
            onChange={setPlanet}
            items={chart.planets.map((p) => ({
              key: p.planet,
              label: term(locale, p.planet),
            }))}
          />
          <Facts
            items={[
              { label: "Planet", value: term(locale, selected.planet) },
              { label: "House", value: selected.house },
              { label: "Rule verdict", value: selected.verdict },
            ]}
          />
          <Notes items={[selected.reading, ...selected.status]} />
          <Disclosure title="Traditional practices for this placement">
            <Notes items={selected.remedies} />
          </Disclosure>
        </Panel>
      ) : view === "debts" ? (
        <Panel title="Karmic-debt indicators">
          {lk.rins.length ? (
            lk.rins.map((r, i) => (
              <Disclosure key={i} title={r.name} open>
                <Facts items={[{ label: "Placement rule", value: r.signs }]} />
                <Notes items={[r.cause, `Traditional remedy: ${r.remedy}`]} />
              </Disclosure>
            ))
          ) : (
            <Empty text="No rin indicators formed under the implemented rules." />
          )}
        </Panel>
      ) : (
        <Panel title="Read these before choosing a practice">
          <Notes items={lk.rules} />
        </Panel>
      )}
    </Research>
  );
}

export function ReferenceWorkspace({ chart }: Props) {
  const { locale } = useResearchCopy();
  const [view, setView] = useState<
    "jaimini" | "vimshopaka" | "prastara" | "ghatak"
  >("jaimini");
  const [planet, setPlanet] = useState<AshtakavargaPlanet>("Sun");
  const j = useMemo(() => jaiminiTables(chart), [chart]);
  const v = useMemo(() => vimshopakaBala(chart), [chart]);
  const g = useMemo(() => ghatakChakra(chart), [chart]);
  const p = useMemo(() => prastarashtakavarga(chart, planet), [chart, planet]);
  return (
    <Research kind="tables">
      <Tabs
        label="Reference table method"
        value={view}
        onChange={setView}
        items={[
          { key: "jaimini", label: "Arudha & Karakamsha" },
          { key: "vimshopaka", label: "Vimshopaka Bala" },
          { key: "prastara", label: "Prastara matrix" },
          { key: "ghatak", label: "Ghatak references" },
        ]}
      />
      {view === "jaimini" ? (
        <>
          <Panel title="The twelve Arudha padas">
            <Table
              caption="Derived sign, natal house and occupants"
              columns={["Pada", "Sign", "House from Lagna", "Planets"]}
              rows={j.padas.map((p) => [
                p.name,
                p.sign,
                p.houseFromLagna,
                p.planets.join(", ") || "—",
              ])}
            />
          </Panel>
          <Panel title="Upapada and Karakamsha">
            <Facts
              items={[
                { label: "Upapada", value: j.upapada.sign },
                {
                  label: "Second from UL",
                  value: j.upapada.secondFrom,
                  note: `Lord: ${j.upapada.lordOfSecond}`,
                },
                { label: "Atmakaraka", value: j.karakamsha.atmakaraka },
                { label: "Karakamsha", value: j.karakamsha.sign },
              ]}
            />
            <Notes
              items={[
                j.upapada.note,
                j.karakamsha.meaning,
                `D9 planets in Karakamsha: ${j.karakamsha.planetsInD9.join(", ") || "None"}`,
              ]}
            />
          </Panel>
        </>
      ) : view === "vimshopaka" ? (
        <Panel title="Weighted divisional capacity">
          <Table
            caption="Each classical scheme is out of 20"
            columns={["Planet", ...VIMSHOPAKA_SCHEMES, "Verdict"]}
            rows={v.map((r) => [
              r.planet,
              ...VIMSHOPAKA_SCHEMES.map((s) => r.scores[s].toFixed(2)),
              r.verdict,
            ])}
          />
          <p className="research-caption">
            The four schemes weight different sets of divisional charts. They
            are not interchangeable with Shadbala Rupas.
          </p>
        </Panel>
      ) : view === "prastara" ? (
        <Panel title="Who contributes each raw bindu">
          <Tabs
            label="Prastara target planet"
            value={planet}
            onChange={setPlanet}
            items={ASHTAKAVARGA_PLANETS.map((p) => ({
              key: p,
              label: term(locale, p),
            }))}
          />
          <Table
            caption={`${planet} contributor matrix`}
            columns={["Contributor", ...SIGNS]}
            rows={p.map((row) => [
              row.contributor,
              ...row.bindus.map((v) => (v ? "1" : "0")),
            ])}
          />
        </Panel>
      ) : (
        <Panel title={`Ghatak reference · natal Moon in ${g.moonSign}`}>
          <Facts
            items={Object.entries(g)
              .filter(([key]) => key !== "moonSign")
              .map(([label, value]) => ({ label, value: String(value) }))}
          />
          <p className="research-caption">
            A traditional reference list, not a standalone prediction or
            instruction to avoid ordinary activities.
          </p>
        </Panel>
      )}
    </Research>
  );
}

export function SectorWorkspace({ report, go }: Props) {
  const [selected, setSelected] = useState("");
  const sectors = report?.sectors;
  if (!sectors) return <Empty text="Building life-area evidence…" />;
  const s = sectors.find((s) => s.key === selected) ?? sectors[0];
  return (
    <Research kind="sectors">
      <Panel title="Choose a life area">
        <Tabs
          label="Life-area investigation"
          value={s.key}
          onChange={setSelected}
          items={sectors.map((s) => ({ key: s.key, label: s.title }))}
        />
        <Meter label={s.title} value={s.score} note={s.verdict} />
        <Notes items={[s.promise]} />
        <Disclosure title="Why this reading was formed">
          <Notes items={s.reasons} />
        </Disclosure>
        <Disclosure title="Traits and tendencies">
          <Notes items={s.traits} />
        </Disclosure>
      </Panel>
      <Panel title="How the area develops over time">
        <div className="research-stages">
          {s.stages.map((stage, i) => (
            <article className="research-stage" key={i}>
              <h4>
                {stage.label} · ages {stage.ages.join("–")}
              </h4>
              <small>
                {stage.dashas} · {stage.tone ?? "No marked tone"}
              </small>
              <p>{stage.text}</p>
              {stage.windows.length > 0 && (
                <Disclosure title="Windows and their reasons">
                  <Notes
                    items={stage.windows.map(
                      (w) => `${w.label} · ${w.ages}: ${w.why}`,
                    )}
                  />
                </Disclosure>
              )}
            </article>
          ))}
        </div>
      </Panel>
      <Panel title="Focus and context">
        <Facts
          items={[
            {
              label: "Peak context",
              value: s.peak ?? "No separate peak marked",
            },
            {
              label: "Counterpoint",
              value: s.caution ?? "No separate caution marked",
            },
          ]}
        />
        <Notes items={s.advice} />
        <button type="button" onClick={() => go("timeline")}>
          Explore the full timeline
        </button>
      </Panel>
    </Research>
  );
}
