"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AUTH_CHANGED_EVENT, safeRedirectPath } from "@/lib/safeRedirect";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeRedirectPath(searchParams.get("next"));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isSignup = mode === "signup";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isSignup ? { name, email, password } : { email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  const otherHref = `${isSignup ? "/login" : "/signup"}${next !== "/today" ? `?next=${encodeURIComponent(next)}` : ""}`;

  return (
    <form onSubmit={handleSubmit} className="card-edge w-full rounded-3xl p-7 md:p-9">
      <h1 className="font-display text-3xl text-cream">{isSignup ? "Create your account" : "Welcome back"}</h1>
      <p className="mt-2 text-sm text-muted">
        {isSignup ? "Save the charts of everyone you care about and open them in one tap." : "Sign in to see your saved charts."}
      </p>

      <div className="mt-6 space-y-4">
        {isSignup && (
          <Field label="Name">
            <input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="input" />
          </Field>
        )}
        <Field label="Email">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="input"
          />
        </Field>
        <Field label="Password">
          <input
            required
            type="password"
            minLength={isSignup ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isSignup ? "new-password" : "current-password"}
            className="input"
          />
          {isSignup ? (
            <span className="mt-1.5 block text-xs text-muted">At least 8 characters.</span>
          ) : (
            <Link href="/forgot-password" className="mt-1.5 block text-right text-xs font-semibold text-gold-bright hover:text-gold">
              Forgot password?
            </Link>
          )}
        </Field>
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-rose/30 bg-rose/5 px-4 py-3 text-sm text-rose">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-full bg-gold px-6 py-3.5 text-base font-semibold text-on-gold transition-colors hover:bg-gold-bright disabled:opacity-70"
      >
        {loading ? (isSignup ? "Creating account…" : "Signing in…") : isSignup ? "Create account" : "Sign in"}
      </button>

      <p className="mt-5 text-center text-sm text-muted">
        {isSignup ? "Already have an account?" : "New here?"}{" "}
        <Link href={otherHref} className="font-semibold text-gold-bright hover:text-gold">
          {isSignup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted">{label}</span>
      {children}
    </label>
  );
}
