import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { BUSINESS } from "@/lib/legal";

export const metadata: Metadata = { title: "Contact Us" };

export default function ContactPage() {
  return (
    <LegalPage title="Contact Us">
      <p>We&rsquo;re happy to help with your account, a booking or a question about your chart.</p>
      <ul>
        <li>
          Email: <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
        </li>
        <li>Phone: {BUSINESS.phone}</li>
        <li>Address: {BUSINESS.address}</li>
      </ul>
      <p>
        For a personal reading, <Link href="/consultation">book a consultation</Link>.
      </p>
    </LegalPage>
  );
}
