import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { BUSINESS } from "@/lib/legal";

export const metadata: Metadata = { title: "Terms of Use" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use">
      <p>By using this website you agree to these terms. If you do not agree, please do not use the site.</p>
      <h2>Nature of the service</h2>
      <p>
        Charts, horoscopes, Panchang, matching scores, muhurat suggestions, remedies and readings on this site are
        generated from traditional Vedic astrology rules and astronomical calculation. They are offered for guidance,
        interest and self-reflection. They are not medical, legal, financial or psychological advice, and should not
        be relied on as a substitute for a qualified professional.
      </p>
      <h2>Accounts</h2>
      <p>
        You are responsible for keeping your password safe and for activity on your account. We may suspend accounts
        that misuse the service.
      </p>
      <h2>Consultations</h2>
      <p>
        Personal readings are provided by a practising astrologer based on the details you share. Scheduling is
        arranged by email after booking. See the <a href="/refund-policy">Refund Policy</a> for paid bookings.
      </p>
      <h2>Content</h2>
      <p>
        The site&rsquo;s text, design and software belong to {BUSINESS.name}. You may share links and personal
        results, but may not copy or republish the site&rsquo;s content in bulk.
      </p>
      <h2>Liability</h2>
      <p>
        The service is provided &ldquo;as is&rdquo;. To the extent permitted by law, {BUSINESS.name} is not liable for
        decisions made on the basis of the site&rsquo;s content.
      </p>
      <h2>Governing law</h2>
      <p>These terms are governed by the laws of India, with courts at {BUSINESS.jurisdiction} having jurisdiction.</p>
    </LegalPage>
  );
}
