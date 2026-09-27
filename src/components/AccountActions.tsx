"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AUTH_CHANGED_EVENT } from "@/lib/safeRedirect";

export function SignOutButton() {
  const router = useRouter();
  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
    router.push("/");
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={signOut}
      className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-cream transition-colors hover:border-gold hover:text-gold-bright"
    >
      Sign out
    </button>
  );
}

/** Two-step delete (no browser confirm dialog): first click arms it, second click deletes. */
export function DeleteChartButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!armed) {
      setArmed(true);
      setTimeout(() => setArmed(false), 4000);
      return;
    }
    setBusy(true);
    await fetch(`/api/charts/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={busy}
      aria-label={armed ? `Confirm deleting ${name}` : `Delete ${name}`}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
        armed ? "border-rose bg-rose/10 text-rose" : "border-border text-muted hover:border-rose hover:text-rose"
      }`}
    >
      {busy ? "Deleting…" : armed ? "Tap again to delete" : "Delete"}
    </button>
  );
}
