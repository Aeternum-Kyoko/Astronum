import type { Metadata } from "next";
import { Suspense } from "react";
import KundaliForm from "@/components/KundaliForm";
import KundaliIntro from "@/components/KundaliIntro";

export const metadata: Metadata = {
  title: "Free Kundali Generator",
  description: "Generate your free Vedic birth chart with planetary positions, nakshatras, dashas and doshas.",
};

export default function KundaliPage() {
  return (
    <section className="relative overflow-hidden">
      <div className="relative mx-auto max-w-6xl px-5 py-16 md:py-24">
        {/* KundaliForm reads the birth details from the URL (shared links, home page form). */}
        {/* The fallback reserves the form's height so nothing below jumps when it hydrates. */}
        <Suspense
          fallback={
            <div className="mx-auto max-w-4xl">
              <KundaliIntro />
              <div className="card-edge mt-14 h-[444px] rounded-3xl md:h-[346px]" aria-hidden="true" />
            </div>
          }
        >
          <KundaliForm />
        </Suspense>
      </div>
    </section>
  );
}
