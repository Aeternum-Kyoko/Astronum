import type { Metadata } from "next";
import { connection } from "next/server";
import ConsultationForm from "@/components/ConsultationForm";
import { CONSULTATION_PLANS } from "@/lib/consultationPlans";
import { razorpayConfig } from "@/lib/razorpay";

export const metadata: Metadata = {
  title: "Book a Consultation",
  description: "Request a personal Vedic astrology reading.",
};

export default async function ConsultationPage() {
  // Read payment config per request, so adding Razorpay keys takes effect without a rebuild.
  await connection();
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 md:py-20">
      <div className="text-center">
        <p className="text-sm font-medium text-gold-bright">Personal Reading</p>
        <h1 className="mt-3 font-display text-3xl text-cream md:text-4xl">Book a Consultation</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          Share your birth details and what&apos;s on your mind — you&apos;ll be contacted to
          arrange your reading.
        </p>
      </div>

      <div className="mt-10">
        {/* Plans and checkout appear only once Razorpay keys are configured. */}
        <ConsultationForm plans={razorpayConfig() ? CONSULTATION_PLANS : null} />
      </div>
    </section>
  );
}
