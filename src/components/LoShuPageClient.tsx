"use client";

import LoShuMaker from "./LoShuMaker";
import type { Locale } from "@/lib/i18n/locale";

/** Separate page boundary for the shared calculator used by both root layouts. */
export default function LoShuPageClient({ locale = "en" }: { locale?: Locale }) {
  return <LoShuMaker locale={locale} />;
}
