import type { AshtakavargaPlanet, PlanetName, SignName, VargaKey } from "./constants";
import type { DashaPeriod } from "./dasha";
import type { Dignity } from "./dignity";

export interface BirthInput {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm, 24h, local to the birth place
  latitude: number;
  longitude: number;
  timezone: string; // IANA zone, e.g. "Asia/Kolkata"
  place: string;
  name: string;
}

export interface PlanetPlacement {
  planet: PlanetName;
  siderealLongitude: number;
  sign: SignName;
  signIndex: number;
  degreeInSign: number;
  house: number;
  nakshatra: string;
  nakshatraIndex: number;
  pada: number;
  retrograde: boolean;
  dignity: Dignity | null;
}

export interface Dosha {
  name: string;
  present: boolean;
  description: string;
}

export interface Yoga {
  name: string;
  present: boolean;
  description: string;
}

export interface DivisionalPlacement {
  planet: PlanetName;
  sign: SignName;
  signIndex: number;
  house: number;
  retrograde: boolean;
}

export interface DivisionalChart {
  ascendant: { sign: SignName; signIndex: number };
  planets: DivisionalPlacement[];
}

export interface HouseLordPlacement {
  house: number;
  sign: SignName;
  lord: PlanetName;
  lordHouse: number;
  lordSign: SignName;
}

export interface SadeSatiStatus {
  active: boolean;
  phase: "rising" | "peak" | "setting" | null;
  natalMoonSign: SignName;
  transitSaturnSign: SignName;
  description: string;
}

export interface AshtakavargaResult {
  bhinna: Record<AshtakavargaPlanet, number[]>; // 7 classical planets only, 12-length bindu arrays indexed by sign
  sarva: number[]; // 12-length, summed across the 7 planets
}

export interface ShadbalaResult {
  planet: AshtakavargaPlanet;
  sthanaBala: number;
  digBala: number;
  kaalaBala: number;
  chestaBala: number;
  naisargikaBala: number;
  drikBala: number;
  totalVirupas: number;
  rupas: number;
  requiredRupas: number;
  isStrong: boolean;
}

export interface KundaliChart {
  input: BirthInput;
  ascendant: {
    siderealLongitude: number;
    sign: SignName;
    signIndex: number;
    degreeInSign: number;
  };
  planets: PlanetPlacement[];
  divisionalCharts: Record<VargaKey, DivisionalChart>;
  houseLords: HouseLordPlacement[];
  ayanamsa: number;
  /** 12 Mahadashas; each carries its 9 Antardashas in `subPeriods`, each of those its 9 Pratyantardashas in its own `subPeriods`. */
  dashas: DashaPeriod[];
  currentDasha: DashaPeriod | null;
  currentAntardasha: DashaPeriod | null;
  antardashas: DashaPeriod[];
  currentPratyantardasha: DashaPeriod | null;
  pratyantardashas: DashaPeriod[];
  doshas: Dosha[];
  yogas: Yoga[];
  sadeSati: SadeSatiStatus;
  ashtakavarga: AshtakavargaResult;
  shadbala: ShadbalaResult[];
  utcDate: string;
}
