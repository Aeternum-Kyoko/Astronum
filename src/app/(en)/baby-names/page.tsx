import type { Metadata } from "next";
import Link from "next/link";
import { NAKSHATRAS } from "@/lib/astrology/constants";
import { NAMAKSHAR } from "@/lib/astrology/namakshar";
import { namesFor, syllablesFor } from "@/lib/babyNames";

export const metadata: Metadata = {
  title: "Baby Names by Nakshatra — Namakshar and Meanings",
  description: "Find baby names by birth nakshatra and pada: the traditional first syllables (namakshar) for all 27 nakshatras, with boy and girl names and their meanings.",
  alternates: { canonical: "/baby-names" },
};

export default async function BabyNamesPage({ searchParams }: PageProps<"/baby-names">) {
  const params = await searchParams;
  const n = Number(params.nakshatra);
  const nak = Number.isInteger(n) && n >= 0 && n < 27 ? n : null;
  const padaRaw = Number(params.pada);
  const pada = nak !== null && [1, 2, 3, 4].includes(padaRaw) ? padaRaw : undefined;
  const gender = params.gender === "Boy" || params.gender === "Girl" ? params.gender : undefined;
  const groups = nak !== null ? namesFor(syllablesFor(nak, pada), gender) : [];

  return (
    <section className="relative">
      <div className="relative mx-auto max-w-5xl px-5 py-14 md:py-20">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-gold-bright">Namakaran</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-cream md:text-5xl">Baby names by nakshatra</h1>
          <p className="mt-4 text-base leading-relaxed text-muted">
            Tradition names a child with the syllable of the Moon&rsquo;s nakshatra pada at birth. Choose the nakshatra and pada to see the syllables and names.{" "}
            <Link href="/nakshatra-finder" className="font-semibold text-gold-bright underline underline-offset-2">
              Don&rsquo;t know the nakshatra? Find it from the birth details.
            </Link>
          </p>
        </header>

        <form method="get" className="card-edge mx-auto mt-10 grid max-w-3xl gap-4 rounded-2xl p-6 sm:grid-cols-[1fr_8rem_8rem_auto] sm:items-end">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted">Nakshatra</span>
            <select name="nakshatra" defaultValue={nak ?? ""} className="input" required>
              <option value="" disabled>
                Choose…
              </option>
              {NAKSHATRAS.map((x, i) => (
                <option key={x} value={i}>
                  {x}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted">Pada</span>
            <select name="pada" defaultValue={pada ?? ""} className="input">
              <option value="">All four</option>
              {[1, 2, 3, 4].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted">For a</span>
            <select name="gender" defaultValue={gender ?? ""} className="input">
              <option value="">Boy or girl</option>
              <option value="Boy">Boy</option>
              <option value="Girl">Girl</option>
            </select>
          </label>
          <button type="submit" className="rounded-full bg-gold px-6 py-3 text-sm font-semibold text-on-gold hover:bg-gold-bright">
            Show names
          </button>
        </form>

        {nak !== null && (
          <div className="mt-10 space-y-6">
            <p className="text-center text-sm text-muted">
              {NAKSHATRAS[nak]} syllables: {NAMAKSHAR[nak].map((s, i) => `pada ${i + 1} — ${s}`).join(" · ")}
            </p>
            {groups.map((g) => (
              <section key={g.syllable} className="card-edge rounded-2xl p-6">
                <h2 className="text-lg font-bold text-gold-bright">Names starting with &ldquo;{g.syllable}&rdquo;</h2>
                {g.names.length ? (
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {g.names.map((x) => (
                      <li key={x.name} className="rounded-xl border border-border/70 px-4 py-2.5 text-sm">
                        <span className="font-semibold text-cream">{x.name}</span> <span className="text-xs text-muted">· {x.gender}</span>
                        <span className="block text-muted">{x.meaning}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted">This syllable is rare in modern names; a name that simply contains the sound is also traditional.</p>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
