import type { Metadata } from "next";
import Link from "next/link";
import LearnPageHeader from "@/components/learn/LearnPageHeader";

export const metadata: Metadata = {
  title: "Kundli Matching for Love, Business and Friendship — A Complete Guide",
  description:
    "How Vedic astrology compares two charts beyond marriage: the checkpoints for romantic interest, business partners and friends, what each one means, how to work them out by hand, and how to read the result.",
  alternates: { canonical: "/learn/compatibility" },
};

type Row = { checkpoint: string; weight: number; look: string; good: string; watch: string };

const MOON_PAIRS = [
  { pair: "Same sign (1/1)", meaning: "Easy understanding and similar instincts — but you share the same blind spots." },
  { pair: "Opposite signs (7/7)", meaning: "Complementary: each supplies what the other lacks. Magnetic in romance, balanced in business." },
  { pair: "3rd and 11th (3/11)", meaning: "Mutual support and shared gains — one of the best pairings for friends and partners." },
  { pair: "4th and 10th (4/10)", meaning: "One steadies, the other drives. Strong for work; can feel unequal in love." },
  { pair: "Trine (5/9)", meaning: "Natural goodwill and shared values. Excellent for friendship and romance." },
  { pair: "2nd and 12th (2/12)", meaning: "A quiet drain — priorities and money need to be spelled out." },
  { pair: "6th and 8th (6/8)", meaning: "The most friction-prone pairing: misunderstandings and power struggles unless handled consciously." },
];

const ROMANCE: Row[] = [
  { checkpoint: "Venus and Mars", weight: 15, look: "Is either person's Venus in the same sign as, opposite (7th from), or in trine (5th/9th) to the other's Mars?", good: "Venus–Mars conjunction or opposition", watch: "No contact at all — attraction may need time" },
  { checkpoint: "Moon signs", weight: 15, look: "Count the signs between the two Moons (see the table above)", good: "Opposite or trine", watch: "6/8 or 2/12" },
  { checkpoint: "Moon-sign lords (Graha Maitri)", weight: 12, look: "Are the lords of the two Moon signs natural friends?", good: "Friends both ways, or the same planet", watch: "Enemies both ways" },
  { checkpoint: "Intimacy (Yoni)", weight: 12, look: "The yoni (animal) of each birth nakshatra", good: "Same or friendly yonis", watch: "Sworn-enemy yonis (e.g. Cat–Rat, Cow–Tiger)" },
  { checkpoint: "Temperament (Gana)", weight: 10, look: "Deva, Manushya or Rakshasa gana of each nakshatra", good: "Same gana", watch: "Rakshasa with Manushya" },
  { checkpoint: "Moon and Venus", weight: 8, look: "Does one person's Moon contact the other's Venus?", good: "Conjunction or opposition", watch: "No contact" },
  { checkpoint: "Romance overlays", weight: 13, look: "Does one person's Venus, Moon or Mars fall in the other's 5th (romance) or 7th (partnership) house?", good: "Two or more such overlays", watch: "None" },
  { checkpoint: "Mangal Dosha balance", weight: 5, look: "Uncancelled Mangal Dosha in each chart", good: "Both or neither", watch: "Only one" },
  { checkpoint: "Cooling or obsessive contacts", weight: 10, look: "Does one person's Saturn or Rahu sit on the other's Venus or Moon?", good: "None", watch: "Saturn can cool feelings; Rahu can make them intense and unsettled" },
];

const BUSINESS: Row[] = [
  { checkpoint: "Moon signs", weight: 15, look: "Distance between the two Moons", good: "3/11 or 4/10", watch: "6/8 (friction) or 2/12 (money drain)" },
  { checkpoint: "Moon-sign lords (Graha Maitri)", weight: 15, look: "Friendship between the two Moon-sign lords", good: "Friends both ways", watch: "Enemies both ways — trust is hard won" },
  { checkpoint: "Lagna lords", weight: 10, look: "Friendship between the two Lagna lords", good: "Friends", watch: "Enemies — clashing working styles" },
  { checkpoint: "Birth stars (Tara)", weight: 8, look: "Count nakshatras from each to the other; divide by 9", good: "Remainders other than 3, 5 and 7", watch: "Vipat, Pratyari or Vadha tara" },
  { checkpoint: "Temperament (Gana)", weight: 10, look: "Each person's gana", good: "Same gana", watch: "Rakshasa with Manushya" },
  { checkpoint: "Mercury", weight: 10, look: "Relationship between the two Mercuries (the planet of commerce)", good: "Same sign, opposite or trine", watch: "6/8 apart — negotiations misfire" },
  { checkpoint: "Wealth overlays", weight: 12, look: "Does one person's Jupiter, Venus or Mercury fall in the other's 2nd (money), 10th (career) or 11th (gains)?", good: "Several overlays", watch: "None" },
  { checkpoint: "Partnership links", weight: 10, look: "Does each person's Moon or Lagna lord fall in the other's 7th, 10th or 11th house?", good: "At least one each way", watch: "None" },
  { checkpoint: "Pressure points", weight: 5, look: "Does one person's Saturn or Mars sit on the other's Moon or Mercury?", good: "None", watch: "Pressure or conflict over decisions" },
  { checkpoint: "Current timing", weight: 5, look: "Is each person's Mahadasha lord tied to the 1st, 2nd, 10th or 11th house?", good: "Both", watch: "Neither — a less ripe time to start" },
];

const FRIENDSHIP: Row[] = [
  { checkpoint: "Moon-sign lords (Graha Maitri)", weight: 20, look: "Friendship between the two Moon-sign lords", good: "Friends both ways", watch: "Enemies both ways" },
  { checkpoint: "Moon signs", weight: 20, look: "Distance between the two Moons", good: "3/11 or trine", watch: "6/8" },
  { checkpoint: "Temperament (Gana)", weight: 15, look: "Each person's gana", good: "Same gana", watch: "Rakshasa with Manushya" },
  { checkpoint: "Birth stars (Tara)", weight: 10, look: "Tara count both ways", good: "Auspicious taras", watch: "Vipat, Pratyari or Vadha" },
  { checkpoint: "Mutual influence (Vashya)", weight: 5, look: "Vashya group of each Moon sign", good: "Same group", watch: "One group 'devours' the other (e.g. Vanachara over Manava)" },
  { checkpoint: "Friendship overlays", weight: 15, look: "Does one person's Moon, Jupiter or Venus fall in the other's 3rd (companionship), 5th (joy) or 11th (friends)?", good: "Two or more", watch: "None" },
  { checkpoint: "Jupiter and Moon", weight: 10, look: "Does one person's Jupiter contact the other's Moon?", good: "Conjunction, opposition or trine", watch: "No contact" },
  { checkpoint: "Friction points", weight: 5, look: "Does one person's Saturn or Mars sit on the other's Moon?", good: "None", watch: "Criticism or quick tempers" },
];

function CheckpointTable({ rows }: { rows: Row[] }) {
  return (
    <div className="not-prose overflow-x-auto rounded-2xl border border-border">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-border bg-surface text-left text-xs text-muted">
            <th className="px-4 py-3">Checkpoint</th>
            <th className="px-4 py-3">Weight</th>
            <th className="px-4 py-3">What to look at</th>
            <th className="px-4 py-3">Good sign</th>
            <th className="px-4 py-3">Watch for</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.checkpoint} className="border-b border-border/60 align-top last:border-0">
              <td className="px-4 py-3 font-semibold text-cream">{r.checkpoint}</td>
              <td className="px-4 py-3 font-tabular text-gold-bright">{r.weight}</td>
              <td className="px-4 py-3 text-muted">{r.look}</td>
              <td className="px-4 py-3 text-muted">{r.good}</td>
              <td className="px-4 py-3 text-muted">{r.watch}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TryIt({ type, label }: { type: string; label: string }) {
  return (
    <p className="not-prose mt-6">
      <Link href={`/matching?type=${type}`} className="inline-block rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-on-gold hover:bg-gold-bright">
        {label}
      </Link>
    </p>
  );
}

export default function CompatibilityGuidePage() {
  return (
    <section className="mx-auto max-w-4xl px-5 py-16 md:py-20">
      <LearnPageHeader
        eyebrow="Compatibility"
        title="Matching kundlis beyond marriage"
        description="How Vedic astrology compares two charts for a romantic interest, a business partner or a friend — the checkpoints, what they mean, and how to work them out yourself."
      />

      <nav aria-label="On this page" className="mt-10 flex flex-wrap justify-center gap-2 text-sm">
        {[
          ["#principles", "How matching works"],
          ["#building-blocks", "The building blocks"],
          ["#romance", "Romantic interest"],
          ["#business", "Business partners"],
          ["#friendship", "Friends"],
          ["#reading", "Reading the result"],
        ].map(([href, label]) => (
          <a key={href} href={href} className="rounded-full border border-border px-4 py-1.5 text-muted hover:border-gold hover:text-gold-bright">
            {label}
          </a>
        ))}
      </nav>

      <article className="prose prose-invert mt-12 max-w-none prose-headings:text-cream prose-p:text-muted prose-li:text-muted prose-strong:text-cream prose-a:text-gold-bright prose-h2:text-3xl prose-h2:scroll-mt-24 prose-h3:text-xl">
        <h2 id="principles">How kundli matching works</h2>
        <p>
          The familiar 36-point <strong>Ashtakoota Guna Milan</strong> was designed for one purpose: marriage. Its eight
          kootas weigh things that matter for a lifelong household — Nadi for health and children, Yoni for physical
          intimacy, Bhakoot for family welfare. Use it for a business partner and it will mark you down for things that
          have nothing to do with running a company.
        </p>
        <p>
          There is no single classical text that prescribes a separate system for business or friendship. What
          practising astrologers do instead is keep the principles that apply to any relationship and weigh them for the
          relationship in question. Every non-marriage report on this site follows that approach, openly:
        </p>
        <ul>
          <li>
            <strong>The Moon comes first.</strong> In Jyotish the Moon is the mind. How two Moons relate — their signs,
            their lords and their nakshatras — shows how two people feel around each other, whatever the relationship.
          </li>
          <li>
            <strong>Planetary friendship shows trust.</strong> If the planets ruling your Moon signs (and your Lagnas) are
            natural friends, you tend to understand each other&rsquo;s motives.
          </li>
          <li>
            <strong>Houses give the purpose.</strong> Each relationship lives in particular houses: the 5th and 7th for
            romance, the 2nd, 7th, 10th and 11th for business, the 3rd, 5th and 11th for friendship.
          </li>
          <li>
            <strong>Overlays show the chemistry between two charts.</strong> When one person&rsquo;s planet falls in a key
            house of the other&rsquo;s chart, that person activates that area of the other&rsquo;s life.
          </li>
          <li>
            <strong>Timing matters.</strong> A good match started in a difficult dasha can still struggle; business
            especially benefits from both people running supportive periods.
          </li>
        </ul>
        <p>
          <strong>You need exact birth details for both people</strong> — date, time and place. The Moon moves about 13°
          a day and the Lagna changes every two hours, so a guessed time can change the Moon&rsquo;s nakshatra and every
          house overlay.
        </p>

        <h2 id="building-blocks">The building blocks</h2>

        <h3>1. The relationship between the two Moon signs</h3>
        <p>
          Count from one person&rsquo;s Moon sign to the other&rsquo;s, including both, and then back the other way. The
          pair of numbers is the relationship. For example, a Moon in Aries and a Moon in Leo are 5th and 9th from each
          other — a trine.
        </p>
        <div className="not-prose overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <tbody>
              {MOON_PAIRS.map((m) => (
                <tr key={m.pair} className="border-b border-border/60 last:border-0">
                  <td className="w-48 px-4 py-3 font-semibold text-cream">{m.pair}</td>
                  <td className="px-4 py-3 text-muted">{m.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3>2. Planetary friendship (Graha Maitri)</h3>
        <p>
          Every sign has a ruling planet. Look up the lords of both Moon signs (and, for work, both Lagna signs) and ask
          how each regards the other in the classical scheme: the Sun, Moon, Mars and Jupiter form one friendly group;
          Mercury, Venus and Saturn another. Friends both ways is best; enemies both ways is hardest. See{" "}
          <Link href="/learn/planets">the planets guide</Link> for every friendship.
        </p>

        <h3>3. Tara, Gana, Vashya and Yoni</h3>
        <p>
          These come straight from Guna Milan and depend on each person&rsquo;s birth nakshatra (the Moon&rsquo;s
          nakshatra):
        </p>
        <ul>
          <li>
            <strong>Tara</strong> — count nakshatras from one person to the other and divide by 9. Remainders of 3, 5 and
            7 (Vipat, Pratyari, Vadha) are unfavourable; the rest are good. Check both directions.
          </li>
          <li>
            <strong>Gana</strong> — each nakshatra is Deva (gentle), Manushya (human, balanced) or Rakshasa (intense). The
            same gana is easiest; Rakshasa with Manushya is the hardest mix.
          </li>
          <li>
            <strong>Vashya</strong> — which person tends to influence the other, from the Moon sign&rsquo;s group.
          </li>
          <li>
            <strong>Yoni</strong> — an animal for each nakshatra, describing instinct and intimacy. Used only for romance.
          </li>
        </ul>
        <p>
          Because the marriage tables are written for a bride and groom, the reports here average both directions so the
          result is the same whoever you enter first.
        </p>

        <h3>4. House overlays</h3>
        <p>
          Take a planet in one person&rsquo;s chart and note its sign. Now count from the other person&rsquo;s Lagna sign
          to that sign, including both — the number is the house it falls in for them. If A&rsquo;s Jupiter is in Taurus
          and B&rsquo;s Lagna is Capricorn, A&rsquo;s Jupiter falls in B&rsquo;s 5th house: A tends to bring B joy,
          wisdom and good judgement. Always check both directions.
        </p>

        <h3>5. Planet-to-planet contacts</h3>
        <p>
          Two planets in the same sign are conjunct; seven signs apart they oppose (face) each other; five or nine apart
          they are in trine. Conjunction and opposition are the strongest contacts, trine the most harmonious.
        </p>

        <h2 id="romance">Romantic interest</h2>
        <p>
          For dating and romance — before or apart from marriage — the questions are chemistry, emotional rhythm and
          whether you light up each other&rsquo;s houses of love. Nadi (progeny) is set aside; Mangal Dosha is kept but
          weighted lightly.
        </p>
        <CheckpointTable rows={ROMANCE} />
        <h3>How to check it yourself</h3>
        <ol>
          <li>Find both Venus and both Mars signs. Check whether either Venus is in the same sign as, opposite, or in trine to the other person&rsquo;s Mars.</li>
          <li>Work out the Moon-sign relationship and whether the Moon-sign lords are friends.</li>
          <li>Look up both birth nakshatras for Yoni and Gana.</li>
          <li>Place each person&rsquo;s Venus, Moon and Mars in the other&rsquo;s chart and note any that land in the 5th or 7th house.</li>
          <li>Check for Saturn or Rahu sitting on the other&rsquo;s Venus or Moon, and compare Mangal Dosha.</li>
        </ol>
        <p>
          <strong>Making it work:</strong> a strong Venus–Mars contact with a difficult Moon pairing is common — plenty of
          spark, less ease. Talk early about how each of you handles feelings and conflict. If you are considering
          marriage, run the full marriage match as well.
        </p>
        <TryIt type="romance" label="Check romantic compatibility" />

        <h2 id="business">Business partners</h2>
        <p>
          A partnership is a marriage of money and decisions. What matters is trust, how you think and negotiate, whether
          you bring each other gains, and whether now is a good time for both of you. Yoni and Nadi play no part.
        </p>
        <CheckpointTable rows={BUSINESS} />
        <h3>How to check it yourself</h3>
        <ol>
          <li>Work out the Moon-sign relationship; 3/11 and 4/10 are ideal for partners.</li>
          <li>Check whether the Moon-sign lords and the Lagna lords are friends.</li>
          <li>Compare the two Mercuries — the planet of commerce, contracts and communication.</li>
          <li>Place each person&rsquo;s Jupiter, Venus and Mercury in the other&rsquo;s chart and note landings in the 2nd, 10th or 11th house.</li>
          <li>Place each person&rsquo;s Moon and Lagna lord in the other&rsquo;s chart and note landings in the 7th, 10th or 11th.</li>
          <li>Look for Saturn or Mars sitting on the other&rsquo;s Moon or Mercury.</li>
          <li>Check each person&rsquo;s current Mahadasha lord: is it placed in, or does it rule, the 1st, 2nd, 10th or 11th house?</li>
        </ol>
        <p>
          <strong>Making it work:</strong> no chart replaces a clear written agreement. Where the charts show a 2/12 Moon
          pairing or pressure on Mercury, be especially explicit about money, roles and how disagreements are settled.
        </p>
        <TryIt type="business" label="Check business compatibility" />

        <h2 id="friendship">Friends</h2>
        <p>
          Friendship rests on mental rapport and ease. Graha Maitri and the Moon-sign relationship carry the most weight,
          with the 11th house — the house of friends — close behind.
        </p>
        <CheckpointTable rows={FRIENDSHIP} />
        <h3>How to check it yourself</h3>
        <ol>
          <li>Check whether your Moon-sign lords are friends, and how far apart your Moons are.</li>
          <li>Compare ganas and taras from your birth nakshatras.</li>
          <li>Place each person&rsquo;s Moon, Jupiter and Venus in the other&rsquo;s chart; landings in the 3rd, 5th or 11th house mark a natural friendship.</li>
          <li>See whether either person&rsquo;s Jupiter touches the other&rsquo;s Moon — the classic sign of someone who lifts you up.</li>
          <li>Note any Saturn or Mars sitting on the other&rsquo;s Moon.</li>
        </ol>
        <TryIt type="friendship" label="Check friendship compatibility" />

        <h2 id="reading">Reading the result</h2>
        <ul>
          <li>
            <strong>75 and above — Excellent.</strong> The charts support each other on most counts.
          </li>
          <li>
            <strong>60–74 — Good.</strong> Real strengths, with a few areas to handle consciously.
          </li>
          <li>
            <strong>45–59 — Workable.</strong> Strengths and friction in roughly equal measure; awareness makes the
            difference.
          </li>
          <li>
            <strong>Below 45 — Challenging.</strong> Go in with open eyes, clear agreements and patience.
          </li>
        </ul>
        <p>
          Read the checkpoints, not just the number: a single 6/8 Moon pairing or a Saturn on the other&rsquo;s Moon can
          matter more than a handful of small positives. And remember what a comparison of two charts cannot see — each
          person&rsquo;s own dashas, their maturity, and the choices they make. Compatibility describes tendencies, not
          destiny.
        </p>
        <p>
          For a marriage, use the full <Link href="/matching">36-point Guna Milan</Link>. For anything important, a
          personal reading that looks at both whole charts goes far beyond any score —{" "}
          <Link href="/consultation">book a compatibility reading</Link>.
        </p>
      </article>
    </section>
  );
}
