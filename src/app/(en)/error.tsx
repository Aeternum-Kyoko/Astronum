"use client";

import { useEffect } from "react";
import StatusPage from "@/components/StatusPage";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      code="⚠"
      title="Something went wrong"
      body="We couldn't load this page. It's usually temporary — try again, or head back home."
      links={[{ href: "/", label: "Home" }]}
      action={
        <button
          type="button"
          onClick={() => retry()}
          className="mt-6 rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-on-gold hover:bg-gold-bright"
        >
          Try again
        </button>
      }
    />
  );
}
