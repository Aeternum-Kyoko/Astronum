"use client";

import { useState } from "react";
import DatePicker from "@/components/DatePicker";
import TimePicker from "@/components/TimePicker";
import PlaceInput, { type PlaceSuggestion } from "@/components/PlaceInput";
import { formatInr, type ConsultationPlan } from "@/lib/consultationPlans";

interface PaymentDetails {
  keyId: string;
  orderId: string;
  amount: number;
  description: string;
  prefill: { name: string; email: string; contact: string };
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load the payment window. Check your connection and try again."));
    document.body.appendChild(script);
  });
}

/** `plans` is null when payments aren't configured — the form then sends a free request. */
export default function ConsultationForm({ plans }: { plans: ConsultationPlan[] | null }) {
  const [planId, setPlanId] = useState(plans?.[1]?.id ?? plans?.[0]?.id ?? "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [place, setPlace] = useState<PlaceSuggestion | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingPayment, setPendingPayment] = useState<PaymentDetails | null>(null);
  const [done, setDone] = useState<"requested" | "paid" | null>(null);

  async function pay(payment: PaymentDetails) {
    setError(null);
    await loadCheckout();
    const checkout = new window.Razorpay!({
      key: payment.keyId,
      order_id: payment.orderId,
      amount: payment.amount,
      currency: "INR",
      name: "Astronum",
      description: payment.description,
      prefill: payment.prefill,
      theme: { color: "#d4af6a" },
      handler: async (response: RazorpayResponse) => {
        const res = await fetch("/api/consultation/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(response),
        });
        if (res.ok) {
          setPendingPayment(null);
          setDone("paid");
        } else {
          const data = await res.json().catch(() => ({}));
          setError(
            `${data.error ?? "We couldn't confirm the payment."} If money was deducted, it will be matched automatically — contact us with payment ID ${response.razorpay_payment_id}.`
          );
        }
      },
      modal: {
        ondismiss: () => setError("Payment was not completed. Your details are saved — you can try again below."),
      },
    });
    checkout.open();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!birthDate || !birthTime || !place) {
      setError("Please fill in your birth date, time, and select a birth place from the list.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          birthDate,
          birthTime,
          birthPlace: place.displayName,
          latitude: place.latitude,
          longitude: place.longitude,
          timezone: place.timezone,
          message: message || undefined,
          planId: plans ? planId : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      if (data.payment) {
        setPendingPayment(data.payment);
        await pay(data.payment);
      } else {
        setDone("requested");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="card-edge rounded-2xl p-10 text-center">
        <p className="font-display text-2xl text-gold-bright">{done === "paid" ? "Payment received — you're booked" : "Request received"}</p>
        <p className="mt-3 text-sm text-muted">
          Thank you. A confirmation is on its way to your email, and you&apos;ll be contacted there to arrange a time
          for your reading.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card-edge rounded-2xl p-6 md:p-8">
      {plans && (
        <fieldset className="mb-7">
          <legend className="mb-3 text-xs font-medium text-muted">Choose your reading</legend>
          <div className="grid gap-3 md:grid-cols-3">
            {plans.map((p) => (
              <label
                key={p.id}
                className={`cursor-pointer rounded-xl border p-4 transition-colors ${
                  planId === p.id ? "border-gold bg-gold/10" : "border-border hover:border-gold/50"
                }`}
              >
                <input type="radio" name="plan" value={p.id} checked={planId === p.id} onChange={() => setPlanId(p.id)} className="sr-only" />
                <span className="block font-semibold text-cream">{p.name}</span>
                <span className="block text-xs text-muted">{p.minutes} minutes</span>
                <span className="mt-2 block text-lg font-bold text-gold-bright">{formatInr(p.pricePaise)}</span>
                <span className="mt-1 block text-xs leading-relaxed text-muted">{p.description}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Your name">
          <input required value={name} onChange={(e) => setName(e.target.value)} className="input" autoComplete="name" />
        </Field>
        <Field label="Email">
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" autoComplete="email" />
        </Field>
        <Field label="Phone (optional)">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" autoComplete="tel" />
        </Field>
        <div className="grid grid-cols-2 gap-5">
          <Field label="Date of birth">
            <DatePicker value={birthDate} onChange={setBirthDate} />
          </Field>
          <Field label="Time of birth">
            <TimePicker value={birthTime} onChange={setBirthTime} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Place of birth">
            <PlaceInput selected={place} onSelect={setPlace} showTimezone={false} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="What would you like guidance on? (optional)">
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="input resize-none" />
          </Field>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-rose/30 bg-rose/5 px-4 py-3 text-sm text-rose">
          {error}
        </p>
      )}

      {pendingPayment ? (
        <button
          type="button"
          onClick={() => pay(pendingPayment).catch((err) => setError(err.message))}
          className="mt-7 w-full rounded-full bg-gold px-6 py-3.5 text-sm font-semibold text-on-gold transition-colors hover:bg-gold-bright md:w-auto"
        >
          Retry payment · {formatInr(pendingPayment.amount)}
        </button>
      ) : (
        <button
          type="submit"
          disabled={loading}
          className="mt-7 w-full rounded-full bg-gold px-6 py-3.5 text-sm font-semibold text-on-gold transition-colors hover:bg-gold-bright disabled:opacity-60 md:w-auto"
        >
          {loading
            ? plans
              ? "Opening payment…"
              : "Sending…"
            : plans
              ? `Pay ${formatInr(plans.find((p) => p.id === planId)?.pricePaise ?? 0)} & book`
              : "Request a Reading"}
        </button>
      )}
      {plans && <p className="mt-3 text-xs text-muted">Secure payment by Razorpay — UPI, cards, net banking and wallets.</p>}
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
