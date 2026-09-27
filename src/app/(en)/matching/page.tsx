import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import MatchingForm from "@/components/MatchingForm";

export const metadata: Metadata = {
  title: "Kundli Matching — Marriage, Love, Business & Friendship",
  description:
    "Free Vedic kundli matching: the 36-point Guna Milan for marriage, and weighted compatibility reports for a romantic interest, a business partner or a friend.",
};

export default function MatchingPage() {
  return (
    <section className="relative">
      <div className="relative mx-auto max-w-5xl px-5 py-14 md:py-20">
        <header className="mx-auto max-w-2xl text-center">
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-cream md:text-5xl">How well do your charts match?</h1>
          <p className="mt-4 text-base leading-relaxed text-muted">
            Choose the relationship, enter both birth details, and see where the two charts support each other and where
            they need care. <Link href="/learn/compatibility">How matching works</Link>.
          </p>
        </header>
        <div className="mt-10">
          {/* MatchingForm reads both people's details from the URL when opened from a shared link. */}
          <Suspense fallback={null}>
            <MatchingForm />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
