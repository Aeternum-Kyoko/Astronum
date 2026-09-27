import { BUSINESS } from "@/lib/legal";

/** Frame for the legal pages, with a visible draft notice until BUSINESS.reviewed is set. */
export default function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-5 py-14 md:py-20">
      {!BUSINESS.reviewed && (
        <p role="note" className="mb-8 rounded-xl border border-rose/40 bg-rose/5 px-4 py-3 text-sm text-rose">
          Draft template — the bracketed details still need filling in, and this page should be reviewed by a qualified
          person before it is relied on.
        </p>
      )}
      <h1 className="font-display text-4xl text-cream">{title}</h1>
      <p className="mt-2 text-sm text-muted">Last updated: {BUSINESS.lastUpdated}</p>
      <div className="prose prose-invert mt-8 max-w-none prose-headings:font-display prose-headings:text-cream prose-a:text-gold-bright prose-strong:text-cream prose-p:text-muted prose-li:text-muted">
        {children}
      </div>
    </article>
  );
}
