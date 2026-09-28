import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false } };

export default async function UnsubscribePage({ searchParams }: PageProps<"/unsubscribe">) {
  const { token, done } = await searchParams;
  return (
    <section className="mx-auto max-w-lg px-5 py-24 text-center">
      {done ? (
        <>
          <h1 className="text-3xl font-bold text-cream">You&rsquo;re unsubscribed</h1>
          <p className="mt-3 text-muted">You won&rsquo;t receive any more alert emails. You can turn them back on in your account at any time.</p>
          <Link href="/account" className="mt-6 inline-block text-sm font-semibold text-gold-bright hover:underline">
            Go to my account
          </Link>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold text-cream">Stop alert emails?</h1>
          <p className="mt-3 text-muted">This turns off the daily horoscope, dasha, transit and festival emails for your account.</p>
          <form method="post" action="/api/notifications/unsubscribe" className="mt-6">
            <input type="hidden" name="token" value={typeof token === "string" ? token : ""} />
            <button type="submit" className="rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-on-gold hover:bg-gold-bright">
              Unsubscribe from all alerts
            </button>
          </form>
        </>
      )}
    </section>
  );
}
