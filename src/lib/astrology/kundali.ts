import { DateTime } from "luxon";
import { PLANETS, SIGNS, NAKSHATRAS, SignName, PlanetName } from "./constants";
import { lahiriAyanamsa, normalizeDegrees } from "./ayanamsa";
import {
  computeRawPositions,
  computeAscendantAndMidheaven,
  isRetrograde,
} from "./ephemeris";
import {
  computeVimshottariDasha,
  computeAntardashas,
  computePratyantardashas,
  moonDashaBalance,
  periodElapsedYears,
  type DashaPeriod,
} from "./dasha";
import { getDignity } from "./dignity";
import { computeHouseLords } from "./houseLords";
import { detectYogas } from "./yogas";
import { bhavaOf, sripatiBhavas } from "./bhavaChalit";
import {
  analyzeMangalDosha,
  describeMangalDosha,
  type MangalDoshaResult,
} from "./mangalDosha";
import { computeAllDivisionalCharts } from "./varga";
import { computeAshtakavarga } from "./ashtakavarga";
import { computeShadbala } from "./shadbala";
import { DASHA_YEARS } from "./constants";
import type { Locale } from "../i18n/locale";
import { pick } from "../i18n/ui";
import { term } from "../i18n/terms";
import type {
  BirthInput,
  KundaliChart,
  PlanetPlacement,
  Dosha,
  SadeSatiStatus,
} from "./types";

const NAKSHATRA_SPAN = 360 / 27;

function placeOnZodiac(siderealLongitude: number) {
  const signIndex = Math.floor(siderealLongitude / 30);
  const degreeInSign = siderealLongitude - signIndex * 30;
  const nakshatraIndex = Math.floor(siderealLongitude / NAKSHATRA_SPAN);
  const positionInNakshatra =
    siderealLongitude - nakshatraIndex * NAKSHATRA_SPAN;
  const pada = Math.floor(positionInNakshatra / (NAKSHATRA_SPAN / 4)) + 1;
  return {
    signIndex,
    sign: SIGNS[signIndex] as SignName,
    degreeInSign,
    nakshatraIndex,
    nakshatra: NAKSHATRAS[nakshatraIndex],
    pada,
  };
}

function detectDoshas(
  planets: PlanetPlacement[],
  mangalDosha: MangalDoshaResult,
  locale: Locale,
): Dosha[] {
  const L = pick(locale);
  const mangal: Dosha = {
    key: "Mangal Dosha (Kuja Dosha)",
    name: L("Mangal Dosha (Kuja Dosha)", "मांगलिक दोष (कुज दोष)"),
    present: mangalDosha.status === "present",
    cancelled: mangalDosha.status === "cancelled",
    description: describeMangalDosha(mangalDosha, locale),
  };

  const rahu = planets.find((p) => p.planet === "Rahu")!;
  const ketu = planets.find((p) => p.planet === "Ketu")!;
  const sun = planets.find((p) => p.planet === "Sun")!;
  const others = planets.filter(
    (p) => p.planet !== "Rahu" && p.planet !== "Ketu",
  );
  const diffs = others.map((p) =>
    normalizeDegrees(p.siderealLongitude - rahu.siderealLongitude),
  );
  const allOneSide = diffs.every((d) => d < 180);
  const allOtherSide = diffs.every((d) => d > 180);
  const kaalSarpPresent = allOneSide || allOtherSide;
  const kaalSarp: Dosha = {
    key: "Kaal Sarp Dosha",
    name: L("Kaal Sarp Dosha", "कालसर्प दोष"),
    present: kaalSarpPresent,
    description: kaalSarpPresent
      ? L(
          "All seven classical planets fall on one side of the Rahu-Ketu axis, the classical condition for Kaal Sarp Dosha.",
          "सातों शास्त्रीय ग्रह राहु-केतु अक्ष के एक ही ओर हैं — कालसर्प दोष की शास्त्रीय शर्त।",
        )
      : L(
          "The classical planets are spread on both sides of the Rahu-Ketu axis, so Kaal Sarp Dosha is not indicated.",
          "शास्त्रीय ग्रह राहु-केतु अक्ष के दोनों ओर फैले हैं, इसलिए कालसर्प दोष नहीं बनता।",
        ),
  };

  const pitraPresent =
    rahu.house === 9 ||
    ketu.house === 9 ||
    sun.signIndex === rahu.signIndex ||
    sun.signIndex === ketu.signIndex;
  const pitra: Dosha = {
    key: "Pitra Dosha",
    name: L("Pitra Dosha", "पितृ दोष"),
    present: pitraPresent,
    description: pitraPresent
      ? L(
          "Rahu/Ketu occupy the 9th house, or the Sun is conjunct a lunar node — the classical markers used to flag Pitra Dosha (afflictions relating to ancestry and paternal lineage).",
          "राहु/केतु नवम भाव में हैं, या सूर्य की किसी छाया ग्रह से युति है — पितृ दोष (पूर्वजों और पितृ वंश से जुड़ी पीड़ा) के शास्त्रीय संकेत।",
        )
      : L(
          "No affliction to the 9th house or the Sun by the lunar nodes, so Pitra Dosha is not indicated by this rule.",
          "नवम भाव या सूर्य पर राहु-केतु की पीड़ा नहीं है, इसलिए इस नियम से पितृ दोष नहीं बनता।",
        ),
  };

  return [mangal, kaalSarp, pitra];
}

function computeSadeSati(
  natalMoonSignIndex: number,
  transitDate: Date,
  locale: Locale,
): SadeSatiStatus {
  const ayanamsa = lahiriAyanamsa(transitDate);
  const raw = computeRawPositions(transitDate);
  const saturnSidereal = normalizeDegrees(
    raw.tropicalLongitudes.Saturn - ayanamsa,
  );
  const transitSaturnSignIndex = Math.floor(saturnSidereal / 30);

  const rising = (natalMoonSignIndex + 11) % 12;
  const setting = (natalMoonSignIndex + 1) % 12;

  let phase: SadeSatiStatus["phase"] = null;
  if (transitSaturnSignIndex === rising) phase = "rising";
  else if (transitSaturnSignIndex === natalMoonSignIndex) phase = "peak";
  else if (transitSaturnSignIndex === setting) phase = "setting";

  const active = phase !== null;
  const phaseLabel =
    phase === "rising"
      ? "rising (first)"
      : phase === "peak"
        ? "peak (second)"
        : "setting (third)";

  return {
    active,
    phase,
    natalMoonSign: SIGNS[natalMoonSignIndex] as SignName,
    transitSaturnSign: SIGNS[transitSaturnSignIndex] as SignName,
    description:
      locale === "hi"
        ? active
          ? `गोचर में शनि अभी ${term("hi", SIGNS[transitSaturnSignIndex])} में हैं — आपकी जन्म चंद्र राशि ${term("hi", SIGNS[natalMoonSignIndex])} के सापेक्ष साढ़े साती का ${phase === "rising" ? "पहला (आरंभिक)" : phase === "peak" ? "दूसरा (चरम)" : "तीसरा (अंतिम)"} चरण।`
          : `गोचर में शनि ${term("hi", SIGNS[transitSaturnSignIndex])} में हैं, जो आपकी जन्म चंद्र राशि ${term("hi", SIGNS[natalMoonSignIndex])} के सापेक्ष साढ़े साती की तीन राशियों से बाहर है। आप अभी साढ़े साती में नहीं हैं।`
        : active
          ? `Transiting Saturn is currently in ${SIGNS[transitSaturnSignIndex]}, the ${phaseLabel} phase of Sade Sati relative to your natal Moon in ${SIGNS[natalMoonSignIndex]}.`
          : `Transiting Saturn is in ${SIGNS[transitSaturnSignIndex]}, outside the three signs (relative to your natal Moon in ${SIGNS[natalMoonSignIndex]}) that make up Sade Sati. You are not currently in Sade Sati.`,
  };
}

/** Full Maha→Antar→Pratyantar Vimshottari tree, with `now` located at every level. */
function computeDashaTree(
  moonSiderealLongitude: number,
  birthDate: Date,
  now: Date,
): {
  mahadashas: DashaPeriod[];
  currentDasha: DashaPeriod | null;
  currentAntardasha: DashaPeriod | null;
  currentPratyantardasha: DashaPeriod | null;
} {
  const mahadashas = computeVimshottariDasha(moonSiderealLongitude, birthDate);
  const { elapsedYears: birthElapsedYears } = moonDashaBalance(
    moonSiderealLongitude,
  );

  let currentDasha: DashaPeriod | null = null;
  let currentAntardasha: DashaPeriod | null = null;
  let currentPratyantardasha: DashaPeriod | null = null;

  mahadashas.forEach((maha, mahaIndex) => {
    const isBirthMaha = mahaIndex === 0;
    const mahaElapsed = isBirthMaha ? birthElapsedYears : 0;
    const antardashas = computeAntardashas(maha.lord, maha.start, mahaElapsed);
    maha.subPeriods = antardashas;

    antardashas.forEach((antar, antarIndex) => {
      const isBirthAntar = isBirthMaha && antarIndex === 0;
      const antarFullYears =
        DASHA_YEARS[antar.lord] * (DASHA_YEARS[maha.lord] / 120);
      const antarElapsed = isBirthAntar
        ? periodElapsedYears(antar, antarFullYears)
        : 0;
      const pratyantardashas = computePratyantardashas(
        maha.lord,
        antar,
        antarElapsed,
      );
      antar.subPeriods = pratyantardashas;

      if (now >= antar.start && now < antar.end) {
        const found = pratyantardashas.find(
          (d) => now >= d.start && now < d.end,
        );
        if (found) currentPratyantardasha = found;
      }
    });

    if (now >= maha.start && now < maha.end) {
      currentDasha = maha;
      currentAntardasha =
        antardashas.find((d) => now >= d.start && now < d.end) ?? null;
    }
  });

  return {
    mahadashas,
    currentDasha,
    currentAntardasha,
    currentPratyantardasha,
  };
}

export function calculateKundali(
  input: BirthInput,
  locale: Locale = "en",
): KundaliChart {
  const local = DateTime.fromISO(`${input.date}T${input.time}`, {
    zone: input.timezone,
  });
  if (!local.isValid) {
    throw new Error(
      `Invalid birth date/time/timezone: ${local.invalidReason} ${local.invalidExplanation ?? ""}`,
    );
  }
  const utcDate = local.toJSDate();

  const ayanamsa = lahiriAyanamsa(utcDate);
  const raw = computeRawPositions(utcDate);
  const { ascendant: ascTropical, midheaven: mcTropical } =
    computeAscendantAndMidheaven(utcDate, input.latitude, input.longitude);

  const ascSidereal = normalizeDegrees(ascTropical - ayanamsa);
  const ascPlacement = placeOnZodiac(ascSidereal);
  const mcSidereal = normalizeDegrees(mcTropical - ayanamsa);

  const nonRetrogradingBodies = new Set<PlanetName>([
    "Sun",
    "Moon",
    "Rahu",
    "Ketu",
  ]);

  const planets: PlanetPlacement[] = PLANETS.map((planet) => {
    const siderealLongitude = normalizeDegrees(
      raw.tropicalLongitudes[planet] - ayanamsa,
    );
    const placement = placeOnZodiac(siderealLongitude);
    const house =
      ((placement.signIndex - ascPlacement.signIndex + 12) % 12) + 1;
    const retrograde = nonRetrogradingBodies.has(planet)
      ? planet === "Rahu" || planet === "Ketu"
      : isRetrograde(
          planet as
            | "Sun"
            | "Moon"
            | "Mercury"
            | "Venus"
            | "Mars"
            | "Jupiter"
            | "Saturn",
          utcDate,
        );

    return {
      planet,
      siderealLongitude,
      sign: placement.sign,
      signIndex: placement.signIndex,
      degreeInSign: placement.degreeInSign,
      house,
      nakshatra: placement.nakshatra,
      nakshatraIndex: placement.nakshatraIndex,
      pada: placement.pada,
      retrograde,
      dignity: getDignity(planet, placement.signIndex, placement.degreeInSign),
    };
  });

  const moon = planets.find((p) => p.planet === "Moon")!;
  const now = new Date();
  const {
    mahadashas,
    currentDasha,
    currentAntardasha,
    currentPratyantardasha,
  } = computeDashaTree(moon.siderealLongitude, utcDate, now);

  const mangalDosha = analyzeMangalDosha(ascPlacement.signIndex, planets);
  const doshas = detectDoshas(planets, mangalDosha, locale);
  const yogas = detectYogas(planets, ascPlacement.signIndex, locale);
  const houseLords = computeHouseLords(ascPlacement.signIndex, planets);
  const divisionalCharts = computeAllDivisionalCharts(ascSidereal, planets);
  const ashtakavarga = computeAshtakavarga(ascPlacement.signIndex, planets);
  const shadbala = computeShadbala(
    planets,
    ascSidereal,
    divisionalCharts,
    utcDate,
    input.latitude,
    input.longitude,
  );
  const sadeSati = computeSadeSati(moon.signIndex, now, locale);
  const bhavas = sripatiBhavas(ascSidereal, mcSidereal);
  const chalitHouses = planets.map((p) => ({
    planet: p.planet,
    house: bhavaOf(p.siderealLongitude, bhavas),
  }));

  return {
    input,
    ascendant: {
      siderealLongitude: ascSidereal,
      sign: ascPlacement.sign,
      signIndex: ascPlacement.signIndex,
      degreeInSign: ascPlacement.degreeInSign,
    },
    midheaven: mcSidereal,
    planets,
    chalitHouses,
    bhavas,
    divisionalCharts,
    houseLords,
    ayanamsa,
    dashas: mahadashas,
    currentDasha,
    currentAntardasha,
    antardashas: currentDasha?.subPeriods ?? [],
    currentPratyantardasha,
    pratyantardashas: currentAntardasha?.subPeriods ?? [],
    doshas,
    mangalDosha,
    yogas,
    sadeSati,
    ashtakavarga,
    shadbala,
    utcDate: utcDate.toISOString(),
  };
}
