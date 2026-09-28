/** Prashna question topics and result shapes, kept apart from the engine so the form can import them without the ephemeris. */

export const PRASHNA_TOPICS = {
  marriage: { label: "Will I get married / will this marriage happen?", house: 7, favourable: [2, 7, 11], negating: [1, 6, 10] },
  love: { label: "Will this relationship work out?", house: 5, favourable: [5, 7, 11], negating: [1, 6, 10, 12] },
  job: { label: "Will I get this job or promotion?", house: 10, favourable: [2, 6, 10, 11], negating: [5, 8, 12] },
  business: { label: "Will this business deal succeed?", house: 7, favourable: [2, 7, 10, 11], negating: [5, 8, 12] },
  money: { label: "Will I receive this money?", house: 11, favourable: [2, 6, 11], negating: [5, 8, 12] },
  property: { label: "Will I buy this property or vehicle?", house: 4, favourable: [4, 11, 12], negating: [3, 5, 10] },
  education: { label: "Will I pass or get admission?", house: 9, favourable: [4, 9, 11], negating: [3, 8, 12] },
  travel: { label: "Will I travel or settle abroad?", house: 12, favourable: [3, 9, 12], negating: [2, 4, 11] },
  health: { label: "Will I recover from this illness?", house: 1, favourable: [1, 5, 11], negating: [6, 8, 12] },
  legal: { label: "Will I win this dispute or case?", house: 6, favourable: [6, 11], negating: [5, 12] },
  children: { label: "Will we have a child?", house: 5, favourable: [2, 5, 11], negating: [1, 4, 10] },
  lost: { label: "Will I find what I lost?", house: 2, favourable: [2, 11], negating: [8, 12] },
} as const;

export type PrashnaTopic = keyof typeof PRASHNA_TOPICS;

export interface PrashnaFactor {
  name: string;
  positive: boolean | null;
  text: string;
}

export interface PrashnaResult {
  askedAt: Date;
  topic: PrashnaTopic;
  question: string;
  answer: "Yes" | "Likely yes" | "Uncertain" | "Unlikely";
  score: number;
  factors: PrashnaFactor[];
  chart: { ascendant: string; moonSign: string; moonNakshatra: string };
  advice: string;
}
