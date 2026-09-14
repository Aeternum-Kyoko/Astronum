import Link from "next/link";
import { prisma } from "@/lib/db";
import Reveal from "@/components/Reveal";
import StickyChartStory from "@/components/StickyChartStory";
import Hero from "@/components/Hero";

export default async function HomePage() {
  const posts = await prisma.blogPost
    .findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take: 3,
    })
    .catch(() => []);

  return (
    <>
      <Hero />

      <section className="mx-auto max-w-5xl px-5 py-28 text-center md:py-40">
        <Reveal>
          <p className="text-2xl leading-[1.25] font-bold tracking-tight text-cream sm:text-4xl md:text-6xl">
            <span className="text-gold-bright">9 planets.</span> <span className="text-gold-bright">12 houses.</span>{" "}
            <span className="text-gold-bright">27 nakshatras.</span>
            <br />
            One chart that actually explains you.
          </p>
        </Reveal>
      </section>

      <section className="border-t border-border/60 bg-surface py-28 md:py-36">
        <StickyChartStory />
      </section>

      <section className="mx-auto max-w-6xl px-5 py-28 md:py-36">
        <Reveal>
          <p className="text-center text-sm font-semibold tracking-[0.2em] text-gold-bright uppercase">Built right</p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="mx-auto mt-4 max-w-3xl text-center text-4xl leading-[1.05] font-bold tracking-tight text-cream md:text-6xl">
            Real astronomy. Classical rules. No shortcuts.
          </h2>
        </Reveal>

        <div className="mt-20 grid gap-16 md:grid-cols-3">
          <Reveal delay={0}>
            <BigFact
              stat="Lahiri"
              title="The sidereal zodiac, done properly"
              body="Every placement is computed on the classical Lahiri (Chitrapaksha) ayanamsa — the standard used across Vedic astrology — not the tropical zodiac Western horoscopes use."
              glow="gold"
            />
          </Reveal>
          <Reveal delay={0.15}>
            <BigFact
              stat="±sec"
              title="Ephemeris-grade precision"
              body="Planetary positions come from real astronomical calculation, down to your exact minute and place of birth — validated against known astronomical events, not approximated."
              glow="violet"
            />
          </Reveal>
          <Reveal delay={0.3}>
            <BigFact
              stat="1:1"
              title="A person, not just a PDF"
              body="Every free chart can go further with a personal reading from a practicing astrologer — because a chart is a starting point, not the whole answer."
              glow="gold"
            />
          </Reveal>
        </div>
      </section>

      <section className="border-t border-border/60 bg-gradient-to-b from-surface to-ink-deep py-28 md:py-40">
        <div className="mx-auto max-w-4xl px-5 text-center">
          <Reveal>
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-gold/40 bg-ink-deep text-4xl">
              🙏
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <h2 className="mt-10 text-4xl leading-[1.1] font-bold tracking-tight text-cream md:text-6xl">
              Guidance rooted in decades of study.
            </h2>
          </Reveal>
          <Reveal delay={0.25}>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted">
              This site pairs precise, computed kundali charts with the interpretive experience of a
              practicing Vedic astrologer — so what you read isn&apos;t just data, it&apos;s grounded,
              considered guidance.
            </p>
          </Reveal>
          <Reveal delay={0.35}>
            <Link
              href="/about"
              className="mt-8 inline-block text-sm font-semibold tracking-wide text-gold-bright hover:text-gold"
            >
              Read the full story →
            </Link>
          </Reveal>
        </div>
      </section>

      {posts.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-28 md:py-36">
          <Reveal>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm font-semibold tracking-[0.2em] text-gold-bright uppercase">From the blog</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-cream md:text-5xl">
                  Latest readings & insights
                </h2>
              </div>
              <Link href="/blog" className="hidden text-sm font-medium text-gold-bright hover:text-gold md:block">
                View all →
              </Link>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {posts.map((post, i) => (
              <Reveal key={post.id} delay={i * 0.1}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="card-edge group block h-full rounded-2xl p-6 transition-transform hover:-translate-y-1"
                >
                  <p className="text-xs font-semibold tracking-wide text-gold-bright uppercase">{post.category}</p>
                  <h3 className="mt-3 text-xl font-bold tracking-tight text-cream group-hover:text-gold-bright">
                    {post.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted line-clamp-3">{post.excerpt}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section className="border-t border-border/60 bg-stars py-32 md:py-44">
        <div className="mx-auto max-w-4xl px-5 text-center">
          <Reveal>
            <h2 className="text-4xl leading-[1.05] font-bold tracking-tight text-cream md:text-7xl">
              Curious what your
              <br />
              chart really means?
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
              A free kundali gives you the placements. A personal reading tells you the story they
              tell together.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <Link
              href="/consultation"
              className="btn-shimmer mt-10 inline-block rounded-full bg-gold px-9 py-4 text-base font-semibold text-ink-deep transition-colors hover:bg-gold-bright"
            >
              Book a Personal Reading
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function BigFact({ stat, title, body, glow }: { stat: string; title: string; body: string; glow: "gold" | "violet" }) {
  return (
    <div className="relative">
      <div className={`glow-blob glow-blob-${glow} -top-10 -left-10 h-40 w-40 opacity-60`} />
      <p className="relative text-5xl font-bold tracking-tight text-gold-bright">{stat}</p>
      <h3 className="relative mt-5 text-xl font-bold tracking-tight text-cream">{title}</h3>
      <p className="relative mt-3 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}
