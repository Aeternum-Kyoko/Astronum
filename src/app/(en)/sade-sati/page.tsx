import type { Metadata } from "next";
import Link from "next/link";
import { DateTime } from "luxon";
import ToolShell, { birthFromParams } from "@/components/views/ToolShell";
import { calculateKundali } from "@/lib/astrology/kundali";
import { saturnCycles } from "@/lib/astrology/transits";
import { SIGNS } from "@/lib/astrology/constants";
import { toBirthQuery } from "@/lib/birthParams";

export const metadata: Metadata = {
  title: "Sade Sati Calculator — Your Shani Sade Sati & Dhaiya Dates",
  description:
    "Check whether you are in Sade Sati now and see every Sade Sati, Kantaka and Ashtama Shani period of your life, with all three phases and dates, from your exact Moon sign.",
};

const fmt = (d: Date) => DateTime.fromJSDate(d).toFormat("LLL yyyy");

export default async function SadeSatiPage({ searchParams }: PageProps<"/sade-sati">) {
  const birth = birthFromParams(await searchParams);
  let body: React.ReactNode = null;

  if (birth) {
    const chart = calculateKundali(birth);
    const moon = chart.planets.find((p) => p.planet === "Moon")!;
    const start = new Date(chart.utcDate);
    const cycles = saturnCycles(moon.signIndex, start, new Date(start.getTime() + 100 * 365.25 * 86400_000));
    const now = new Date();
    const current = cycles.find((c) => c.start <= now && now < c.end);
    const nextSade = cycles.find((c) => c.kind === "Sade Sati" && c.start > now);

    body = (
      <div className="space-y-6">
        <section className={`card-edge rounded-3xl p-7 ${current?.kind === "Sade Sati" ? "shadow-[0_0_40px_rgba(201,138,138,0.12)]" : ""}`}>
          <p className="text-xs font-semibold text-muted">Moon sign · {moon.sign} ({moon.nakshatra})</p>
          <h2 className={`mt-2 text-3xl font-bold ${current ? "text-rose" : "text-cream"}`}>
            {current ? `You are in ${current.kind}${current.kind === "Sade Sati" ? ` — ${current.phases.find((p) => p.start <= now && now < p.end)?.phase?.toLowerCase() ?? ""} phase` : ""}` : "You are not in Sade Sati or Dhaiya now"}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {current
              ? `It runs until ${fmt(current.end)}. `
              : nextSade
                ? `Your next Sade Sati begins in ${fmt(nextSade.start)}. `
                : ""}
            Sade Sati is Saturn&rsquo;s 7½-year passage through the sign before your Moon ({SIGNS[(moon.signIndex + 11) % 12]}), your Moon sign and the sign after it ({SIGNS[(moon.signIndex + 1) % 12]}).
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={`/kundali?${toBirthQuery(birth)}&tab=remedies`} className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-on-gold hover:bg-gold-bright">
              Remedies for your chart
            </Link>
            <Link href="/consultation" className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-cream hover:border-gold hover:text-gold-bright">
              Talk to an astrologer
            </Link>
          </div>
        </section>

        <section className="card-edge rounded-2xl p-6">
          <h2 className="text-lg font-bold text-cream">Your lifetime timeline</h2>
          <ol className="mt-4 space-y-3">
            {cycles.map((c) => {
              const isNow = c === current;
              const past = c.end < now;
              return (
                <li key={`${c.kind}-${c.start.toISOString()}`} className={`rounded-xl border p-4 ${isNow ? "border-rose/50 bg-rose/5" : "border-border/70"}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className={`font-semibold ${c.kind === "Sade Sati" ? "text-gold-bright" : "text-cream"}`}>
                      {c.kind}
                      {past && <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted">Past</span>}
                    </p>
                    <p className="font-tabular text-sm text-muted">
                      {fmt(c.start)} – {fmt(c.end)}
                    </p>
                  </div>
                  {c.kind === "Sade Sati" && (
                    <ul className="mt-2 grid gap-1 text-xs text-muted sm:grid-cols-3">
                      {c.phases.filter((p) => p.phase).map((p) => (
                        <li key={p.start.toISOString()}>
                          {p.phase} ({SIGNS[p.signIndex]}) · {fmt(p.start)} – {fmt(p.end)}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    );
  }

  return (
    <ToolShell
      eyebrow="Sade Sati calculator"
      title="Shani Sade Sati & Dhaiya"
      intro="When Saturn passes over your Moon sign, life slows and tests you. See whether you are in it now, and every such period of your life with its phases and dates."
      path="/sade-sati"
      submit="Check Sade Sati"
      birth={birth}
    >
      {body}
    </ToolShell>
  );
}
