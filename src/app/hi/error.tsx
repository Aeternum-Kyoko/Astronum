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
      title="कुछ गड़बड़ हो गई"
      body="यह पृष्ठ लोड नहीं हो सका। अक्सर यह अस्थायी होता है — दोबारा कोशिश करें या होम पर जाएँ।"
      links={[{ href: "/hi", label: "होम" }]}
      action={
        <button
          type="button"
          onClick={() => retry()}
          className="mt-6 rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-on-gold hover:bg-gold-bright"
        >
          दोबारा कोशिश करें
        </button>
      }
    />
  );
}
