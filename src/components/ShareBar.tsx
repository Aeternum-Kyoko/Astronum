"use client";

import { useLocale } from "@/lib/i18n/LocaleContext";
import { pick } from "@/lib/i18n/ui";
import { useState } from "react";
import { haptic } from "@/lib/haptics";

/**
 * Share and save-as-image buttons. "Share" uses the phone's share sheet
 * (with the image attached where supported), falling back to copying the
 * link. "Save image" downloads the card.
 */
export default function ShareBar({
  url,
  title,
  text,
  fileName,
  imageUrl,
  makeImage,
}: {
  url: string;
  title: string;
  text?: string;
  fileName: string;
  /** A server-rendered image to download. */
  imageUrl?: string;
  /** Or an image made in the browser. */
  makeImage?: () => Promise<Blob>;
}) {
  const L = pick(useLocale());
  const [status, setStatus] = useState<string | null>(null);
  const fullUrl = () => (url.startsWith("/") ? `${window.location.origin}${url}` : url);

  async function getImage(): Promise<Blob | null> {
    if (makeImage) return makeImage();
    if (imageUrl) return (await fetch(imageUrl)).blob();
    return null;
  }

  async function share() {
    try {
      const blob = await getImage().catch(() => null);
      const file = blob ? new File([blob], fileName, { type: "image/png" }) : null;
      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title, text, url: fullUrl(), files: [file] });
        haptic("success");
      } else if (navigator.share) {
        await navigator.share({ title, text, url: fullUrl() });
        haptic("success");
      } else {
        await navigator.clipboard.writeText(fullUrl());
        setStatus(L("Link copied","लिंक कॉपी हुआ"));
        haptic("success");
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") setStatus(L("Couldn't share — the link is in the address bar","साझा नहीं कर सके — लिंक पता पट्टी में है"));
    }
  }

  async function save() {
    try {
      const blob = await getImage();
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      setStatus(L("Image saved","चित्र सहेजा"));
      haptic("success");
    } catch {
      setStatus(L("Couldn't create the image","चित्र नहीं बना सके"));
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={share} className="rounded-full border border-gold/50 px-4 py-2 text-xs font-semibold text-gold-bright transition-colors hover:bg-gold/10">
        {L("Share","साझा करें")}
      </button>
      {(imageUrl || makeImage) && (
        <button type="button" onClick={save} className="rounded-full border border-gold/50 px-4 py-2 text-xs font-semibold text-gold-bright transition-colors hover:bg-gold/10">
          {L("Save image","चित्र सहेजें")}
        </button>
      )}
      <span role="status" className="text-xs text-muted">
        {status}
      </span>
    </div>
  );
}
