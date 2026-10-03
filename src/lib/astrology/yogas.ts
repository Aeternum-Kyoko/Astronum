import type { PlanetPlacement, Yoga } from "./types";
import { getDignity } from "./dignity";
import { SIGN_LORDS, type PlanetName } from "./constants";
import type { Locale } from "../i18n/locale";
import { pick } from "../i18n/ui";
import { term } from "../i18n/terms";

const KENDRA_HOUSES = new Set([1, 4, 7, 10]);
const BENEFICS = new Set<PlanetName>(["Mercury", "Jupiter", "Venus"]);

function houseFrom(base: PlanetPlacement, target: PlanetPlacement): number {
  return ((target.signIndex - base.signIndex + 12) % 12) + 1;
}

function houseFromSignIndex(baseSignIndex: number, target: PlanetPlacement): number {
  return ((target.signIndex - baseSignIndex + 12) % 12) + 1;
}

const MAHAPURUSHA: { planet: PlanetName; name: string; hi: string }[] = [
  { planet: "Mars", name: "Ruchaka Yoga", hi: "रुचक योग" },
  { planet: "Mercury", name: "Bhadra Yoga", hi: "भद्र योग" },
  { planet: "Jupiter", name: "Hamsa Yoga", hi: "हंस योग" },
  { planet: "Venus", name: "Malavya Yoga", hi: "मालव्य योग" },
  { planet: "Saturn", name: "Sasha Yoga", hi: "शश योग" },
];

/** Hindi names for the yogas, keyed by their English name. */
export const YOGA_NAME_HI: Record<string, string> = {
  "Gaj Kesari Yoga": "गजकेसरी योग",
  "Chandra-Mangal Yoga": "चंद्र-मंगल योग",
  "Kemadruma Yoga": "केमद्रुम योग",
  "Neechabhanga Raja Yoga": "नीचभंग राजयोग",
  "Vipareeta Raja Yoga": "विपरीत राजयोग",
  "Parivartana Yoga": "परिवर्तन योग",
  "Adhi Yoga": "अधि योग",
  "Shakat Yoga": "शकट योग",
  "Guru Chandal Yoga": "गुरु चांडाल योग",
  "Budh-Aditya Yoga": "बुधादित्य योग",
  "Amala Yoga": "अमला योग",
  ...Object.fromEntries(MAHAPURUSHA.map((m) => [`${m.name} (Panch Mahapurusha)`, `${m.hi} (पंच महापुरुष)`])),
};

export function detectYogas(planets: PlanetPlacement[], ascendantSignIndex: number, locale: Locale = "en"): Yoga[] {
  const byName = new Map(planets.map((p) => [p.planet, p]));
  const found: Yoga[] = [];
  const L = pick(locale);
  const n = (x: string) => term(locale, x);
  const hi = locale === "hi";
  const yogas = { push: (y: Yoga) => found.push({ ...y, key: y.name, name: hi ? (YOGA_NAME_HI[y.name] ?? y.name) : y.name }) };

  for (const { planet, name, hi: nameHi } of MAHAPURUSHA) {
    const p = byName.get(planet);
    if (!p) continue;
    const dignity = getDignity(planet, p.signIndex);
    const present = KENDRA_HOUSES.has(p.house) && (dignity === "Exalted" || dignity === "Own Sign");
    yogas.push({
      name: `${name} (Panch Mahapurusha)`,
      present,
      description: present
        ? L(`${planet} is in a kendra house (${p.house}) in its own or exalted sign — a classical Panch Mahapurusha combination associated with strength of character and achievement.`, `${n(planet)} केंद्र भाव (${p.house}) में अपनी या उच्च राशि में हैं — शास्त्रीय पंच महापुरुष योग, जो चरित्र-बल और उपलब्धि से जुड़ा है।`)
        : L(`${planet} does not form ${name} in this chart (not in a kendra house in its own or exalted sign).`, `इस कुंडली में ${n(planet)} ${nameHi} नहीं बनाते (वे केंद्र भाव में अपनी या उच्च राशि में नहीं हैं)।`),
    });
  }

  const moon = byName.get("Moon");
  const jupiter = byName.get("Jupiter");
  if (moon && jupiter) {
    const rel = houseFrom(moon, jupiter);
    const present = KENDRA_HOUSES.has(rel);
    yogas.push({
      name: "Gaj Kesari Yoga",
      present,
      description: present
        ? L("Jupiter is in a kendra (1st, 4th, 7th or 10th) from the Moon — a well-known combination for wisdom, reputation, and steady prosperity.", "गुरु चंद्र से केंद्र (पहले, चौथे, सातवें या दसवें) में हैं — ज्ञान, प्रतिष्ठा और स्थिर समृद्धि का प्रसिद्ध योग।")
        : L("Jupiter is not in a kendra from the Moon, so classical Gaj Kesari Yoga is not indicated.", "गुरु चंद्र से केंद्र में नहीं हैं, इसलिए शास्त्रीय गजकेसरी योग नहीं बनता।"),
    });
  }

  const mars = byName.get("Mars");
  if (moon && mars) {
    const present = moon.signIndex === mars.signIndex;
    yogas.push({
      name: "Chandra-Mangal Yoga",
      present,
      description: present
        ? L("Moon and Mars are conjunct — a combination classically linked to drive, resourcefulness, and the ability to generate wealth.", "चंद्र और मंगल की युति है — शास्त्रों में यह उत्साह, साधन-संपन्नता और धन कमाने की क्षमता से जुड़ी है।")
        : L("Moon and Mars are not conjunct in this chart.", "इस कुंडली में चंद्र और मंगल की युति नहीं है।"),
    });
  }

  if (moon) {
    const others = planets.filter((p) => p.planet !== "Moon" && p.planet !== "Sun");
    const secondFromMoon = (moon.signIndex + 1) % 12;
    const twelfthFromMoon = (moon.signIndex + 11) % 12;
    const hasNeighbor = others.some((p) => p.signIndex === secondFromMoon || p.signIndex === twelfthFromMoon);
    // Classical cancellations: a planet (not the Sun) shares the Moon's sign, or the Moon / any such planet is in a kendra.
    const hasCompanion = others.some((p) => p.signIndex === moon.signIndex);
    const moonInKendra = KENDRA_HOUSES.has(houseFromSignIndex(ascendantSignIndex, moon));
    const planetInKendraFromMoon = others.some((p) => p.planet !== "Rahu" && p.planet !== "Ketu" && KENDRA_HOUSES.has(houseFrom(moon, p)));
    const cancelled = hasNeighbor || hasCompanion || moonInKendra || planetInKendraFromMoon;
    yogas.push({
      name: "Kemadruma Yoga",
      present: !cancelled,
      description: !cancelled
        ? L("No planets (besides the Sun) flank or join the Moon, and none stand in a kendra from it — the classical condition for Kemadruma Yoga, traditionally read as a caution needing the rest of the chart to be weighed carefully.", "चंद्र के आसपास या उसके साथ (सूर्य के अलावा) कोई ग्रह नहीं है और चंद्र से केंद्र में भी कोई नहीं — यह केमद्रुम योग की शास्त्रीय शर्त है, जिसे सावधानी का संकेत माना जाता है; शेष कुंडली को ध्यान से तौलना चाहिए।")
        : L(
            hasCompanion
              ? "A planet shares the Moon's sign, so Kemadruma Yoga is cancelled."
              : hasNeighbor
                ? "Planets flank the Moon on at least one side, so Kemadruma Yoga is cancelled."
                : "The Moon, or a planet from it, stands in a kendra, so Kemadruma Yoga is cancelled.",
            hasCompanion
              ? "चंद्र की राशि में कोई ग्रह है, इसलिए केमद्रुम योग भंग है।"
              : hasNeighbor
                ? "चंद्र के कम से कम एक ओर ग्रह हैं, इसलिए केमद्रुम योग भंग है।"
                : "चंद्र स्वयं या उससे कोई ग्रह केंद्र में है, इसलिए केमद्रुम योग भंग है।"
          ),
    });
  }

  // --- Neechabhanga Raja Yoga: a debilitated planet's debilitation is cancelled
  // when the lord of its debilitation sign sits in a kendra from the Lagna or the Moon.
  {
    const debilitated = planets.filter((p) => getDignity(p.planet, p.signIndex) === "Debilitated");
    const cancelled = debilitated.filter((p) => {
      const dispositor = byName.get(SIGN_LORDS[p.signIndex] as PlanetName);
      if (!dispositor) return false;
      const fromLagna = houseFromSignIndex(ascendantSignIndex, dispositor);
      const fromMoon = moon ? houseFrom(moon, dispositor) : null;
      return KENDRA_HOUSES.has(fromLagna) || (fromMoon !== null && KENDRA_HOUSES.has(fromMoon));
    });
    const present = cancelled.length > 0;
    yogas.push({
      name: "Neechabhanga Raja Yoga",
      present,
      description: present
        ? L(
            `${cancelled.map((p) => p.planet).join(", ")} ${cancelled.length > 1 ? "are" : "is"} debilitated but the dispositor of that sign sits in a kendra from the Lagna or the Moon, classically cancelling the debilitation and turning it into a source of unexpected rise.`,
            `${cancelled.map((p) => n(p.planet)).join(", ")} नीच के हैं, पर उस राशि का स्वामी लग्न या चंद्र से केंद्र में है — शास्त्रों के अनुसार इससे नीचत्व भंग होता है और यह अप्रत्याशित उन्नति का स्रोत बनता है।`
          )
        : debilitated.length > 0
          ? L("A planet is debilitated in this chart, but the cancellation condition (its dispositor in a kendra from the Lagna or Moon) is not met.", "इस कुंडली में एक ग्रह नीच का है, पर भंग की शर्त (उसकी राशि का स्वामी लग्न या चंद्र से केंद्र में) पूरी नहीं होती।")
          : L("No planet is debilitated in this chart, so there is nothing to cancel.", "इस कुंडली में कोई ग्रह नीच का नहीं है, इसलिए भंग का प्रश्न नहीं उठता।"),
    });
  }

  // --- Vipareeta Raja Yoga: a dushthana (6th/8th/12th) lord placed in one of the OTHER two dushthanas.
  {
    const dushthanaLordOf = (house: number) => {
      const signIndex = (ascendantSignIndex + house - 1) % 12;
      return SIGN_LORDS[signIndex] as PlanetName;
    };
    const variants: { house: number; other: number[] }[] = [
      { house: 6, other: [8, 12] },
      { house: 8, other: [6, 12] },
      { house: 12, other: [6, 8] },
    ];
    const hits = variants.filter(({ house, other }) => {
      const lord = byName.get(dushthanaLordOf(house));
      return lord && other.includes(lord.house);
    });
    const present = hits.length > 0;
    yogas.push({
      name: "Vipareeta Raja Yoga",
      present,
      description: present
        ? L(
            `The lord of house ${hits.map((f) => f.house).join(", ")} sits in another dushthana house (6th/8th/12th) — a classical Vipareeta Raja Yoga, often read as strength that emerges from overcoming difficulty rather than easy circumstance.`,
            `भाव ${hits.map((f) => f.house).join(", ")} का स्वामी दूसरे दुःस्थान भाव (6, 8, 12) में है — शास्त्रीय विपरीत राजयोग, जिसे आसान परिस्थितियों के बजाय कठिनाइयों पर विजय से उपजी शक्ति माना जाता है।`
          )
        : L("No dushthana (6th/8th/12th) lord is placed in another dushthana house, so Vipareeta Raja Yoga is not indicated.", "कोई दुःस्थान (6, 8, 12) स्वामी दूसरे दुःस्थान भाव में नहीं है, इसलिए विपरीत राजयोग नहीं बनता।"),
    });
  }

  // --- Parivartana Yoga: any two planets mutually exchange signs (each sits in a sign the other rules).
  {
    const classical = planets.filter((p) => p.planet !== "Rahu" && p.planet !== "Ketu");
    const pairs: string[] = [];
    for (let i = 0; i < classical.length; i++) {
      for (let j = i + 1; j < classical.length; j++) {
        const a = classical[i];
        const b = classical[j];
        if (SIGN_LORDS[a.signIndex] === b.planet && SIGN_LORDS[b.signIndex] === a.planet) {
          pairs.push(`${n(a.planet)} ↔ ${n(b.planet)}`);
        }
      }
    }
    const present = pairs.length > 0;
    yogas.push({
      name: "Parivartana Yoga",
      present,
      description: present
        ? L(`${pairs.join(", ")} mutually exchange signs — each sits in a sign the other rules, a classical combination that strongly links the two houses/significations involved.`, `${pairs.join(", ")} में राशि परिवर्तन है — दोनों एक-दूसरे की राशि में बैठे हैं, जो शास्त्रीय रूप से संबंधित दोनों भावों और कारकत्वों को मज़बूती से जोड़ता है।`)
        : L("No two planets mutually exchange signs in this chart.", "इस कुंडली में किन्हीं दो ग्रहों में राशि परिवर्तन नहीं है।"),
    });
  }

  // --- Adhi Yoga: only benefics (Mercury/Jupiter/Venus), no malefics, occupy the 6th/7th/8th houses from the Moon.
  if (moon) {
    const targetHouses = new Set([6, 7, 8]);
    const occupants = planets.filter((p) => p.planet !== "Moon" && targetHouses.has(houseFrom(moon, p)));
    const present = occupants.length > 0 && occupants.every((p) => BENEFICS.has(p.planet));
    yogas.push({
      name: "Adhi Yoga",
      present,
      description: present
        ? L("Only benefic planets (Mercury, Jupiter, and/or Venus) occupy the 6th, 7th, or 8th house from the Moon, with no malefic among them — a classical combination for sustained authority and the ability to overcome opposition.", "चंद्र से छठे, सातवें या आठवें भाव में केवल शुभ ग्रह (बुध, गुरु और/या शुक्र) हैं, कोई पाप ग्रह नहीं — स्थायी अधिकार और विरोध पर विजय का शास्त्रीय योग।")
        : L("The 6th/7th/8th houses from the Moon are either empty of benefics or also hold a malefic, so Adhi Yoga is not indicated.", "चंद्र से छठे/सातवें/आठवें भाव में या तो शुभ ग्रह नहीं हैं या कोई पाप ग्रह भी है, इसलिए अधि योग नहीं बनता।"),
    });
  }

  // --- Shakat Yoga: the Moon sits in the 6th, 8th, or 12th house from Jupiter.
  if (moon && jupiter) {
    const rel = houseFrom(jupiter, moon);
    const present = rel === 6 || rel === 8 || rel === 12;
    yogas.push({
      name: "Shakat Yoga",
      present,
      description: present
        ? L("The Moon is in the 6th, 8th, or 12th house from Jupiter — classically read as a caution for fluctuating fortune that Jupiter's other strengths need to offset.", "चंद्र गुरु से छठे, आठवें या बारहवें भाव में हैं — शास्त्रों में इसे उतार-चढ़ाव वाले भाग्य की चेतावनी माना जाता है, जिसे गुरु की अन्य शक्तियाँ संतुलित करती हैं।")
        : L("The Moon is not in the 6th, 8th, or 12th house from Jupiter, so Shakat Yoga is not indicated.", "चंद्र गुरु से छठे, आठवें या बारहवें भाव में नहीं हैं, इसलिए शकट योग नहीं बनता।"),
    });
  }

  // --- Guru Chandal Yoga: Jupiter conjunct Rahu.
  {
    const rahu = byName.get("Rahu");
    const present = !!(jupiter && rahu && jupiter.signIndex === rahu.signIndex);
    yogas.push({
      name: "Guru Chandal Yoga",
      present,
      description: present
        ? L("Jupiter is conjunct Rahu — a combination classically read as Jupiter's wisdom being filtered through Rahu's unconventional, amplifying influence, for better or worse depending on the rest of the chart.", "गुरु की राहु से युति है — शास्त्रों में इसे गुरु के ज्ञान पर राहु के अपरंपरागत, बढ़ाने वाले प्रभाव के रूप में पढ़ा जाता है; परिणाम शेष कुंडली पर निर्भर करता है।")
        : L("Jupiter is not conjunct Rahu in this chart.", "इस कुंडली में गुरु की राहु से युति नहीं है।"),
    });
  }

  // --- Budh-Aditya Yoga: Sun conjunct Mercury.
  {
    const sun = byName.get("Sun");
    const mercury = byName.get("Mercury");
    const present = !!(sun && mercury && sun.signIndex === mercury.signIndex);
    yogas.push({
      name: "Budh-Aditya Yoga",
      present,
      description: present
        ? L("Sun and Mercury are conjunct — a classical combination for sharp intellect and articulate communication.", "सूर्य और बुध की युति है — तीक्ष्ण बुद्धि और प्रभावशाली वाणी का शास्त्रीय योग।")
        : L("Sun and Mercury are not conjunct in this chart.", "इस कुंडली में सूर्य और बुध की युति नहीं है।"),
    });
  }

  // --- Amala Yoga: only a benefic, no malefic, in the 10th house from the Moon or from the Lagna.
  {
    const tenthFromMoonOccupants = moon ? planets.filter((p) => p.planet !== "Moon" && houseFrom(moon, p) === 10) : [];
    const tenthFromLagnaOccupants = planets.filter((p) => houseFromSignIndex(ascendantSignIndex, p) === 10);
    const clean = (occupants: PlanetPlacement[]) => occupants.length > 0 && occupants.every((p) => BENEFICS.has(p.planet));
    const present = clean(tenthFromMoonOccupants) || clean(tenthFromLagnaOccupants);
    yogas.push({
      name: "Amala Yoga",
      present,
      description: present
        ? L("Only a benefic (Mercury, Jupiter, and/or Venus) occupies the 10th house from the Moon or the Lagna, with no malefic there — classically associated with a lasting good reputation.", "चंद्र या लग्न से दसवें भाव में केवल शुभ ग्रह (बुध, गुरु और/या शुक्र) हैं, कोई पाप ग्रह नहीं — शास्त्रों में यह स्थायी सुयश से जुड़ा है।")
        : L("The 10th house from the Moon and from the Lagna is either empty of benefics or also holds a malefic, so Amala Yoga is not indicated.", "चंद्र और लग्न से दसवाँ भाव या तो शुभ ग्रहों से ख़ाली है या उसमें कोई पाप ग्रह भी है, इसलिए अमला योग नहीं बनता।"),
    });
  }

  return found;
}
