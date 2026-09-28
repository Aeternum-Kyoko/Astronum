"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AUTH_CHANGED_EVENT } from "@/lib/safeRedirect";

interface Me {
  name: string;
}

/** Signed-in avatar linking to My charts, or a Sign in link. Fetched client-side so pages stay statically rendered. */
export default function AccountButton({ label = "Sign in" }: { label?: string }) {
  const [me, setMe] = useState<Me | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch("/api/auth/me", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => !cancelled && setMe(d.user ?? null))
        .catch(() => !cancelled && setMe(null));
    void load();
    window.addEventListener(AUTH_CHANGED_EVENT, load);
    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_CHANGED_EVENT, load);
    };
  }, []);

  if (me === undefined) return <span className="h-9 w-9" aria-hidden="true" />;

  if (!me) {
    return (
      <Link
        href="/login"
        className="rounded-full border border-border px-3.5 py-2 text-sm text-muted transition-colors hover:border-gold hover:text-gold-bright"
      >
        {label}
      </Link>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <Link href="/today" className="hidden rounded-full border border-border px-3.5 py-2 text-sm text-muted transition-colors hover:border-gold hover:text-gold-bright sm:inline-block">
        Today
      </Link>
    <Link
      href="/account"
      title="My charts"
      aria-label={`My charts (signed in as ${me.name})`}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-gold-bright to-gold text-sm font-bold text-on-gold"
    >
      {me.name.trim()[0]?.toUpperCase() ?? "?"}
    </Link>
    </span>
  );
}
