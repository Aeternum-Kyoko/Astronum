/**
 * Consultation plans offered for paid booking.
 *
 * SET YOUR OWN PRICES before enabling payments. Prices are only shown, and
 * checkout only appears, once RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set;
 * until then the consultation form works as a free request form.
 */

export interface ConsultationPlan {
  id: string;
  name: string;
  minutes: number;
  /** Price in paise (₹1 = 100 paise). */
  pricePaise: number;
  description: string;
}

export const CONSULTATION_PLANS: ConsultationPlan[] = [
  { id: "quick", name: "Quick question", minutes: 20, pricePaise: 50000, description: "One focused question answered from your chart." },
  { id: "standard", name: "Full reading", minutes: 45, pricePaise: 150000, description: "Your chart, current dasha and the year ahead." },
  { id: "matching", name: "Compatibility reading", minutes: 45, pricePaise: 200000, description: "Both charts compared in depth, beyond Guna Milan." },
];

export function findPlan(id: string | undefined | null): ConsultationPlan | null {
  return CONSULTATION_PLANS.find((p) => p.id === id) ?? null;
}

export function formatInr(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}
