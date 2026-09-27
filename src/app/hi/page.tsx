import type { Metadata } from "next";
import HomeView from "@/components/views/HomeView";
import { languageAlternates } from "@/lib/i18n/locale";

// The hero shows the live sky; re-render it at most every 30 minutes.
export const revalidate = 1800;

export const metadata: Metadata = { alternates: { ...languageAlternates("/"), canonical: "/hi" } };

export default function HindiHomePage() {
  return <HomeView locale="hi" />;
}
