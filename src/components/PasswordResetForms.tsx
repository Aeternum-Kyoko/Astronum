"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AUTH_CHANGED_EVENT } from "@/lib/safeRedirect";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) setError(data.error ?? "Something went wrong");
    else setMessage(data.message);
  }

  return (
    <form onSubmit={submit} className="card-edge w-full rounded-3xl p-7 md:p-9">
      <h1 className="font-display text-3xl text-cream">Forgot your password?</h1>
      <p className="mt-2 text-sm text-muted">Enter your account email and we&apos;ll send you a link to set a new one.</p>
      {message ? (
        <p role="status" className="mt-6 rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-cream">
          {message}
        </p>
      ) : (
        <>
          <label className="mt-6 block">
            <span className="mb-1.5 block text-xs font-semibold text-muted">Email</span>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="input" />
          </label>
          {error && (
            <p role="alert" className="mt-4 rounded-xl border border-rose/30 bg-rose/5 px-4 py-3 text-sm text-rose">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-full bg-gold px-6 py-3.5 text-base font-semibold text-on-gold hover:bg-gold-bright disabled:opacity-70"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </>
      )}
      <p className="mt-5 text-center text-sm text-muted">
        <Link href="/login" className="font-semibold text-gold-bright hover:text-gold">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
    router.push("/account");
    router.refresh();
  }

  if (!token) {
    return (
      <div className="card-edge w-full rounded-3xl p-7 text-center md:p-9">
        <p className="text-sm text-muted">This page needs the link from your reset email.</p>
        <Link href="/forgot-password" className="mt-4 inline-block font-semibold text-gold-bright hover:text-gold">
          Request a reset link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card-edge w-full rounded-3xl p-7 md:p-9">
      <h1 className="font-display text-3xl text-cream">Set a new password</h1>
      <p className="mt-2 text-sm text-muted">You&apos;ll be signed out everywhere else once it&apos;s changed.</p>
      <label className="mt-6 block">
        <span className="mb-1.5 block text-xs font-semibold text-muted">New password</span>
        <input required type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className="input" />
      </label>
      <label className="mt-4 block">
        <span className="mb-1.5 block text-xs font-semibold text-muted">Confirm password</span>
        <input required type="password" minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" className="input" />
      </label>
      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-rose/30 bg-rose/5 px-4 py-3 text-sm text-rose">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-full bg-gold px-6 py-3.5 text-base font-semibold text-on-gold hover:bg-gold-bright disabled:opacity-70"
      >
        {loading ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
