import type { KundaliChart } from "@/lib/astrology/types";

export const VASTU_ZONES = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW", "CENTER"] as const;
export type VastuZone = (typeof VASTU_ZONES)[number];

export const VASTU_ROOMS = [
  "living", "kitchen", "mainBedroom", "bedroom", "prayer", "bathroom", "toilet", "staircase",
  "water", "study", "work", "dining", "storage", "balcony", "open", "other",
] as const;
export type VastuRoom = (typeof VASTU_ROOMS)[number];
export type PropertyType = "apartment" | "house";
export interface VastuRoomPlacement { id: string; zone: VastuZone; room: VastuRoom; floor: number; }

export interface VastuAssessmentInput {
  propertyType: PropertyType;
  northReference: "compass" | "plan" | "estimated";
  entrance: VastuZone | "unknown";
  rooms: VastuRoomPlacement[];
  floors: number;
  /** Bearing of the floor-plan top edge clockwise from true north. */
  planBearing: number;
  daylight: "good" | "mixed" | "limited" | "unknown";
  ventilation: "good" | "mixed" | "limited" | "unknown";
  dampness: "no" | "yes" | "unknown";
  accessAndSafety: "good" | "needsAttention" | "unknown";
}

export type VastuSourceType = "modern-vastu-convention" | "practical-housing-guidance";
export interface VastuFinding {
  id: string;
  title: string;
  zone: VastuZone | null;
  level: "note" | "consider" | "priority";
  tradition: string;
  practical: string;
  action: string;
  sourceType: VastuSourceType;
}

export interface VastuAssessment {
  input: VastuAssessmentInput;
  findings: VastuFinding[];
  summary: { priority: number; consider: number; notes: number };
  northNote: string;
}

export interface PersonalVastuContext {
  fourthHouse: {
    sign: string;
    lord: string;
    lordSign: string;
    lordHouse: number;
    condition: string;
    occupants: string[];
  };
  moon: { sign: string; nakshatra: string; condition: string };
  homeVarga: { ascendant: string; fourthHouseSign: string; fourthLord: string; fourthLordHouse: number };
  runningPeriod: string;
  fourthHouseBindus: number;
  majorTransits: { planet: string; sign: string; houseFromMoon: number; houseFromLagna: number }[];
  priorities: { title: string; detail: string; source: string }[];
  note: string;
}

export type VastuChart = Pick<KundaliChart,
  "ascendant" | "planets" | "houseLords" | "shadbala" | "currentDasha" | "currentAntardasha" | "divisionalCharts" | "ashtakavarga"
>;
