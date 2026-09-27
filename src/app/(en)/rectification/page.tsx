import type { Metadata } from "next";
import RectificationTool from "@/components/RectificationTool";
import { EVENT_KEYS, EVENT_KINDS } from "@/lib/astrology/rectificationEvents";

export const metadata: Metadata = {
  title: "Birth Time Rectification — Find Your Exact Birth Time",
  description:
    "Not sure of your birth time? Enter an approximate time and dated life events; every minute in the window is tested against Vimshottari dasha, divisional charts and Jupiter–Saturn transits, with the reason for every point.",
  alternates: { canonical: "/rectification" },
};

export default function RectificationPage() {
  return (
    <section className="relative">
      <div className="relative mx-auto max-w-5xl px-5 py-14 md:py-20">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-gold-bright">Birth time rectification</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-cream md:text-5xl">Find your exact birth time from your life</h1>
          <p className="mt-4 text-base leading-relaxed text-muted">
            The Lagna changes every two hours and the Navamsa every thirteen minutes, so a rough birth time can give the wrong chart. Tell us what happened in your life and when; we test every minute around your time and show which one fits.
          </p>
        </header>

        <div className="mt-10">
          <RectificationTool />
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <section className="card-edge rounded-2xl p-6">
            <h2 className="text-lg font-bold text-gold-bright">How it works</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted">
              <li>Every minute in your window becomes a candidate birth time, and a full chart is cast for each.</li>
              <li>For each event, we find the Mahadasha, Antardasha and Pratyantardasha running on that date. A small change in birth time moves the Moon, which moves every dasha date — so only the right time puts the right lords on your events.</li>
              <li>Those lords score when they occupy, rule or aspect the houses of the event, or act for a sign lord that does. Sub-periods count most because they pin the timing.</li>
              <li>The event&rsquo;s divisional chart — D9 for marriage, D10 for career, D7 for children — checks the same lords. Vargas change every few minutes, which separates neighbouring times.</li>
              <li>Jupiter and Saturn both touching the event house on the date (the double transit) adds weight.</li>
            </ol>
          </section>
          <section className="card-edge rounded-2xl p-6">
            <h2 className="text-lg font-bold text-gold-bright">Getting a reliable answer</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
              <li>Use events with exact dates from documents — a wedding card, a joining letter, a child&rsquo;s birth certificate.</li>
              <li>Mix kinds of events. Three different kinds separate candidates far better than three of the same.</li>
              <li>Start with the smallest window you&rsquo;re confident about. If the best time sits at the edge, widen it.</li>
              <li>If two windows tie, add one more event. If the result crosses a Lagna change, check your appearance and temperament against both Lagnas with an astrologer.</li>
              <li>This is a strong first pass, not a verdict — traditional rectification also uses physical features and the parents&rsquo; charts.</li>
            </ul>
          </section>
        </div>

        <section className="card-edge mt-6 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-gold-bright">What each event looks for</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead className="text-xs text-muted">
                <tr className="border-b border-border">
                  <th scope="col" className="py-2 pr-3 font-semibold">Event</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">Houses from Lagna</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">Significator</th>
                  <th scope="col" className="py-2 font-semibold">Divisional chart</th>
                </tr>
              </thead>
              <tbody>
                {EVENT_KEYS.map((k) => (
                  <tr key={k} className="border-b border-border/60 last:border-0">
                    <th scope="row" className="py-2 pr-3 font-semibold text-cream">{EVENT_KINDS[k].label}</th>
                    <td className="font-tabular py-2 pr-3 text-muted">{EVENT_KINDS[k].houses.join(", ")}</td>
                    <td className="py-2 pr-3 text-muted">{EVENT_KINDS[k].karaka.join(", ")}</td>
                    <td className="py-2 text-muted">
                      {EVENT_KINDS[k].varga}, {EVENT_KINDS[k].vargaHouse}th house
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  );
}
