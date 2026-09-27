"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BirthInput } from "@/lib/astrology/types";

export default function SaveChartButton({ input }: { input: BirthInput }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setState("saving");
    const res = await fetch("/api/charts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (res.status === 401) {
      // Come back to this exact chart after signing in.
      router.push(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setState("error");
      setMessage(data.error ?? "Could not save the chart");
      return;
    }
    setState("saved");
  }

  return (
    <>
      <button
        type="button"
        onClick={save}
        disabled={state === "saving" || state === "saved"}
        title={message ?? undefined}
        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors disabled:cursor-default ${
          state === "saved"
            ? "border-gold/50 text-gold-bright"
            : state === "error"
              ? "border-rose/50 text-rose"
              : "border-border text-cream hover:border-gold hover:text-gold-bright"
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M4 2.5h8a.5.5 0 0 1 .5.5v11l-4.5-3-4.5 3V3a.5.5 0 0 1 .5-.5Z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
            fill={state === "saved" ? "currentColor" : "none"}
          />
        </svg>
        <span aria-live="polite">
          {state === "saving" ? "Saving…" : state === "saved" ? "Saved to My charts" : state === "error" ? "Couldn't save" : "Save chart"}
        </span>
      </button>
      {state === "error" && message && <span className="sr-only">{message}</span>}
    </>
  );
}
