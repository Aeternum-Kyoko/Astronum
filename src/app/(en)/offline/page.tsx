import type { Metadata } from "next";

export const metadata: Metadata = { title: "You're offline", robots: { index: false } };

export default function OfflinePage() {
  return (
    <section className="mx-auto max-w-md px-5 py-24 text-center">
      <p className="text-5xl" aria-hidden="true">
        ☾
      </p>
      <h1 className="mt-4 text-3xl font-bold text-cream">You&rsquo;re offline</h1>
      <p className="mt-3 text-muted">Pages you&rsquo;ve opened recently still work. Charts and new readings need a connection — they&rsquo;ll load as soon as you&rsquo;re back online.</p>
    </section>
  );
}
