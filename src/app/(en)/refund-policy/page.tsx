import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { BUSINESS } from "@/lib/legal";

export const metadata: Metadata = { title: "Refund & Cancellation Policy" };

export default function RefundPolicyPage() {
  return (
    <LegalPage title="Refund & Cancellation Policy">
      <p>This policy applies to paid consultations booked on this website.</p>
      <h2>Before your reading</h2>
      <p>
        [If you cancel at least 24 hours before your scheduled reading, you will receive a full refund.] [If a
        reading has not yet been scheduled, you may cancel for a full refund at any time.]
      </p>
      <h2>After your reading</h2>
      <p>[Completed readings are not refundable.]</p>
      <h2>If we cannot provide the reading</h2>
      <p>If we are unable to schedule or deliver your reading, you will receive a full refund.</p>
      <h2>How refunds are paid</h2>
      <p>Refunds are made to the original payment method through Razorpay, typically within [5–7] working days.</p>
      <h2>How to request</h2>
      <p>
        Email <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> with your name and payment reference.
      </p>
    </LegalPage>
  );
}
