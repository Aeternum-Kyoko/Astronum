"use client";
import { useMemo, useState } from "react";
import type { KundaliChart } from "@/lib/astrology/types";
import { computeRemedies, PLANET_REMEDIES } from "@/lib/astrology/remedies";
import { rudrakshaPlan } from "@/lib/astrology/rudraksha";
import {
  evaluateVastu,
  personalizeVastu,
  VASTU_ROOM_PREFERENCES,
} from "@/lib/vastu/evaluate";
import {
  VASTU_ROOMS,
  VASTU_ZONES,
  type VastuAssessmentInput,
  type VastuZone,
  type VastuRoom,
} from "@/lib/vastu/types";
import { useDeviceStore } from "@/lib/useDeviceStore";
import { useAnalysis } from "./AnalysisContext";
import {
  Research,
  Panel,
  Facts,
  Tabs,
  Table,
  Disclosure,
  Notes,
  Empty,
  useResearchCopy,
} from "./ResearchUI";
type Props = { chart: KundaliChart; go: (slug: string) => void };

export function RemedyWorkspace({ chart, go }: Props) {
  const [view, setView] = useState<"practices" | "stones" | "doshas">(
    "practices",
  );
  const d = useMemo(() => computeRemedies(chart), [chart]);
  return (
    <Research kind="remedies">
      <Facts
        items={[
          { label: "Support candidates", value: d.support.length },
          { label: "Gemstone candidates", value: d.stones.length },
          { label: "Dosha-specific practices", value: d.doshas.length },
        ]}
      />
      <Tabs
        label="Remedy category"
        value={view}
        onChange={setView}
        items={[
          { key: "practices", label: "Planet practices" },
          { key: "stones", label: "Gemstones & reasoning" },
          { key: "doshas", label: "Dosha practices" },
        ]}
      />
      {view === "practices" ? (
        <Panel title="Start with the reason, then choose a practice">
          {d.support.length ? (
            d.support.map((s) => {
              const r = PLANET_REMEDIES[s.planet];
              return (
                <Disclosure
                  key={s.planet}
                  title={`${s.planet} · ${s.reasons.length} support factors`}
                  open
                >
                  <Notes items={s.reasons} />
                  <Facts
                    items={[
                      { label: "Traditional mantra", value: r.mantra },
                      { label: "Day", value: r.day },
                      { label: "Rudraksha correspondence", value: r.rudraksha },
                    ]}
                  />
                  <Notes
                    items={[
                      r.practice,
                      r.charity,
                      `Deity correspondence: ${r.deity}`,
                    ]}
                  />
                  <button type="button" onClick={() => go("rudraksha")}>
                    Explore the bead guidance
                  </button>
                </Disclosure>
              );
            })
          ) : (
            <Empty text="No support candidates flagged by the implemented checks." />
          )}
        </Panel>
      ) : view === "stones" ? (
        <Panel title="A stone needs suitability, not only weakness">
          {d.stones.length ? (
            d.stones.map((s, i) => {
              const r = PLANET_REMEDIES[s.planet];
              return (
                <article className="research-stage" key={i}>
                  <h4>
                    {s.gem} <span className="research-tone">{s.kind}</span>
                  </h4>
                  <p>{s.why}</p>
                  <Facts
                    items={[
                      { label: "Associated planet", value: s.planet },
                      { label: "Rulership checked", value: `House ${s.house}` },
                      { label: "Traditional metal", value: r.metal },
                      { label: "Substitute", value: r.gemAlt },
                    ]}
                  />
                  <Disclosure title="Wearing correspondence and context">
                    <Notes
                      items={[
                        `Finger: ${r.finger}`,
                        `Day: ${r.day}`,
                        "Review the complete natal context and gemstone quality before choosing to wear one. These are traditional recommendations, not guaranteed changes in outcomes.",
                      ]}
                    />
                  </Disclosure>
                </article>
              );
            })
          ) : (
            <Empty text="No suitable gemstone candidates under these filters." />
          )}
        </Panel>
      ) : (
        <Panel title="Practices associated with specific doshas">
          {d.doshas.length ? (
            d.doshas.map((s, i) => (
              <Disclosure title={s.name} key={i} open>
                <Notes items={s.remedies} />
              </Disclosure>
            ))
          ) : (
            <Empty text="No dosha-specific practices are listed for this chart." />
          )}
        </Panel>
      )}
      <p className="research-caption">
        These are optional traditional practices. A chart label alone is not a
        reason to buy a gemstone, undertake restrictive practices or replace
        professional care.
      </p>
    </Research>
  );
}

export function RudrakshaWorkspace({ chart }: Props) {
  const { locale } = useResearchCopy();
  const [view, setView] = useState<"priority" | "goals" | "wear" | "care">(
    "priority",
  );
  const [copied, setCopied] = useState("");
  const d = useMemo(() => rudrakshaPlan(chart, locale), [chart, locale]);
  const bead = (r: (typeof d.top)[number]) => (
    <article className="research-stage" key={r.planet}>
      <div className="research-bead" aria-hidden="true">
        <svg viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="48"
            fill="#563627"
            stroke="#c59b65"
            strokeWidth="2"
          />
          {Array.from(
            { length: Math.max(1, Math.min(21, Number(r.bead.mukhi) || 5)) },
            (_, i) => (
              <ellipse
                key={i}
                cx="60"
                cy="60"
                rx={10 + i * 1.7}
                ry="45"
                fill="none"
                stroke="#d0a16a"
                strokeOpacity=".5"
                transform={`rotate(${(i * 180) / (Number(r.bead.mukhi) || 5)} 60 60)`}
              />
            ),
          )}
        </svg>
        <strong>{r.bead.mukhi}</strong>
      </div>
      <h4>
        {r.bead.name} <span className="research-tone">{r.role}</span>
      </h4>
      <p>
        {r.planetName} · {r.grade}
      </p>
      <Notes items={r.reasons.map((reason) => reason.text)} />
      <Disclosure title="Mantra, correspondence and traditional benefits">
        <Facts
          items={[
            { label: "Deity", value: r.bead.deity },
            { label: "Start day", value: r.day },
            { label: "Mantra", value: r.bead.mantra },
          ]}
        />
        <Notes items={r.bead.benefits} />
        {r.bead.note && <p className="research-caption">{r.bead.note}</p>}
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(r.bead.mantra);
              setCopied(r.planet);
            } catch {
              setCopied("unavailable");
            }
          }}
        >
          {copied === r.planet ? "Mantra copied" : "Copy mantra"}
        </button>
        {copied === "unavailable" && (
          <p role="status">
            Clipboard unavailable; select the mantra text to copy it.
          </p>
        )}
        {r.alternative && (
          <p className="research-caption">Alternative: {r.alternative.name}</p>
        )}
      </Disclosure>
    </article>
  );
  return (
    <Research kind="rudraksha">
      <Panel title="Your primary combination">
        <Facts
          items={[
            {
              label: "Suggested mukhis",
              value: d.combination.beads.join(" · "),
            },
            { label: "Basis", value: "Natal planet support" },
          ]}
        />
        <Notes items={[d.combination.text]} />
      </Panel>
      <Tabs
        label="Rudraksha chapters"
        value={view}
        onChange={setView}
        items={[
          { key: "priority", label: "Why these beads" },
          { key: "goals", label: "By life goal" },
          { key: "wear", label: "Wearing & energising" },
          { key: "care", label: "Care & authenticity" },
        ]}
      />
      {view === "priority" ? (
        <>
          <Panel title="Highest-priority suggestions">
            <div className="research-stages">{d.top.map(bead)}</div>
          </Panel>
          <Disclosure
            title={`${d.others.length} additional supportive suggestions`}
          >
            <div className="research-stages">{d.others.map(bead)}</div>
          </Disclosure>
        </>
      ) : view === "goals" ? (
        <Panel title="Match a practice to a life area">
          <div className="research-grid">
            {d.goals.map((g, i) => (
              <article className="research-stage" key={i}>
                <h4>{g.goal}</h4>
                <p>
                  {g.bead.name} · {g.bead.mukhi} Mukhi
                </p>
                <small>{g.why}</small>
              </article>
            ))}
          </div>
        </Panel>
      ) : view === "wear" ? (
        <>
          <Panel title="How to wear">
            <Notes items={d.wearing} />
          </Panel>
          <Panel title="Traditional energising practice">
            <Notes items={d.energising} />
          </Panel>
        </>
      ) : (
        <>
          <Panel title="Care">
            <Notes items={d.care} />
          </Panel>
          <Panel title="Buying and authenticity">
            <Notes items={d.buying} />
          </Panel>
        </>
      )}
      <p className="research-caption">
        Mukhi–planet associations are traditional and vary between lineages.
        They do not establish medical effects or guaranteed life outcomes.
      </p>
    </Research>
  );
}

const INITIAL: VastuAssessmentInput = {
  propertyType: "apartment",
  northReference: "estimated",
  entrance: "unknown",
  rooms: [],
  floors: 1,
  planBearing: 0,
  daylight: "unknown",
  ventilation: "unknown",
  dampness: "unknown",
  accessAndSafety: "unknown",
};
const GRID: (VastuZone | null)[][] = [
  ["NW", "NNW", "N", "NNE", "NE"],
  ["WNW", null, null, null, "ENE"],
  ["W", null, "CENTER", null, "E"],
  ["WSW", null, null, null, "ESE"],
  ["SW", "SSW", "S", "SSE", "SE"],
];
type SavedProperty = {
  name: string;
  input: VastuAssessmentInput;
  savedAt: string;
};
export function VastuWorkspace({ chart }: Props) {
  const a = useAnalysis()!;
  const { locale } = useResearchCopy();
  const [input, setInput] = useState<VastuAssessmentInput>(INITIAL);
  const [view, setView] = useState<
    "orientation" | "layout" | "review" | "chart"
  >("orientation");
  const [zone, setZone] = useState<VastuZone>("NE");
  const [floor, setFloor] = useState(1);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [saved, save] = useDeviceStore<SavedProperty[]>(
    "papa-vastu-properties-v1",
    [],
  );
  const [compare, setCompare] = useState("");
  const d = useMemo(() => evaluateVastu(input), [input]);
  const personal = useMemo(
    () => personalizeVastu(chart, a.transits, locale),
    [chart, a.transits, locale],
  );
  const set = <K extends keyof VastuAssessmentInput>(
    key: K,
    value: VastuAssessmentInput[K],
  ) => setInput((old) => ({ ...old, [key]: value }));
  const room = input.rooms.find((r) => r.zone === zone && r.floor === floor);
  const assign = (value: string) =>
    setInput((old) => ({
      ...old,
      rooms: [
        ...old.rooms.filter((r) => !(r.zone === zone && r.floor === floor)),
        ...(value
          ? [{ id: crypto.randomUUID(), zone, floor, room: value as VastuRoom }]
          : []),
      ],
    }));
  const validSaved = Array.isArray(saved)
    ? saved.filter(
        (s) =>
          s &&
          s.input &&
          Array.isArray(s.input.rooms) &&
          Number.isFinite(s.input.floors),
      )
    : [];
  const compared = validSaved.find((p) => p.savedAt === compare);
  const c = compared ? evaluateVastu(compared.input) : null;
  return (
    <Research kind="vastu">
      <Tabs
        label="Home assessment steps"
        value={view}
        onChange={setView}
        items={[
          { key: "orientation", label: "1 · Orientation" },
          { key: "layout", label: "2 · Map rooms" },
          { key: "review", label: "3 · Review findings" },
          { key: "chart", label: "4 · Kundli context" },
        ]}
      />
      {view === "orientation" ? (
        <>
          <Panel title="Establish the physical home first">
            <div className="research-controls">
              <label>
                Property
                <select
                  value={input.propertyType}
                  onChange={(e) =>
                    set(
                      "propertyType",
                      e.target.value as typeof input.propertyType,
                    )
                  }
                >
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                </select>
              </label>
              <label>
                North source
                <select
                  value={input.northReference}
                  onChange={(e) =>
                    set(
                      "northReference",
                      e.target.value as typeof input.northReference,
                    )
                  }
                >
                  <option value="estimated">Estimated</option>
                  <option value="compass">Compass</option>
                  <option value="plan">Plan north mark</option>
                </select>
              </label>
              <label>
                Plan’s top bearing
                <input
                  type="number"
                  min={0}
                  max={359.9}
                  step={0.1}
                  value={input.planBearing}
                  onChange={(e) =>
                    set(
                      "planBearing",
                      Math.min(359.9, Math.max(0, Number(e.target.value))),
                    )
                  }
                />
              </label>
              <label>
                Entrance
                <select
                  value={input.entrance}
                  onChange={(e) =>
                    set("entrance", e.target.value as VastuZone | "unknown")
                  }
                >
                  <option value="unknown">Unknown</option>
                  {VASTU_ZONES.filter((z) => z !== "CENTER").map((z) => (
                    <option key={z}>{z}</option>
                  ))}
                </select>
              </label>
              <label>
                Floors
                <select
                  value={input.floors}
                  onChange={(e) => {
                    const floors = Number(e.target.value);
                    setInput((old) => ({
                      ...old,
                      floors,
                      rooms: old.rooms.filter((r) => r.floor <= floors),
                    }));
                    setFloor((f) => Math.min(f, floors));
                  }}
                >
                  {Array.from({ length: 10 }, (_, i) => (
                    <option key={i}>{i + 1}</option>
                  ))}
                </select>
              </label>
            </div>
            <Notes
              items={[
                d.northNote,
                "The assignment map stays north-up. Use the bearing to interpret your actual plan before assigning directions.",
              ]}
            />
            <button type="button" onClick={() => setView("layout")}>
              Continue to room map
            </button>
          </Panel>
          <Panel title="Practical home observations">
            <div className="research-controls">
              {(
                [
                  {
                    key: "daylight",
                    label: "Daylight",
                    options: ["unknown", "good", "mixed", "limited"],
                  },
                  {
                    key: "ventilation",
                    label: "Ventilation",
                    options: ["unknown", "good", "mixed", "limited"],
                  },
                  {
                    key: "dampness",
                    label: "Dampness",
                    options: ["unknown", "no", "yes"],
                  },
                  {
                    key: "accessAndSafety",
                    label: "Access & safety",
                    options: ["unknown", "good", "needsAttention"],
                  },
                ] as const
              ).map((field) => (
                <label key={field.key}>
                  {field.label}
                  <select
                    value={input[field.key]}
                    onChange={(e) => set(field.key, e.target.value as never)}
                  >
                    {field.options.map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </Panel>
        </>
      ) : view === "layout" ? (
        <Panel
          title="Assign one main use per zone and floor"
          actions={
            <label>
              Floor
              <select
                value={floor}
                onChange={(e) => setFloor(Number(e.target.value))}
              >
                {Array.from({ length: input.floors }, (_, i) => (
                  <option key={i}>{i + 1}</option>
                ))}
              </select>
            </label>
          }
        >
          <div
            className="research-vastu-map"
            aria-label="North-up home assignment map"
          >
            {GRID.flatMap((row, ri) =>
              row.map((z, ci) =>
                z ? (
                  <button
                    type="button"
                    key={z}
                    aria-pressed={zone === z}
                    onClick={() => setZone(z)}
                  >
                    <strong>{z}</strong>
                    <small>
                      {input.rooms.find(
                        (r) => r.zone === z && r.floor === floor,
                      )?.room ?? "Unassigned"}
                    </small>
                  </button>
                ) : (
                  <span key={`${ri}:${ci}`} aria-hidden="true" />
                ),
              ),
            )}
          </div>
          <div className="research-controls">
            <label>
              {zone} · floor {floor}
              <select
                value={room?.room ?? ""}
                onChange={(e) => assign(e.target.value)}
              >
                <option value="">Unassigned</option>
                {VASTU_ROOMS.map((r) => (
                  <option key={r} value={r}>
                    {r.replace(/([a-z])([A-Z])/g, "$1 $2")}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" onClick={() => setView("review")}>
              Review this layout
            </button>
          </div>
          <Disclosure title={`Room conventions for ${zone}`}>
            <Notes
              items={VASTU_ROOMS.filter((r) =>
                VASTU_ROOM_PREFERENCES[r]?.includes(zone),
              ).map(
                (r) =>
                  `${r}: a common contemporary suggestion for this direction.`,
              )}
            />
          </Disclosure>
          <Table
            caption="All assigned rooms"
            columns={["Floor", "Zone", "Use", "Action"]}
            rows={input.rooms.map((r) => [
              r.floor,
              r.zone,
              r.room,
              <button
                type="button"
                key={r.id}
                onClick={() =>
                  set(
                    "rooms",
                    input.rooms.filter((x) => x.id !== r.id),
                  )
                }
              >
                Remove
              </button>,
            ])}
          />
        </Panel>
      ) : view === "review" ? (
        <Panel title="Separate practical priorities from tradition">
          <Facts
            items={[
              { label: "Priorities", value: d.summary.priority },
              { label: "Considerations", value: d.summary.consider },
              { label: "Notes", value: d.summary.notes },
            ]}
          />
          <div className="research-stages">
            {d.findings.map((f) => (
              <article className="research-stage" key={f.id}>
                <h4>
                  {f.title} <span className="research-tone">{f.level}</span>
                </h4>
                <Disclosure title="Traditional convention">
                  <Notes items={[f.tradition]} />
                </Disclosure>
                <Notes items={[f.practical, f.action]} />
                <small>{f.sourceType}</small>
              </article>
            ))}
          </div>
        </Panel>
      ) : (
        <Panel title="Personal home themes from the Kundli">
          <Facts
            items={[
              {
                label: "Fourth house",
                value: personal.fourthHouse.sign,
                note: `${personal.fourthHouse.lord} in house ${personal.fourthHouse.lordHouse}`,
              },
              {
                label: "Moon",
                value: personal.moon.sign,
                note: personal.moon.nakshatra,
              },
              { label: "D4 ascendant", value: personal.homeVarga.ascendant },
              {
                label: "Fourth-house raw bindus",
                value: personal.fourthHouseBindus,
              },
            ]}
          />
          <Notes
            items={personal.priorities.map(
              (p) => `${p.title}: ${p.detail} Basis: ${p.source}`,
            )}
          />
          <Notes items={[personal.note]} />
        </Panel>
      )}
      <Panel title="Save and compare properties">
        <div className="research-controls">
          <label>
            Property name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My home"
              maxLength={100}
            />
          </label>
          <button
            type="button"
            disabled={!name.trim()}
            onClick={() => {
              const ok = save(
                [
                  ...validSaved,
                  {
                    name: name.trim(),
                    input,
                    savedAt: new Date().toISOString(),
                  },
                ].slice(-12),
              );
              setStatus(
                ok
                  ? "Assessment saved on this device."
                  : "Storage unavailable; this assessment remains in the current session.",
              );
            }}
          >
            Save assessment
          </button>
          <button type="button" onClick={() => window.print()}>
            Print assessment
          </button>
        </div>
        {status && (
          <p role="status" className="research-caption">
            {status}
          </p>
        )}
        {validSaved.length > 0 && (
          <div className="research-controls">
            <label>
              Load a saved property
              <select
                value=""
                onChange={(e) => {
                  const s = validSaved.find(
                    (p) => p.savedAt === e.target.value,
                  );
                  if (s) {
                    setInput(s.input);
                    setName(s.name);
                    setFloor(1);
                  }
                }}
              >
                <option value="">Choose a property</option>
                {validSaved.map((p) => (
                  <option key={p.savedAt} value={p.savedAt}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Compare with
              <select
                value={compare}
                onChange={(e) => setCompare(e.target.value)}
              >
                <option value="">No comparison</option>
                {validSaved.map((p) => (
                  <option key={p.savedAt} value={p.savedAt}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
        {c && (
          <Table
            caption={`Current property versus ${compared!.name}`}
            columns={["Measure", "Current", "Saved"]}
            rows={[
              [
                "Assigned rooms",
                input.rooms.length,
                compared!.input.rooms.length,
              ],
              ["Priorities", d.summary.priority, c.summary.priority],
              ["Considerations", d.summary.consider, c.summary.consider],
              ["Notes", d.summary.notes, c.summary.notes],
            ]}
          />
        )}
      </Panel>
    </Research>
  );
}
