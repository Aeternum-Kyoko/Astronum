import type { KundaliChart } from "@/lib/astrology/types";
import { SIGNS, SIGN_LORDS } from "@/lib/astrology/constants";
import { signOffsetHouse } from "@/lib/astrology/math";
import { pick } from "@/lib/i18n/ui";
import { term } from "@/lib/i18n/terms";
import type { Locale } from "@/lib/i18n/locale";
import type { PersonalVastuContext, VastuAssessment, VastuAssessmentInput, VastuFinding, VastuRoom, VastuZone } from "./types";

export const VASTU_ROOM_PREFERENCES: Partial<Record<VastuRoom, VastuZone[]>> = {
  kitchen: ["SE", "SSE", "ESE", "NW", "WNW"],
  mainBedroom: ["SW", "SSW", "WSW", "S", "W"],
  bedroom: ["W", "WNW", "WSW", "NW", "S"],
  prayer: ["NE", "NNE", "ENE", "E", "N"],
  study: ["E", "ENE", "N", "NNE", "NE"],
  work: ["N", "NNE", "ENE", "E", "NE"],
  water: ["NE", "NNE", "N", "ENE", "E"],
};

const roomTitle: Record<VastuRoom, string> = {
  living: "Living area", kitchen: "Kitchen", mainBedroom: "Main bedroom", bedroom: "Bedroom", prayer: "Prayer space",
  bathroom: "Bathroom", toilet: "Toilet", staircase: "Staircase", water: "Water source", study: "Study area",
  work: "Work area", dining: "Dining area", storage: "Storage", balcony: "Balcony", open: "Open space", other: "Other room",
};

function add(findings: VastuFinding[], finding: VastuFinding) { findings.push(finding); }

/** Evaluates the stated layout against a concise, explicitly conventional Vāstu rule set and practical housing checks. */
export function evaluateVastu(input: VastuAssessmentInput): VastuAssessment {
  const findings: VastuFinding[] = [];
  const roomEntries = input.rooms;
  for (const placement of roomEntries) {
    const { zone, room, floor } = placement;
    if (zone === "CENTER" && ["toilet", "staircase", "storage"].includes(room)) {
      add(findings, {
        id: `center-${room}-${floor}`, title: `${roomTitle[room]} in the centre · floor ${floor}`, zone, level: "consider",
        tradition: "Many contemporary Vāstu guides treat the central area as a zone to keep light, open, and unobstructed. Traditions and floor plans vary.",
        practical: "Check whether the arrangement blocks movement, light, or useful floor area.",
        action: "If convenient, reduce heavy storage or obstruction here. Do not move plumbing or walls solely for this note.", sourceType: "modern-vastu-convention",
      });
    }
    const options = VASTU_ROOM_PREFERENCES[room];
    if (options?.includes(zone)) {
      add(findings, {
        id: `convention-match-${room}-${zone}-${floor}`, title: `${roomTitle[room]} in a commonly preferred ${zone} zone · floor ${floor}`,
        zone, level: "note",
        tradition: `This layout matches a common contemporary Vāstu preference for ${roomTitle[room].toLowerCase()}. Preferences vary by text, region, and practitioner.`,
        practical: room === "kitchen" ? "Continue to check exhaust, appliance clearances, gas or electrical safety, and heat control." : "The direction match does not replace checking comfort, privacy, daylight, ventilation, and accessibility.",
        action: "Keep the room workable for its occupants. This is a convention match, not a certification of the home.", sourceType: "modern-vastu-convention",
      });
    } else if (options) {
    const isAvoided = (room === "prayer" && ["S", "SSW", "SW", "WSW", "CENTER"].includes(zone)) ||
        (room === "mainBedroom" && ["N", "NNE", "NE", "CENTER"].includes(zone)) ||
        (room === "kitchen" && ["N", "NNE", "NE", "CENTER"].includes(zone));
      add(findings, {
        id: `${room}-${zone}-${floor}`, title: `${roomTitle[room]} in ${zone} · floor ${floor}`,
        zone, level: isAvoided ? "consider" : "note",
        tradition: `A common contemporary Vāstu convention prefers ${roomTitle[room].toLowerCase()} in ${options.join(" or ")}. This varies by text, region, and practitioner; it is not a universal rule.`,
        practical: room === "kitchen" ? "Ventilation, safe appliance clearance, and separation from combustible materials matter in any direction." : "Assess comfort, daylight, privacy, and daily circulation before considering a change.",
        action: "Treat this as a reflection point. Prefer reversible furniture or use changes; consult a qualified architect before structural work.",
        sourceType: "modern-vastu-convention",
      });
    }
    if (room === "toilet" && zone === "NE") {
      add(findings, {
        id: `toilet-northeast-${floor}`, title: `Toilet in the north-east · floor ${floor}`, zone, level: "consider",
        tradition: "Some modern Vāstu schools prefer to keep the north-east clear of toilets. Interpretations differ.",
        practical: "Check waterproofing, drainage, ventilation, and hygiene regardless of direction.",
        action: "Prioritize maintenance and ventilation. Do not relocate plumbing based only on a directional convention.", sourceType: "modern-vastu-convention",
      });
    }
  }

  if (input.entrance === "unknown") {
    add(findings, {
      id: "entrance-unknown", title: "Entrance direction not provided", zone: null, level: "note",
      tradition: "A traditional entrance reading may consider the door's exact position along its wall, not only the direction the home faces.",
      practical: "The drawing's top edge may not be north. Confirm north with a compass or a correctly oriented plan.",
      action: "Add the entrance direction when you can confirm it. The current report leaves entrance guidance open.", sourceType: "modern-vastu-convention",
    });
  } else if (["N", "NNE", "NE", "ENE", "E"].includes(input.entrance)) {
    add(findings, {
      id: "entrance-conventional", title: `Entrance in ${input.entrance}`, zone: input.entrance, level: "note",
      tradition: "North, north-east, and east are treated favourably by many contemporary Vāstu guides, though detailed doorway rules differ.",
      practical: "Keep the entrance well-lit, clear, weather-protected, and easy to use.",
      action: "For a detailed traditional entrance reading, record the door's position within the wall and consult the rule tradition you follow.", sourceType: "modern-vastu-convention",
    });
  } else {
    add(findings, {
      id: "entrance-context", title: `Entrance in ${input.entrance}`, zone: input.entrance, level: "note",
      tradition: "Entrance direction alone is not enough to label a home auspicious or inauspicious. Doorway position and the Vāstu school used can change the interpretation.",
      practical: "A safe, visible, weather-protected entrance with a clear path is useful in every direction.",
      action: "No structural change is suggested from direction alone.", sourceType: "modern-vastu-convention",
    });
  }

  if (input.daylight === "limited") findings.push({
    id: "daylight", title: "Limited natural daylight", zone: null, level: "consider",
    tradition: "Traditional design approaches often consider orientation and the movement of sunlight through a building.",
    practical: "Daylight, window placement, shading, and climate-appropriate design affect how a home is used.",
    action: "Keep windows unobstructed and consider safe, non-structural ways to improve daylight.", sourceType: "practical-housing-guidance",
  });
  if (input.ventilation === "limited") findings.push({
    id: "ventilation", title: "Limited ventilation", zone: null, level: "priority",
    tradition: "Traditional buildings often used openings and air paths as part of climate-responsive design.",
    practical: "Poor ventilation can allow pollutants and moisture to build up. Natural ventilation also depends on outdoor air quality and security.",
    action: "Address ventilation and dampness with a qualified building professional, considering outdoor air quality and safety.", sourceType: "practical-housing-guidance",
  });
  if (input.dampness === "yes") findings.push({
    id: "dampness", title: "Dampness or mould reported", zone: null, level: "priority",
    tradition: "This calculator does not interpret dampness as a Vāstu dosha.",
    practical: "Persistent moisture needs attention to its source, drainage, leaks, and ventilation.",
    action: "Find and repair the moisture source; seek qualified building or health guidance if mould persists.", sourceType: "practical-housing-guidance",
  });
  if (input.accessAndSafety === "needsAttention") findings.push({
    id: "safety-access", title: "Access or safety needs attention", zone: null, level: "priority",
    tradition: "Traditional interpretations do not replace building safety review.",
    practical: "Clear paths, secure stairs, accessible facilities, and safe electrical and fire arrangements take precedence.",
    action: "Resolve immediate hazards first and follow local building and fire requirements.", sourceType: "practical-housing-guidance",
  });

  const levels = findings.reduce((acc, f) => ({ ...acc, [f.level === "note" ? "notes" : f.level]: acc[f.level === "note" ? "notes" : f.level] + 1 }), { priority: 0, consider: 0, notes: 0 });
  return {
    input, findings, summary: levels,
    northNote: input.planBearing !== 0
      ? `The plan top edge is recorded at ${input.planBearing}° clockwise from north. Enter each room by its true compass zone; verify the plan orientation before using directional observations.`
      : input.northReference === "estimated"
      ? "North was estimated, so directional observations may shift. Recheck with a compass or a north-marked plan."
      : input.northReference === "plan"
        ? "Directions follow the north arrow on your plan. Verify the arrow before relying on zone-specific observations."
        : "Directions follow your compass reading. Magnetic compasses can be affected by nearby metal and electronics.",
  };
}

const balaLabel = (isStrong: boolean | undefined, locale: Locale) => isStrong === undefined
  ? pick(locale)("not available", "उपलब्ध नहीं")
  : isStrong ? pick(locale)("strong by the app's Shadbala measure", "ऐप के षड्बल माप में बलवान")
    : pick(locale)("below the app's Shadbala threshold", "ऐप के षड्बल मानक से कम");

/** Jyotish context for the home's themes. This does not change the building's Vāstu assessment. */
export function personalizeVastu(chart: KundaliChart, transits: PersonalVastuContext["majorTransits"] = [], locale: Locale = "en"): PersonalVastuContext {
  const L = pick(locale);
  const T = (value: string) => term(locale, value);
  const fourthLordEntry = chart.houseLords.find((x) => x.house === 4)!;
  const fourthLord = chart.planets.find((p) => p.planet === fourthLordEntry.lord)!;
  const fourthLordHouse = signOffsetHouse(fourthLord.signIndex, chart.ascendant.signIndex);
  const fourthOccupants = chart.planets.filter((p) => p.house === 4).map((p) => p.planet);
  const moon = chart.planets.find((p) => p.planet === "Moon")!;
  const moonStrength = chart.shadbala.find((x) => x.planet === "Moon")?.isStrong;
  const lordStrength = chart.shadbala.find((x) => x.planet === fourthLordEntry.lord)?.isStrong;
  const d4 = chart.divisionalCharts.D4;
  const d4FourthSignIndex = (d4.ascendant.signIndex + 3) % 12;
  const d4FourthLord = d4.planets.find((p) => p.planet === SIGN_LORDS[d4FourthSignIndex])!;
  const d4FourthLordHouse = signOffsetHouse(d4FourthLord.signIndex, d4.ascendant.signIndex);
  const d1FourthSign = chart.houseLords.find((x) => x.house === 4)!.sign;
  const priorities = [
    { title: L("Home, property, and inner comfort", "घर, संपत्ति और आंतरिक सुख"), detail: L(`Your 4th house is in ${d1FourthSign}. Its lord ${fourthLordEntry.lord} is in ${fourthLord.sign}, house ${fourthLordHouse}, ${balaLabel(lordStrength, locale)}${fourthOccupants.length ? `; the house also contains ${fourthOccupants.join(", ")}` : ""}.`, `आपका चतुर्थ भाव ${T(d1FourthSign)} में है। इसके स्वामी ${T(fourthLordEntry.lord)} ${T(fourthLord.sign)} में, भाव ${fourthLordHouse} में हैं; ${balaLabel(lordStrength, locale)}${fourthOccupants.length ? `; इस भाव में ${fourthOccupants.map(T).join(", ")} भी हैं` : ""}।`), source: L("D1 Rāśi: 4th house, its lord, occupants, and Shadbala", "D1 राशि: चतुर्थ भाव, भावेश, स्थित ग्रह और षड्बल") },
    { title: L("Emotional ease at home", "घर में मानसिक सहजता"), detail: L(`Your Moon is in ${moon.sign}, ${moon.nakshatra}, ${balaLabel(moonStrength, locale)}. This gives a personal reflection lens for rest and the feeling of home.`, `आपका चंद्र ${T(moon.sign)} राशि और ${T(moon.nakshatra)} नक्षत्र में है; ${balaLabel(moonStrength, locale)}। यह विश्राम और घर में सहजता के लिए व्यक्तिगत चिंतन का संदर्भ है।`), source: L("D1 Moon placement and Shadbala", "D1 चंद्र स्थिति और षड्बल") },
    { title: L("Property and residence themes", "संपत्ति और निवास के संकेत"), detail: L(`In D4 Chaturthāṁśa, your ascendant is ${d4.ascendant.sign}; the 4th lord ${d4FourthLord.planet} sits in ${d4FourthLord.sign}, house ${d4FourthLordHouse}. D4 is traditionally consulted for property and dwelling matters.`, `D4 चतुर्थांश में आपका लग्न ${T(d4.ascendant.sign)} है; चतुर्थ भाव के स्वामी ${T(d4FourthLord.planet)} ${T(d4FourthLord.sign)} में, भाव ${d4FourthLordHouse} में हैं। परंपरागत रूप से संपत्ति और निवास के लिए D4 देखा जाता है।`), source: L("D4 Chaturthāṁśa", "D4 चतुर्थांश") },
  ];
  const active = [chart.currentDasha?.lord, chart.currentAntardasha?.lord].filter(Boolean).join(" / ");
  if (active) priorities.push({
    title: L("Current period", "वर्तमान दशा"), detail: L(`${active} is active in your Vimshottari period. This is shown as timing context for reflection; it does not certify a property or predict its outcome.`, `विंशोत्तरी दशा में ${active.split(" / ").map(T).join(" / ")} चल रही है। इसे चिंतन के लिए समय-संदर्भ के रूप में दिखाया गया है; यह संपत्ति को प्रमाणित या उसके परिणाम की भविष्यवाणी नहीं करती।`), source: L("Current Mahādasha / Antardasha", "वर्तमान महादशा / अंतर्दशा"),
  });
  const linkedThemes = [2, 5, 7, 10].map((house) => {
    const lord = chart.houseLords.find((x) => x.house === house)!;
    const p = chart.planets.find((x) => x.planet === lord.lord)!;
    const occupants = chart.planets.filter((x) => x.house === house).map((x) => x.planet);
    return { title: L(`${house}${house === 2 ? "nd" : "th"} house context`, `${house}वें भाव का संदर्भ`), detail: L(`${house === 2 ? "Family and resources" : house === 5 ? "Study and creativity" : house === 7 ? "Shared life and partnership" : "Career and work"}: ${lord.lord} rules this house and is in ${p.sign}${occupants.length ? `; ${occupants.join(", ")} occupy it` : "; it has no planetary occupants"}.`, `${house === 2 ? "परिवार और संसाधन" : house === 5 ? "अध्ययन और रचनात्मकता" : house === 7 ? "साझा जीवन और संबंध" : "करियर और काम"}: ${T(lord.lord)} इस भाव के स्वामी हैं और ${T(p.sign)} में हैं${occupants.length ? `; इस भाव में ${occupants.map(T).join(", ")} हैं` : "; इस भाव में कोई ग्रह नहीं है"}।`), source: L(`D1 ${house}th house, lord, and occupants`, `D1 ${house}वाँ भाव, भावेश और स्थित ग्रह`) };
  });
  priorities.push(...linkedThemes);
  const fourthHouseSignIndex = (chart.ascendant.signIndex + 3) % 12;
  const houseFourBindus = chart.ashtakavarga.sarva[fourthHouseSignIndex];
  priorities.push({ title: L("Ashtakavarga context", "अष्टकवर्ग संदर्भ"), detail: L(`Your 4th-house sign ${d1FourthSign} has ${houseFourBindus} Sarvashtakavarga bindus in this chart. This is an additional traditional chart measure, not a rating of the building.`, `आपकी चतुर्थ भाव राशि ${T(d1FourthSign)} में सर्वाष्टकवर्ग के ${houseFourBindus} बिंदु हैं। यह कुंडली का एक पारंपरिक माप है, भवन की रेटिंग नहीं।`), source: L("D1 Sarvashtakavarga · 4th-house sign", "D1 सर्वाष्टकवर्ग · चतुर्थ भाव राशि") });
  const majorTransits = transits.filter((t) => ["Jupiter", "Saturn", "Rahu", "Ketu"].includes(t.planet));
  if (majorTransits.length) priorities.push({
    title: L("Current major transits", "वर्तमान प्रमुख गोचर"),
    detail: majorTransits.map((t) => L(`${t.planet} in ${t.sign} · house ${t.houseFromLagna} from Lagna / ${t.houseFromMoon} from Moon`, `${T(t.planet)} ${T(t.sign)} में · लग्न से भाव ${t.houseFromLagna} / चंद्र से भाव ${t.houseFromMoon}`)).join("; "),
    source: L("Current sidereal transits from the saved natal Moon and Lagna", "जन्म चंद्र और लग्न से वर्तमान निरयण गोचर"),
  });
  return {
    fourthHouse: { sign: d1FourthSign, lord: fourthLordEntry.lord, lordSign: fourthLord.sign, lordHouse: fourthLordHouse, condition: balaLabel(lordStrength, locale), occupants: fourthOccupants },
    moon: { sign: moon.sign, nakshatra: moon.nakshatra, condition: balaLabel(moonStrength, locale) },
    homeVarga: { ascendant: d4.ascendant.sign, fourthHouseSign: SIGNS[d4FourthSignIndex], fourthLord: d4FourthLord.planet, fourthLordHouse: d4FourthLordHouse },
    runningPeriod: active ? active.split(" / ").map(T).join(" / ") : L("No current period available", "वर्तमान दशा उपलब्ध नहीं"),
    fourthHouseBindus: houseFourBindus,
    majorTransits,
    priorities,
    note: L("Jyotish interpretation is traditional guidance for self-reflection. Your chart personalizes the themes and timing shown here; the property's floor plan, safety, and building condition are assessed separately.", "ज्योतिषीय व्याख्या आत्मचिंतन के लिए पारंपरिक मार्गदर्शन है। कुंडली यहाँ दिखाए गए विषयों और समय-संदर्भ को व्यक्तिगत बनाती है; संपत्ति का नक्शा, सुरक्षा और भवन की स्थिति अलग से देखी जाती है।"),
  };
}
