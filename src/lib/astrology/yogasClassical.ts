import type { Yoga } from "./types";
import { getDignity } from "./dignity";
import { aspectsSign } from "./aspects";
import { SIGN_LORDS, type PlanetName } from "./constants";
import type { Locale } from "../i18n/locale";
import { pick } from "../i18n/ui";
import { term } from "../i18n/terms";

/** The least a yoga rule needs from a planet — satisfied by the birth chart and by every divisional chart. */
export interface YogaPlanet {
  planet: PlanetName;
  signIndex: number;
  house: number;
}

/**
 * Classical combinations beyond the core set in `yogas.ts` — Parashari raja and dhana yogas, the Chandra, Nabhasa and
 * Sankhya families, and the planetary-conjunction yogas and doshas. Each is reported only when formed, so the yoga list
 * stays readable; the rule for every one is written out in `reference/yogas.ts`.
 */
export const CLASSICAL_YOGA_NAME_HI: Record<string, string> = {
  "Kendra-Trikona Raja Yoga": "केंद्र-त्रिकोण राजयोग",
  "Yogakaraka Planet": "योगकारक ग्रह",
  "Dharma-Karmadhipati Yoga": "धर्म-कर्माधिपति योग",
  "Dhana Yoga": "धन योग",
  "Lakshmi Yoga": "लक्ष्मी योग",
  "Harsha Yoga": "हर्ष योग",
  "Sarala Yoga": "सरल योग",
  "Vimala Yoga": "विमल योग",
  "Kahala Yoga": "काहल योग",
  "Chamara Yoga": "चामर योग",
  "Shankha Yoga": "शंख योग",
  "Bheri Yoga": "भेरी योग",
  "Saraswati Yoga": "सरस्वती योग",
  "Vasumati Yoga": "वसुमती योग",
  "Parvata Yoga": "पर्वत योग",
  "Shubha Kartari Yoga": "शुभ कर्तरी योग",
  "Papa Kartari Yoga": "पाप कर्तरी योग",
  "Sunapha Yoga": "सुनफा योग",
  "Anapha Yoga": "अनफा योग",
  "Durudhara Yoga": "दुरुधरा योग",
  "Vish Yoga": "विष योग (पुनर्फू)",
  "Grahan Yoga": "ग्रहण योग",
  "Angarak Yoga": "अंगारक योग",
  "Shrapit Dosha": "श्रापित दोष",
  "Guru-Mangala Yoga": "गुरु-मंगल योग",
  "Daridra Yoga": "दरिद्र योग",
  "Pravrajya Yoga": "प्रव्रज्या योग",
  "Veena Yoga": "वीणा योग",
  "Dama Yoga": "दाम योग",
  "Pasha Yoga": "पाश योग",
  "Kedara Yoga": "केदार योग",
  "Shoola Yoga": "शूल योग",
  "Yuga Yoga": "युग योग",
  "Gola Yoga": "गोल योग",
  "Rajju Yoga": "रज्जु योग",
  "Musala Yoga": "मुसल योग",
  "Nala Yoga": "नल योग",
  "Mala Yoga": "माला योग",
  "Sarpa Yoga": "सर्प योग",
  "Gada Yoga": "गदा योग",
  "Kamala Yoga": "कमल योग",
  "Vajra Yoga": "वज्र योग",
  "Yava Yoga": "यव योग",
  "Vapi Yoga": "वापी योग",
  "Yupa Yoga": "यूप योग",
  "Shara Yoga": "शर योग",
  "Shakti Yoga": "शक्ति योग",
  "Danda Yoga": "दंड योग",
  "Nauka Yoga": "नौका योग",
  "Koota Yoga": "कूट योग",
  "Chhatra Yoga": "छत्र योग",
  "Chapa Yoga": "चाप योग",
};

const KENDRA = new Set([1, 4, 7, 10]);
const DUSTHANA = new Set([6, 8, 12]);
const UPACHAYA = new Set([3, 6, 10, 11]);
const BENEFICS: PlanetName[] = ["Mercury", "Jupiter", "Venus"];
const MALEFICS: PlanetName[] = ["Sun", "Mars", "Saturn"];
const SEVEN: PlanetName[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
const MOVABLE = new Set([0, 3, 6, 9]);
const FIXED = new Set([1, 4, 7, 10]);
const HOUSES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export function detectClassicalYogas(planets: YogaPlanet[], ascSignIndex: number, locale: Locale = "en"): Yoga[] {
  const L = pick(locale);
  const n = (x: string) => term(locale, x);
  const hi = locale === "hi";
  const byName = new Map(planets.map((p) => [p.planet, p]));
  const found: Yoga[] = [];
  const add = (key: string, en: string, hiText: string) =>
    found.push({ key, name: hi ? (CLASSICAL_YOGA_NAME_HI[key] ?? key) : key, present: true, description: L(en, hiText) });

  const lordOf = (house: number) => SIGN_LORDS[(ascSignIndex + house - 1) % 12] as PlanetName;
  const at = (name: PlanetName) => byName.get(name);
  const dist = (from: YogaPlanet, to: YogaPlanet) => ((to.signIndex - from.signIndex + 12) % 12) + 1;
  const dignityOf = (p: YogaPlanet) => getDignity(p.planet, p.signIndex);
  const strong = (p: YogaPlanet) => ["Exalted", "Own Sign", "Moolatrikona", "Friend's Sign"].includes(dignityOf(p) ?? "");
  const veryStrong = (p: YogaPlanet) => ["Exalted", "Own Sign", "Moolatrikona"].includes(dignityOf(p) ?? "");
  const houseOf = (name: PlanetName) => at(name)?.house ?? 0;
  const list = (names: string[]) => names.map(n).join(", ");
  const ord = (h: number) => `${h}${h === 1 ? "st" : h === 2 ? "nd" : h === 3 ? "rd" : "th"}`;

  /** How two planets are tied together: sharing a sign, exchanging signs, or aspecting each other. */
  const link = (a: PlanetName, b: PlanetName): { en: string; hi: string } | null => {
    const pa = at(a);
    const pb = at(b);
    if (!pa || !pb || a === b) return null;
    if (pa.signIndex === pb.signIndex) return { en: "conjunct", hi: "युति में" };
    if (SIGN_LORDS[pa.signIndex] === b && SIGN_LORDS[pb.signIndex] === a) return { en: "in sign exchange", hi: "राशि परिवर्तन में" };
    if (aspectsSign(a, dist(pa, pb)) && aspectsSign(b, dist(pb, pa))) return { en: "in mutual aspect", hi: "परस्पर दृष्टि में" };
    return null;
  };

  interface Pair { a: PlanetName; b: PlanetName; ha: number; hb: number; how: { en: string; hi: string } }
  /** Distinct planet pairs ruling one house from `xs` and one from `ys` that are linked. */
  const linkedLords = (xs: number[], ys: number[]): Pair[] => {
    const out = new Map<string, Pair>();
    for (const x of xs) {
      for (const y of ys) {
        const a = lordOf(x);
        const b = lordOf(y);
        const how = link(a, b);
        if (!how) continue;
        const id = [a, b].sort().join("|");
        if (!out.has(id)) out.set(id, { a, b, ha: x, hb: y, how });
      }
    }
    return [...out.values()];
  };
  const describePairs = (pairs: Pair[]) => ({
    en: pairs.map((p) => `${p.a} (${ord(p.ha)} lord) and ${p.b} (${ord(p.hb)} lord) are ${p.how.en}`).join("; "),
    hi: pairs.map((p) => `${n(p.a)} (${p.ha}वें भाव का स्वामी) और ${n(p.b)} (${p.hb}वें भाव का स्वामी) ${p.how.hi} हैं`).join("; "),
  });
  const dusthanaNote = (names: PlanetName[]) => {
    const weak = names.filter((p) => DUSTHANA.has(houseOf(p)));
    return weak.length
      ? {
          en: ` ${weak.join(", ")} sit${weak.length === 1 ? "s" : ""} in a dusthana (6th/8th/12th) house, so the results come muted or after effort.`,
          hi: ` ${list(weak)} दुःस्थान भाव (6/8/12) में हैं, इसलिए फल मंद या प्रयास के बाद मिलते हैं।`,
        }
      : { en: "", hi: "" };
  };

  // ---- Raja yogas ----
  const lagnaLord = lordOf(1);
  {
    const pairs = linkedLords([1, 4, 7, 10], [1, 5, 9]);
    if (pairs.length) {
      const d = describePairs(pairs);
      const note = dusthanaNote([...new Set(pairs.flatMap((p) => [p.a, p.b]))]);
      add(
        "Kendra-Trikona Raja Yoga",
        `${d.en} — a lord of a kendra tied to a lord of a trikona, the foundation raja yoga of Parashara, linked with status, authority and rise.${note.en}`,
        `${d.hi} — केंद्र के स्वामी का त्रिकोण के स्वामी से संबंध, पराशर का मूल राजयोग, जो प्रतिष्ठा, अधिकार और उन्नति से जुड़ा है।${note.hi}`
      );
    }
  }
  for (const pl of SEVEN) {
    const ruled = HOUSES.filter((h) => lordOf(h) === pl);
    const p = at(pl);
    if (!p || !ruled.some((h) => [4, 7, 10].includes(h)) || !ruled.some((h) => [5, 9].includes(h))) continue;
    const bad = DUSTHANA.has(p.house) || dignityOf(p) === "Debilitated";
    add(
      "Yogakaraka Planet",
      `${pl} rules both a kendra and a trikona for this Lagna, making it the yogakaraka — the single most beneficial planet of the chart. It sits in the ${ord(p.house)} house${bad ? ", which dims its promise" : ", supporting its promise"}.`,
      `${n(pl)} इस लग्न के लिए केंद्र और त्रिकोण दोनों का स्वामी है, इसलिए योगकारक — कुंडली का सबसे शुभ ग्रह। वह ${p.house}वें भाव में है${bad ? ", जिससे उसका फल मंद पड़ता है" : ", जो उसके फल को सहारा देता है"}।`
    );
  }
  {
    const l9 = lordOf(9);
    const l10 = lordOf(10);
    const how = link(l9, l10);
    if (how) {
      const note = dusthanaNote([l9, l10]);
      add(
        "Dharma-Karmadhipati Yoga",
        `${l9} (9th lord, dharma and fortune) and ${l10} (10th lord, career) are ${how.en} — a raja yoga that joins luck to vocation.${note.en}`,
        `${n(l9)} (नवम भाव का स्वामी, धर्म और भाग्य) और ${n(l10)} (दशम भाव का स्वामी, कर्म) ${how.hi} हैं — भाग्य को कर्म से जोड़ने वाला राजयोग।${note.hi}`
      );
    }
  }
  {
    const l9 = at(lordOf(9));
    const lagna = at(lagnaLord);
    if (l9 && lagna && [1, 4, 5, 7, 9, 10].includes(l9.house) && veryStrong(l9) && strong(lagna)) {
      add(
        "Lakshmi Yoga",
        `The 9th lord ${l9.planet} is in a kendra or trikona in its own or exalted sign and the Lagna lord ${lagnaLord} is strong — the classical Lakshmi Yoga for wealth, grace and a respected life.`,
        `नवम स्वामी ${n(l9.planet)} केंद्र या त्रिकोण में अपनी या उच्च राशि में है और लग्नेश ${n(lagnaLord)} बलवान है — धन, कृपा और सम्मानित जीवन का शास्त्रीय लक्ष्मी योग।`
      );
    }
  }
  for (const [house, key, enMeaning, hiMeaning] of [
    [6, "Harsha Yoga", "victory over rivals, health and contentment", "शत्रुओं पर विजय, स्वास्थ्य और संतोष"],
    [8, "Sarala Yoga", "longevity, courage and fame from overcoming hardship", "आयु, साहस और कठिनाई पार करने से यश"],
    [12, "Vimala Yoga", "thrift, integrity and a spotless reputation", "मितव्ययिता, सत्यनिष्ठा और बेदाग प्रतिष्ठा"],
  ] as [number, string, string, string][]) {
    const lord = lordOf(house);
    const p = at(lord);
    if (p && DUSTHANA.has(p.house)) {
      add(
        key,
        `The ${ord(house)} lord ${lord} sits in the ${ord(p.house)} house, a dusthana — a Vipareeta Raja Yoga (${key.replace(" Yoga", "")}) pointing to ${enMeaning}.`,
        `${house}वें भाव का स्वामी ${n(lord)} ${p.house}वें भाव में है, जो एक दुःस्थान है — विपरीत राजयोग (${CLASSICAL_YOGA_NAME_HI[key].replace(" योग", "")}) जो ${hiMeaning} दर्शाता है।`
      );
    }
  }
  {
    const a = at(lordOf(4));
    const b = at(lordOf(9));
    const lagna = at(lagnaLord);
    if (a && b && a.planet !== b.planet && KENDRA.has(dist(a, b)) && lagna && (strong(lagna) || KENDRA.has(lagna.house))) {
      add(
        "Kahala Yoga",
        `The 4th lord ${a.planet} and 9th lord ${b.planet} stand in kendras from each other and the Lagna lord is strong — Kahala Yoga, linked with boldness, command and landed prosperity.`,
        `चतुर्थेश ${n(a.planet)} और नवमेश ${n(b.planet)} एक-दूसरे से केंद्र में हैं और लग्नेश बलवान है — काहल योग, जो निडरता, नेतृत्व और भू-संपत्ति से जुड़ा है।`
      );
    }
  }
  {
    const lagna = at(lagnaLord);
    const jupiter = at("Jupiter");
    if (lagna && dignityOf(lagna) === "Exalted" && KENDRA.has(lagna.house) && jupiter && (jupiter.signIndex === lagna.signIndex || aspectsSign("Jupiter", dist(jupiter, lagna)))) {
      add(
        "Chamara Yoga",
        `The Lagna lord ${lagnaLord} is exalted in a kendra and Jupiter joins or aspects it — Chamara Yoga, a royal combination for learning, honour and wide recognition.`,
        `लग्नेश ${n(lagnaLord)} केंद्र में उच्च का है और गुरु उसे देखता है या उसके साथ है — चामर योग, विद्या, सम्मान और व्यापक प्रसिद्धि का राजसी योग।`
      );
    }
  }
  {
    const a = at(lordOf(5));
    const b = at(lordOf(6));
    const lagna = at(lagnaLord);
    if (a && b && a.planet !== b.planet && KENDRA.has(dist(a, b)) && lagna && strong(lagna)) {
      add(
        "Shankha Yoga",
        `The 5th lord ${a.planet} and 6th lord ${b.planet} are in kendras from each other and the Lagna lord is strong — Shankha Yoga for longevity, fortune and a principled life.`,
        `पंचमेश ${n(a.planet)} और षष्ठेश ${n(b.planet)} एक-दूसरे से केंद्र में हैं और लग्नेश बलवान है — शंख योग, दीर्घायु, भाग्य और सिद्धांतवान जीवन का योग।`
      );
    }
  }
  {
    const lagna = at(lagnaLord);
    const venus = at("Venus");
    const jupiter = at("Jupiter");
    const l9 = at(lordOf(9));
    if (lagna && venus && jupiter && l9 && [lagna, venus, jupiter].every((p) => KENDRA.has(p.house)) && strong(l9)) {
      add(
        "Bheri Yoga",
        "Venus, Jupiter and the Lagna lord all stand in kendras and the 9th lord is strong — Bheri Yoga, associated with wealth, family happiness and long life.",
        "शुक्र, गुरु और लग्नेश तीनों केंद्र में हैं और नवमेश बलवान है — भेरी योग, धन, पारिवारिक सुख और दीर्घायु से जुड़ा।"
      );
    }
  }

  // ---- Dhana and learning yogas ----
  {
    const pairs = linkedLords([2, 11], [1, 2, 5, 9, 11]);
    if (pairs.length) {
      const d = describePairs(pairs);
      const note = dusthanaNote([...new Set(pairs.flatMap((p) => [p.a, p.b]))]);
      add(
        "Dhana Yoga",
        `${d.en} — the wealth houses (2nd/11th) tied to the Lagna or the fortune houses (5th/9th), a classical sign of earning and accumulating.${note.en}`,
        `${d.hi} — धन भावों (2/11) का लग्न या भाग्य भावों (5/9) से संबंध, कमाने और संचय करने का शास्त्रीय संकेत।${note.hi}`
      );
    }
  }
  {
    const [ju, ve, me] = [at("Jupiter"), at("Venus"), at("Mercury")];
    if (ju && ve && me && [ju, ve, me].every((p) => [1, 2, 4, 5, 7, 9, 10].includes(p.house)) && strong(ju)) {
      add(
        "Saraswati Yoga",
        "Jupiter, Venus and Mercury occupy kendra, trikona or the 2nd house, with Jupiter well placed — Saraswati Yoga for learning, eloquence and artistic skill.",
        "गुरु, शुक्र और बुध केंद्र, त्रिकोण या द्वितीय भाव में हैं और गुरु बलवान है — सरस्वती योग, विद्या, वाक्पटुता और कला-कौशल का योग।"
      );
    }
  }
  {
    const moon = at("Moon");
    const fromLagna = BENEFICS.every((b) => UPACHAYA.has(houseOf(b)));
    const fromMoon = !!moon && BENEFICS.every((b) => at(b) && UPACHAYA.has(dist(moon, at(b)!)));
    if (fromLagna || fromMoon) {
      add(
        "Vasumati Yoga",
        `Mercury, Jupiter and Venus all stand in upachaya houses (3rd/6th/10th/11th) from the ${fromLagna ? "Lagna" : "Moon"} — Vasumati Yoga, wealth that grows steadily with time.`,
        `बुध, गुरु और शुक्र ${fromLagna ? "लग्न" : "चंद्र"} से उपचय भावों (3/6/10/11) में हैं — वसुमती योग, समय के साथ बढ़ने वाला धन।`
      );
    }
  }
  {
    const lagna = at(lagnaLord);
    const benefic = BENEFICS.some((b) => KENDRA.has(houseOf(b)));
    const clean = !planets.some((p) => p.planet !== "Moon" && !BENEFICS.includes(p.planet) && (p.house === 6 || p.house === 8));
    if (lagna && KENDRA.has(lagna.house) && benefic && clean) {
      add(
        "Parvata Yoga",
        "The Lagna lord is in a kendra with a benefic in a kendra, and the 6th and 8th houses hold no malefic — Parvata Yoga, a mountain-like standing in learning and public life.",
        "लग्नेश केंद्र में है, कोई शुभ ग्रह भी केंद्र में है और छठे व आठवें भाव में कोई पाप ग्रह नहीं — पर्वत योग, विद्या और सार्वजनिक जीवन में पर्वत-सी प्रतिष्ठा।"
      );
    }
  }
  {
    const flank = (h: number) => planets.filter((p) => p.house === h && p.planet !== "Moon");
    const kind = (xs: YogaPlanet[]) =>
      xs.length === 0 ? null : xs.every((p) => BENEFICS.includes(p.planet)) ? "benefic" : xs.every((p) => !BENEFICS.includes(p.planet)) ? "malefic" : "mixed";
    const [ks, kt] = [kind(flank(2)), kind(flank(12))];
    if (ks === "benefic" && kt === "benefic") {
      add("Shubha Kartari Yoga", "Only benefics occupy the 2nd and 12th houses, hemming the Lagna between them — Shubha Kartari Yoga, protection and support around the self.", "दूसरे और बारहवें भाव में केवल शुभ ग्रह हैं, लग्न उनके बीच है — शुभ कर्तरी योग, स्वयं के चारों ओर रक्षा और सहारा।");
    } else if (ks === "malefic" && kt === "malefic") {
      add("Papa Kartari Yoga", "Only malefics occupy the 2nd and 12th houses, hemming the Lagna between them — Papa Kartari Yoga, pressure around the self that asks for patience.", "दूसरे और बारहवें भाव में केवल पाप ग्रह हैं, लग्न उनके बीच है — पाप कर्तरी योग, स्वयं पर दबाव जो धैर्य माँगता है।");
    }
  }

  // ---- Chandra yogas ----
  {
    const moon = at("Moon");
    if (moon) {
      const others = planets.filter((p) => !["Moon", "Sun", "Rahu", "Ketu"].includes(p.planet));
      const second = others.filter((p) => dist(moon, p) === 2).map((p) => p.planet);
      const twelfth = others.filter((p) => dist(moon, p) === 12).map((p) => p.planet);
      if (second.length && twelfth.length) {
        add("Durudhara Yoga", `Planets stand in both the 2nd (${second.join(", ")}) and 12th (${twelfth.join(", ")}) from the Moon — Durudhara Yoga, comfort, generosity and a well-supported life.`, `चंद्र से दूसरे (${list(second)}) और बारहवें (${list(twelfth)}) दोनों में ग्रह हैं — दुरुधरा योग, सुख, उदारता और सहारे वाला जीवन।`);
      } else if (second.length) {
        add("Sunapha Yoga", `${second.join(", ")} stand${second.length === 1 ? "s" : ""} in the 2nd from the Moon — Sunapha Yoga, self-earned wealth and intelligence.`, `चंद्र से दूसरे भाव में ${list(second)} है — सुनफा योग, स्वयं अर्जित धन और बुद्धि।`);
      } else if (twelfth.length) {
        add("Anapha Yoga", `${twelfth.join(", ")} stand${twelfth.length === 1 ? "s" : ""} in the 12th from the Moon — Anapha Yoga, good health, charm and a comfortable disposition.`, `चंद्र से बारहवें भाव में ${list(twelfth)} है — अनफा योग, अच्छा स्वास्थ्य, आकर्षण और सुखद स्वभाव।`);
      }
    }
  }
  {
    const how = link("Moon", "Saturn");
    if (how && how.en !== "in sign exchange") {
      add("Vish Yoga", `The Moon and Saturn are ${how.en} — Vish (Punarphoo) Yoga, a heavy, slow-to-clear mind and delayed emotional comfort that matures with age.`, `चंद्र और शनि ${how.hi} हैं — विष (पुनर्फू) योग, भारी और देर से खुलने वाला मन तथा भावनात्मक सुख में देरी, जो उम्र के साथ परिपक्व होता है।`);
    }
  }

  // ---- Conjunctions and doshas ----
  {
    const rahu = at("Rahu");
    const ketu = at("Ketu");
    const hits: string[][] = [];
    for (const light of ["Sun", "Moon"] as PlanetName[]) {
      const l = at(light);
      if (!l) continue;
      if (rahu && rahu.signIndex === l.signIndex) hits.push([light, "Rahu"]);
      if (ketu && ketu.signIndex === l.signIndex) hits.push([light, "Ketu"]);
    }
    if (hits.length) {
      add("Grahan Yoga", `${hits.map((h) => h.join("–")).join(", ")} share a sign — Grahan Yoga, an eclipsed light that asks for work on confidence (Sun) or peace of mind (Moon).`, `${hits.map((h) => h.map(n).join("–")).join(", ")} एक ही राशि में हैं — ग्रहण योग, ढकी हुई ज्योति जो आत्मविश्वास (सूर्य) या मन की शांति (चंद्र) पर काम माँगती है।`);
    }
  }
  const sameSign = (a: PlanetName, b: PlanetName) => !!at(a) && !!at(b) && at(a)!.signIndex === at(b)!.signIndex;
  if (sameSign("Mars", "Rahu")) add("Angarak Yoga", "Mars and Rahu share a sign — Angarak Yoga, restless, impulsive energy that needs a disciplined outlet.", "मंगल और राहु एक ही राशि में हैं — अंगारक योग, बेचैन और आवेगी ऊर्जा जिसे अनुशासित दिशा चाहिए।");
  if (sameSign("Saturn", "Rahu")) add("Shrapit Dosha", "Saturn and Rahu share a sign — Shrapit Dosha, a karmic delay that is traditionally eased by steady service and Shani remedies.", "शनि और राहु एक ही राशि में हैं — श्रापित दोष, कर्म-जनित विलंब जो निरंतर सेवा और शनि उपायों से हल्का माना जाता है।");
  if (sameSign("Jupiter", "Mars")) add("Guru-Mangala Yoga", "Jupiter and Mars share a sign — Guru-Mangala Yoga, wisdom joined to drive, good for enterprise, law and teaching.", "गुरु और मंगल एक ही राशि में हैं — गुरु-मंगल योग, ज्ञान और साहस का मेल, उद्यम, विधि और शिक्षण के लिए शुभ।");
  {
    const [l2, l11] = [at(lordOf(2)), at(lordOf(11))];
    if (l2 && l11 && DUSTHANA.has(l2.house) && DUSTHANA.has(l11.house)) {
      add("Daridra Yoga", `Both the 2nd lord ${l2.planet} and the 11th lord ${l11.planet} sit in dusthana houses — Daridra Yoga, uneven savings and gains that need careful management.`, `द्वितीयेश ${n(l2.planet)} और एकादशेश ${n(l11.planet)} दोनों दुःस्थान में हैं — दरिद्र योग, अस्थिर बचत और लाभ जिन्हें सावधानी से सँभालना चाहिए।`);
    }
  }
  {
    const bySign = new Map<number, YogaPlanet[]>();
    for (const pl of SEVEN) {
      const p = at(pl);
      if (p) bySign.set(p.signIndex, [...(bySign.get(p.signIndex) ?? []), p]);
    }
    const big = [...bySign.values()].find((g) => g.length >= 4);
    if (big) {
      const names = big.map((p) => p.planet);
      add("Pravrajya Yoga", `${names.join(", ")} crowd the ${ord(big[0].house)} house — Pravrajya Yoga, a pull towards renunciation, study or a life apart from the crowd; weigh it with the whole chart.`, `${list(names)} ${big[0].house}वें भाव में एकत्र हैं — प्रव्रज्या योग, त्याग, अध्ययन या भीड़ से अलग जीवन की ओर झुकाव; पूरी कुंडली के साथ तौलें।`);
    }
  }

  // ---- Sankhya and Nabhasa yogas (all seven grahas, Sun to Saturn) ----
  const seven = SEVEN.map(at).filter((p): p is YogaPlanet => !!p);
  if (seven.length === 7) {
    const signCount = new Set(seven.map((p) => p.signIndex)).size;
    const sankhya: Record<number, [string, string, string, string, string]> = {
      7: ["Veena Yoga", "All seven planets stand in seven different signs", "सातों ग्रह सात अलग राशियों में हैं", "a life of music, refinement and comforts", "संगीत, परिष्कार और सुख-सुविधा वाला जीवन"],
      6: ["Dama Yoga", "The seven planets are spread over six signs", "सातों ग्रह छह राशियों में हैं", "a generous, well-regarded and charitable nature", "उदार, सम्मानित और दानशील स्वभाव"],
      5: ["Pasha Yoga", "The seven planets are spread over five signs", "सातों ग्रह पाँच राशियों में हैं", "a bound, industrious and sometimes quarrelsome life", "बँधा, परिश्रमी और कभी-कभी झगड़ालू जीवन"],
      4: ["Kedara Yoga", "The seven planets are spread over four signs", "सातों ग्रह चार राशियों में हैं", "a life tied to land, agriculture and steady work", "भूमि, कृषि और स्थिर कार्य से जुड़ा जीवन"],
      3: ["Shoola Yoga", "The seven planets are spread over three signs", "सातों ग्रह तीन राशियों में हैं", "a forceful, hard-working and sometimes troubled temperament", "तेजस्वी, परिश्रमी और कभी-कभी संघर्षपूर्ण स्वभाव"],
      2: ["Yuga Yoga", "The seven planets are spread over two signs", "सातों ग्रह दो राशियों में हैं", "a life of wealth that is made and also spent", "धन कमाने और खर्च करने वाला जीवन"],
      1: ["Gola Yoga", "All seven planets stand in a single sign", "सातों ग्रह एक ही राशि में हैं", "intense, concentrated results — strength and strain together", "तीव्र, केंद्रित फल — बल और तनाव साथ"],
    };
    const [skey, sen, shi, sMeanEn, sMeanHi] = sankhya[signCount];
    add(skey, `${sen} — ${skey} (a Sankhya yoga), ${sMeanEn}.`, `${shi} — ${CLASSICAL_YOGA_NAME_HI[skey]} (सांख्य योग), ${sMeanHi}।`);

    const houses = seven.map((p) => p.house);
    const houseSet = new Set(houses);
    const all = (set: Set<number>) => houses.every((h) => set.has(h));
    const run = (start: number, len: number) => new Set(Array.from({ length: len }, (_, i) => ((start - 1 + i) % 12) + 1));
    const signs = seven.map((p) => p.signIndex);
    if (signs.every((s) => MOVABLE.has(s))) add("Rajju Yoga", "All seven planets are in movable signs — Rajju Yoga (an Ashraya yoga), a restless, travelling, ambitious nature.", "सातों ग्रह चर राशियों में हैं — रज्जु योग (आश्रय योग), बेचैन, यात्रा-प्रिय और महत्वाकांक्षी स्वभाव।");
    else if (signs.every((s) => FIXED.has(s))) add("Musala Yoga", "All seven planets are in fixed signs — Musala Yoga (an Ashraya yoga), a steady, proud and resolute nature.", "सातों ग्रह स्थिर राशियों में हैं — मुसल योग (आश्रय योग), स्थिर, स्वाभिमानी और दृढ़ स्वभाव।");
    else if (signs.every((s) => !MOVABLE.has(s) && !FIXED.has(s))) add("Nala Yoga", "All seven planets are in dual signs — Nala Yoga (an Ashraya yoga), an adaptable, many-sided nature.", "सातों ग्रह द्विस्वभाव राशियों में हैं — नल योग (आश्रय योग), अनुकूलनशील और बहुमुखी स्वभाव।");

    const kendraCount = (names: PlanetName[]) => new Set(names.map(houseOf).filter((h) => KENDRA.has(h))).size;
    if (kendraCount(BENEFICS) === 3) add("Mala Yoga", "Mercury, Jupiter and Venus occupy three different kendras — Mala Yoga (a Dala yoga), comfort, good food and a pleasing life.", "बुध, गुरु और शुक्र तीन अलग केंद्रों में हैं — माला योग (दल योग), सुख, अच्छा भोजन और सुखद जीवन।");
    if (kendraCount(MALEFICS) === 3) add("Sarpa Yoga", "The Sun, Mars and Saturn occupy three different kendras — Sarpa Yoga (a Dala yoga), a sharp, guarded and sometimes harsh path.", "सूर्य, मंगल और शनि तीन अलग केंद्रों में हैं — सर्प योग (दल योग), तीखा, सतर्क और कभी-कभी कठोर मार्ग।");

    const inHouses = (names: PlanetName[], hs: number[]) => names.every((x) => hs.includes(houseOf(x)));
    if ([1, 4, 7, 10].every((h) => houseSet.has(h))) {
      add("Kamala Yoga", "The seven planets fill all four kendras — Kamala Yoga (an Akriti yoga), a lotus-like life of fame and virtue.", "सातों ग्रह चारों केंद्रों में हैं — कमल योग (आकृति योग), यश और सद्गुण वाला कमल-सा जीवन।");
    } else if (all(KENDRA) && inHouses(BENEFICS, [1, 7]) && inHouses(MALEFICS, [4, 10])) {
      add("Vajra Yoga", "Benefics hold the 1st/7th and malefics the 4th/10th — Vajra Yoga (an Akriti yoga), happiness at both ends of life.", "शुभ ग्रह 1/7 में और पाप ग्रह 4/10 में हैं — वज्र योग (आकृति योग), जीवन के आरंभ और अंत में सुख।");
    } else if (all(KENDRA) && inHouses(BENEFICS, [4, 10]) && inHouses(MALEFICS, [1, 7])) {
      add("Yava Yoga", "Benefics hold the 4th/10th and malefics the 1st/7th — Yava Yoga (an Akriti yoga), a middle life of charity and vows.", "शुभ ग्रह 4/10 में और पाप ग्रह 1/7 में हैं — यव योग (आकृति योग), मध्य आयु में दान और व्रत।");
    } else if ([[1, 4], [4, 7], [7, 10], [10, 1]].some(([a, b]) => all(new Set([a, b])))) {
      add("Gada Yoga", "All the planets sit in two adjacent kendras — Gada Yoga (an Akriti yoga), wealth through effort and ritual.", "सभी ग्रह दो आसन्न केंद्रों में हैं — गदा योग (आकृति योग), प्रयास और अनुष्ठान से धन।");
    } else if (all(new Set([2, 5, 8, 11])) || all(new Set([3, 6, 9, 12]))) {
      add("Vapi Yoga", "All the planets sit in panaphara or all in apoklima houses — Vapi Yoga (an Akriti yoga), accumulated wealth and savings.", "सभी ग्रह पणफर या सभी अपोक्लिम भावों में हैं — वापी योग (आकृति योग), संचित धन और बचत।");
    } else {
      const spans: [number, number, string, string, string][] = [
        [1, 4, "Yupa Yoga", "the 1st–4th houses", "1 से 4 भाव"],
        [4, 4, "Shara Yoga", "the 4th–7th houses", "4 से 7 भाव"],
        [7, 4, "Shakti Yoga", "the 7th–10th houses", "7 से 10 भाव"],
        [10, 4, "Danda Yoga", "the 10th–1st houses", "10 से 1 भाव"],
        [1, 7, "Nauka Yoga", "the 1st–7th houses", "1 से 7 भाव"],
        [4, 7, "Koota Yoga", "the 4th–10th houses", "4 से 10 भाव"],
        [7, 7, "Chhatra Yoga", "the 7th–1st houses", "7 से 1 भाव"],
        [10, 7, "Chapa Yoga", "the 10th–4th houses", "10 से 4 भाव"],
      ];
      const meaning: Record<string, [string, string]> = {
        "Yupa Yoga": ["a disciplined, devout, sacrificing nature", "अनुशासित, धार्मिक और त्यागी स्वभाव"],
        "Shara Yoga": ["a hunter's focus — skill in craft and pursuit", "शिकारी-सा एकाग्र — शिल्प और लक्ष्य में कुशलता"],
        "Shakti Yoga": ["strength, wealth and a capable, determined life", "बल, धन और सक्षम, दृढ़ जीवन"],
        "Danda Yoga": ["a life of duty, with a streak of the austere", "कर्तव्य-प्रधान जीवन, कुछ तपस्वी भाव के साथ"],
        "Nauka Yoga": ["a life that crosses water and borders, earning by trade", "जल और सीमाएँ पार करने वाला, व्यापार से कमाने वाला जीवन"],
        "Koota Yoga": ["a guarded, fortress-like nature with strong holdings", "सुरक्षित, किले-सा स्वभाव और मज़बूत संपत्ति"],
        "Chhatra Yoga": ["a sheltering, protective, well-liked nature", "आश्रय देने वाला, रक्षक और लोकप्रिय स्वभाव"],
        "Chapa Yoga": ["a bow-like drive — enterprise and ambition", "धनुष-सी गति — उद्यम और महत्वाकांक्षा"],
      };
      const hit = spans.find(([start, len]) => all(run(start, len)));
      if (hit) {
        const [, , key, enSpan, hiSpan] = hit;
        add(key, `All seven planets lie within ${enSpan} — ${key} (an Akriti yoga), ${meaning[key][0]}.`, `सातों ग्रह ${hiSpan} के बीच हैं — ${CLASSICAL_YOGA_NAME_HI[key]} (आकृति योग), ${meaning[key][1]}।`);
      }
    }
  }

  return found;
}
