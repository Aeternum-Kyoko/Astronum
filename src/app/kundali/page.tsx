import type { Metadata } from "next";
import KundaliForm from "@/components/KundaliForm";

export const metadata: Metadata = {
  title: "Free Kundali Generator",
  description: "Generate your free Vedic birth chart with planetary positions, nakshatras, dashas and doshas.",
};

export default function KundaliPage() {
  return (
    <section className="relative overflow-hidden bg-stars">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ink/20 to-ink" />
      <div className="relative mx-auto max-w-4xl px-5 py-24 md:py-32">
        <KundaliForm />
      </div>
    </section>
  );
}
