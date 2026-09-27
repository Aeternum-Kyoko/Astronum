/**
 * Transactional email. Sends through Resend (https://resend.com) when
 * RESEND_API_KEY and EMAIL_FROM are set; in development without them the
 * message is logged to the server console so flows like password reset can
 * still be tested.
 */

interface Email {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail(email: Email): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email is not configured: set RESEND_API_KEY and EMAIL_FROM.");
    }
    console.info(`[email:dev] To: ${email.to}\nSubject: ${email.subject}\n\n${email.text}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: email.to, subject: email.subject, text: email.text, html: email.html }),
  });
  if (!res.ok) throw new Error(`Email send failed (${res.status})`);
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
