import type { PlanetName } from "./constants";

/** Event definitions and result shapes for birth time rectification, kept apart from the engine so forms can import them without the ephemeris. */

export const EVENT_KINDS = {
  marriage: { label: "Marriage or engagement", houses: [7, 2, 11], karaka: ["Venus", "Jupiter"], varga: "D9", vargaHouse: 7 },
  career: { label: "First job, promotion or business start", houses: [10, 6, 11], karaka: ["Saturn", "Sun", "Mercury"], varga: "D10", vargaHouse: 10 },
  child: { label: "Birth of a child", houses: [5, 9, 2, 11], karaka: ["Jupiter"], varga: "D7", vargaHouse: 5 },
  education: { label: "Graduation or degree", houses: [4, 5, 9], karaka: ["Mercury", "Jupiter"], varga: "D24", vargaHouse: 4 },
  property: { label: "Buying a home or vehicle", houses: [4, 11, 2], karaka: ["Mars", "Venus"], varga: "D4", vargaHouse: 4 },
  travel: { label: "Moving abroad or long relocation", houses: [12, 9, 3], karaka: ["Rahu"], varga: "D4", vargaHouse: 12 },
  fatherLoss: { label: "Loss or serious illness of father", houses: [3, 10, 8, 12], karaka: ["Sun"], varga: "D12", vargaHouse: 9 },
  motherLoss: { label: "Loss or serious illness of mother", houses: [5, 10, 8, 12], karaka: ["Moon"], varga: "D12", vargaHouse: 4 },
  health: { label: "Accident, surgery or major illness", houses: [6, 8, 12], karaka: ["Mars", "Saturn"], varga: "D30", vargaHouse: 6 },
  separation: { label: "Divorce or separation", houses: [6, 8, 12, 1], karaka: ["Venus"], varga: "D9", vargaHouse: 7 },
} as const satisfies Record<string, { label: string; houses: number[]; karaka: readonly string[]; varga: string; vargaHouse: number }>;

export type EventKind = keyof typeof EVENT_KINDS;
export const EVENT_KEYS = Object.keys(EVENT_KINDS) as EventKind[];
export const EVENT_PRECISIONS = ["day", "month", "year"] as const;
export type EventPrecision = (typeof EVENT_PRECISIONS)[number];
export const EVENT_CONFIDENCES = ["high", "medium", "low"] as const;
export type EventConfidence = (typeof EVENT_CONFIDENCES)[number];

export interface LifeEvent {
  kind: EventKind;
  /** YYYY-MM-DD, YYYY-MM, or YYYY depending on precision. */
  date: string;
  precision?: EventPrecision;
  confidence?: EventConfidence;
  /** Lets a well-documented major event count more than a minor one. */
  importance?: number;
}

export interface EventMatch {
  kind: EventKind;
  date: string;
  chain: PlanetName[];
  points: number;
  rawPoints: number;
  evidenceWeight: number;
  reasons: string[];
}

export interface Candidate {
  date: string; // YYYY-MM-DD, may differ from the approximate date at midnight
  time: string; // HH:mm
  score: number;
  lagna: string;
  navamsaLagna: string;
  moonNakshatra: string;
  events: EventMatch[];
}

export interface CandidateRun {
  from: string;
  to: string;
  best: Candidate;
}

export interface RectificationResult {
  candidates: Candidate[];
  /** Consecutive minutes that score the same and share Lagna and Navamsa lagna, best first. */
  runs: CandidateRun[];
  /** Times inside the window where the Lagna or Navamsa lagna changes. */
  boundaries: { time: string; what: string }[];
  maxScore: number;
  confidence: "low" | "moderate" | "strong";
  confidenceReason: string;
  warnings: string[];
  leadingCandidateCount: number;
  scoreMargin: number;
}
