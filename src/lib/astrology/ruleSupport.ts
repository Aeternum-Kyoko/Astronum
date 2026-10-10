import type { Locale } from "../i18n/locale";
/** Display-only names for the existing heuristic scores. No probability claim. */
export function ruleSupport(score: number, locale: Locale = "en") {
  return locale === "hi" ? score >= 75 ? "अधिक नियम-सहारा" : score >= 55 ? "मध्यम नियम-सहारा" : "सीमित नियम-सहारा"
    : score >= 75 ? "Stronger rule support" : score >= 55 ? "Moderate rule support" : "Limited rule support";
}
