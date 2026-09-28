import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { BUSINESS } from "@/lib/legal";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        This policy explains what information {BUSINESS.name} (&ldquo;we&rdquo;) collects through this website, why,
        and the choices you have.
      </p>
      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Birth details</strong> you enter (name, date, time and place of birth) to calculate charts,
          matching, Panchang and other tools. Charts are calculated on request; unless you save a chart to an account,
          these details travel only in the page address and are not stored by us.
        </li>
        <li>
          <strong>Account details</strong> if you sign up: your name, email address and a securely hashed password
          (we never store the password itself), plus any charts you choose to save.
        </li>
        <li>
          <strong>Consultation requests</strong>: your name, email, optional phone number, birth details and message.
        </li>
        <li>
          <strong>Payments</strong> for paid consultations are processed by Razorpay. We receive the order and payment
          reference and status; we do not see or store your card, UPI or bank details.
        </li>
      </ul>
      <h2>Services we use</h2>
      <ul>
        <li>OpenStreetMap Nominatim, to look up the coordinates and timezone of a birth place you type.</li>
        <li>Razorpay, to process payments.</li>
        <li>Resend, to send account and booking emails.</li>
      </ul>
      <h2>Cookies and local storage</h2>
      <p>
        We set a sign-in cookie when you log in (and an administrator cookie for site staff). Your light/dark theme
        choice is kept in your browser&rsquo;s local storage. We do not use advertising or tracking cookies.
      </p>
      <h2>How we use information</h2>
      <p>
        To provide the tools you use, keep your account and saved charts, respond to consultation requests, send
        emails you ask for (such as a password reset or booking confirmation), and keep the site secure.
      </p>
      <h2>Your choices</h2>
      <p>
        You can delete saved charts at any time from your account. To delete your account or ask what we hold about
        you, email <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>.
      </p>
      <h2>Contact</h2>
      <p>
        {BUSINESS.name}, {BUSINESS.address}. Email: {BUSINESS.email}.
      </p>
    </LegalPage>
  );
}
