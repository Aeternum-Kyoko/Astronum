import { escapeHtml, sendEmail } from "@/lib/email";
import { findPlan, formatInr } from "@/lib/consultationPlans";

interface ConsultationLike {
  name: string;
  email: string;
  phone: string | null;
  birthPlace: string;
  birthTime: string;
  birthDate: Date;
  message: string | null;
  planId: string | null;
  amountPaise: number | null;
  paymentStatus: string;
}

/** Best-effort confirmation to the client and, if ADMIN_NOTIFY_EMAIL is set, a heads-up to the astrologer. */
export async function notifyConsultation(c: ConsultationLike): Promise<void> {
  const plan = findPlan(c.planId);
  const paid = c.paymentStatus === "paid" && c.amountPaise ? ` (paid ${formatInr(c.amountPaise)})` : "";
  const what = plan ? `${plan.name} · ${plan.minutes} minutes${paid}` : "Personal reading request";
  const born = `${c.birthDate.toISOString().slice(0, 10)} ${c.birthTime}, ${c.birthPlace}`;

  const jobs = [
    sendEmail({
      to: c.email,
      subject: "Your Astronum reading is booked",
      text: `Namaste ${c.name},\n\nThank you — we've received your booking: ${what}.\nYou'll be contacted at this email to arrange a time.\n\nBirth details: ${born}`,
      html: `<p>Namaste ${escapeHtml(c.name)},</p><p>Thank you — we've received your booking: <strong>${escapeHtml(what)}</strong>.</p><p>You'll be contacted at this email to arrange a time.</p><p>Birth details: ${escapeHtml(born)}</p>`,
    }),
  ];
  const admin = process.env.ADMIN_NOTIFY_EMAIL;
  if (admin) {
    jobs.push(
      sendEmail({
        to: admin,
        subject: `New consultation: ${c.name} — ${what}`,
        text: `${c.name} <${c.email}>${c.phone ? `, ${c.phone}` : ""}\n${what}\nBorn: ${born}\n\n${c.message ?? ""}`,
        html: `<p><strong>${escapeHtml(c.name)}</strong> &lt;${escapeHtml(c.email)}&gt;${c.phone ? `, ${escapeHtml(c.phone)}` : ""}</p><p>${escapeHtml(what)}</p><p>Born: ${escapeHtml(born)}</p><p>${escapeHtml(c.message ?? "")}</p>`,
      })
    );
  }
  const results = await Promise.allSettled(jobs);
  for (const r of results) if (r.status === "rejected") console.error("Consultation email failed:", r.reason);
}
