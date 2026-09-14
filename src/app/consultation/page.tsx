import type { Metadata } from "next";
import ConsultationForm from "@/components/ConsultationForm";

export const metadata: Metadata = {
  title: "Book a Consultation",
  description: "Request a personal Vedic astrology reading.",
};

export default function ConsultationPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 md:py-20">
      <div className="text-center">
        <p className="text-sm font-medium tracking-[0.2em] text-gold-bright uppercase">Personal Reading</p>
        <h1 className="mt-3 font-display text-3xl text-cream md:text-4xl">Book a Consultation</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          Share your birth details and what&apos;s on your mind — you&apos;ll be contacted to
          arrange your reading.
        </p>
      </div>

      <div className="mt-10">
        <ConsultationForm />
      </div>
    </section>
  );
}
