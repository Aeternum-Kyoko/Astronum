"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import DatePicker from "@/components/DatePicker";
import { haptic } from "@/lib/haptics";
import { DIGITS, loShuReport, type Gender, type LoShuReport } from "@/lib/loShu";
import { NUMBER_MEANINGS } from "@/lib/numerology";

const ELEMENT_TINT: Record<string, string> = {
  Water: "#5cc8ff",
  Earth: "#d9a55c",
  Wood: "#7fd17f",
  Metal: "#cfd6e4",
  Fire: "#ff7a6b",
};

/** Lo Shu grid maker: the grid from a birth date (plus optional name and gender), a downloadable image, and the full reading. */
export default function LoShuMaker() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [date, setDate] = useState(params.get("date") ?? "");
  const [name, setName] = useState(params.get("name") ?? "");
  const [gender, setGender] = useState<Gender | "">((params.get("g") as Gender | null) ?? "");
  const [shown, setShown] = useState<{ date: string; name: string; gender: Gender | "" } | null>(() =>
    params.get("date") ? { date: params.get("date")!, name: params.get("name") ?? "", gender: (params.get("g") as Gender | null) ?? "" } : null
  );

  const report = useMemo(() => (shown && /^\d{4}-\d{2}-\d{2}$/.test(shown.date) ? loShuReport(shown.date, { name: shown.name, gender: shown.gender || null }) : null), [shown]);

  useEffect(() => {
    if (report) haptic("success");
  }, [report]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    setShown({ date, name, gender });
    const q = new URLSearchParams({ date, ...(name ? { name } : {}), ...(gender ? { g: gender } : {}) });
    router.replace(`${pathname}?${q}`, { scroll: false });
  }

  return (
    <div className="space-y-8">
      <form onSubmit={submit} className="card-edge mx-auto max-w-2xl rounded-3xl p-6 md:p-7">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block md:col-span-1">
            <span className="mb-1.5 block text-xs font-semibold text-muted">Date of birth</span>
            <DatePicker value={date} onChange={setDate} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted">Name (optional)</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="As you use it" className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-cream focus:border-gold focus:outline-none" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted">Gender (for Kua number)</span>
            <select value={gender} onChange={(e) => setGender(e.target.value as Gender | "")} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-cream focus:border-gold focus:outline-none">
              <option value="">Skip Kua</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </label>
        </div>
        <button type="submit" className="mt-5 rounded-full bg-gold px-7 py-3 text-sm font-semibold text-on-gold hover:bg-gold-bright">
          Make my Lo Shu grid
        </button>
      </form>

      {report && <Report r={report} name={shown?.name ?? ""} />}
    </div>
  );
}

function Report({ r, name }: { r: LoShuReport; name: string }) {
  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[auto_1fr] lg:items-start" aria-label="Your Lo Shu grid">
        <div className="card-edge rounded-3xl p-5">
          <div className="grid grid-cols-3 gap-2" role="table" aria-label="Lo Shu grid">
            {r.cells.flat().map((c) => (
              <div
                key={c.n}
                role="cell"
                className={`flex h-24 w-24 flex-col items-center justify-center rounded-2xl border sm:h-28 sm:w-28 ${c.count ? "border-gold/50 bg-gold/10" : "border-dashed border-border/70"}`}
              >
                <span className={`font-display leading-none ${c.count ? "text-gold-bright" : "text-border"} ${c.count > 3 ? "text-xl" : "text-3xl"}`}>{c.count ? String(c.n).repeat(c.count) : c.n}</span>
                <span className="mt-1 text-[10px] text-muted">
                  {c.info.planet} · {c.info.direction}
                </span>
                {!c.count && <span className="text-[10px] text-rose">missing</span>}
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-muted">
            Driver {r.driver} · Conductor {r.conductor}
            {r.kua ? ` · Kua ${r.kua}` : ""} · {9 - r.missing.length} of 9 numbers present
          </p>
          <div className="mt-3 flex justify-center gap-2">
            <button type="button" onClick={() => downloadGrid(r, name)} className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-cream hover:border-gold">
              Download image
            </button>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(window.location.href);
                haptic("success");
              }}
              className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-cream hover:border-gold"
            >
              Copy link
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card-edge rounded-3xl p-6">
            <p className="text-sm font-semibold text-gold-bright">Your grid at a glance · {r.score}/100</p>
            <p className="mt-2 text-sm leading-relaxed text-cream">{r.driverConductor}</p>
            <p className="mt-2 text-sm text-muted">
              Numbers placed: {r.placed.join(" ")} (date digits, then Driver {r.driver}, Conductor {r.conductor}
              {r.kua ? `, Kua ${r.kua}` : ""}). Personal year {r.personalYear.year}: <b className="text-cream">{r.personalYear.number}</b> —{" "}
              {NUMBER_MEANINGS[r.personalYear.number].keywords.toLowerCase()}.
            </p>
            {r.name && <p className="mt-2 text-sm text-cream">{r.name.text}</p>}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <List title="Strengths" tone="gold" items={r.strengths.length ? r.strengths : ["No complete plane — your strengths come from the individual numbers below."]} />
            <List title="Challenges" tone="rose" items={r.challenges.length ? r.challenges : ["No empty planes and no excess numbers — a well-balanced grid."]} />
          </div>
          {r.topRemedies.length > 0 && <List title="Most useful remedies" tone="gold" items={r.topRemedies} />}
        </div>
      </section>

      <section aria-label="Planes">
        <h3 className="text-xl font-bold tracking-tight text-cream">The eight planes (arrows)</h3>
        <p className="mt-1 text-sm text-muted">A complete line of three numbers is a strength; an empty one is a lesson. Two of three means the plane is developing — its missing number is the key.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {r.planes.map((p) => (
            <div key={p.plane.name} className="card-edge rounded-2xl p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-cream">
                  {p.plane.name} <span className="text-xs font-normal text-muted">{p.plane.numbers.join("-")}</span>
                </p>
                <span className={`text-xs font-semibold ${p.status === "complete" ? "text-gold-bright" : p.status === "empty" ? "text-rose" : "text-muted"}`}>
                  {p.status === "complete" ? "Complete" : p.status === "empty" ? "Empty" : `${p.filled} of 3`}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">
                {p.status === "complete" ? p.plane.strong : p.status === "empty" ? p.plane.empty : `Developing: add the energy of ${p.missingNumbers.join(" and ")} to complete it — ${p.plane.strong.charAt(0).toLowerCase()}${p.plane.strong.slice(1)}`}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Numbers in your grid">
        <h3 className="text-xl font-bold tracking-tight text-cream">Each number in your grid</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {r.present.map((p) => (
            <div key={p.n} className="card-edge rounded-2xl p-4">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-display text-2xl text-gold-bright">{String(p.n).repeat(p.count)}</span>
                <span className="text-xs text-muted">
                  {p.count}× · {DIGIT_LINE(p.n)}
                </span>
              </div>
              <p className="mt-2 text-sm text-cream">{p.meaning}</p>
            </div>
          ))}
        </div>
      </section>

      {r.missing.length > 0 && (
        <section aria-label="Missing numbers">
          <h3 className="text-xl font-bold tracking-tight text-cream">Missing numbers and their remedies</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {r.missing.map((m) => (
              <div key={m.n} className="card-edge rounded-2xl p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-2xl text-rose">{m.n}</span>
                  <span className="text-xs text-muted">{DIGIT_LINE(m.n)}</span>
                </div>
                <p className="mt-2 text-sm text-cream">{m.meaning}</p>
                <ul className="mt-2 space-y-1 text-sm text-muted">
                  {m.remedies.map((x) => (
                    <li key={x} className="flex gap-2">
                      <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" />
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {r.kuaDirections && (
        <section className="card-edge rounded-2xl p-5" aria-label="Kua directions">
          <h3 className="text-sm font-semibold text-cream">
            Kua {r.kua} · {r.kuaDirections.group} group — your best directions
          </h3>
          <p className="mt-1 text-xs text-muted">Face these directions while working, sleeping or signing — the first is the strongest.</p>
          <ol className="mt-3 grid gap-2 sm:grid-cols-4">
            {r.kuaDirections.best.map((d, i) => (
              <li key={d.direction} className="rounded-xl border border-border/70 px-3 py-2 text-sm">
                <span className="text-xs text-muted">{i + 1}. {d.use}</span>
                <span className="block font-semibold text-cream">{d.direction}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function DIGIT_LINE(n: number): string {
  const d = DIGITS[n];
  return `${d.planet} · ${d.element} · ${d.direction} · ${d.area}`;
}

function List({ title, items, tone }: { title: string; items: string[]; tone: "gold" | "rose" }) {
  return (
    <div className="card-edge rounded-2xl p-5">
      <p className={`text-sm font-semibold ${tone === "gold" ? "text-gold-bright" : "text-rose"}`}>{title}</p>
      <ul className="mt-2 space-y-1.5 text-sm text-muted">
        {items.map((x) => (
          <li key={x} className="flex gap-2">
            <span aria-hidden="true" className={`mt-2 h-1 w-1 shrink-0 rounded-full ${tone === "gold" ? "bg-gold" : "bg-rose"}`} />
            {x}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Draws the grid as a shareable PNG and downloads it. */
function downloadGrid(r: LoShuReport, name: string) {
  const W = 900;
  const H = 1100;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#142043");
  bg.addColorStop(1, "#0a1128");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.fillStyle = "#f2c14e";
  ctx.font = "600 30px system-ui, sans-serif";
  ctx.fillText("LO SHU GRID", W / 2, 80);
  ctx.fillStyle = "#eef0f5";
  ctx.font = "700 44px system-ui, sans-serif";
  ctx.fillText(name || r.date.split("-").reverse().join("/"), W / 2, 140);
  ctx.fillStyle = "#b3bdd8";
  ctx.font = "400 24px system-ui, sans-serif";
  ctx.fillText(`Driver ${r.driver} · Conductor ${r.conductor}${r.kua ? ` · Kua ${r.kua}` : ""}`, W / 2, 185);
  const cell = 230;
  const x0 = (W - cell * 3) / 2;
  const y0 = 240;
  r.cells.flat().forEach((c2, i) => {
    const x = x0 + (i % 3) * cell;
    const y = y0 + Math.floor(i / 3) * cell;
    ctx.fillStyle = c2.count ? "rgba(232,169,21,0.14)" : "rgba(255,255,255,0.03)";
    ctx.strokeStyle = c2.count ? "rgba(242,193,78,0.7)" : "rgba(255,255,255,0.18)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(x + 8, y + 8, cell - 16, cell - 16, 24);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = c2.count ? "#f2c14e" : "rgba(255,255,255,0.25)";
    const text = c2.count ? String(c2.n).repeat(c2.count) : String(c2.n);
    ctx.font = `700 ${c2.count > 3 ? 54 : 80}px system-ui, sans-serif`;
    ctx.fillText(text, x + cell / 2, y + cell / 2 + 22);
    ctx.fillStyle = ELEMENT_TINT[c2.info.element];
    ctx.font = "500 20px system-ui, sans-serif";
    ctx.fillText(`${c2.info.planet} · ${c2.info.direction}`, x + cell / 2, y + cell - 34);
  });
  ctx.fillStyle = "#b3bdd8";
  ctx.font = "400 24px system-ui, sans-serif";
  ctx.fillText(`Missing: ${r.missing.map((m) => m.n).join(", ") || "none"}   ·   Complete planes: ${r.planes.filter((p) => p.status === "complete").length}`, W / 2, y0 + cell * 3 + 70);
  ctx.fillStyle = "#f2c14e";
  ctx.font = "600 22px system-ui, sans-serif";
  ctx.fillText(window.location.host, W / 2, H - 50);
  const a = document.createElement("a");
  a.href = c.toDataURL("image/png");
  a.download = `lo-shu-${r.date}.png`;
  a.click();
}
