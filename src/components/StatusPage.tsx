import Link from "next/link";

/** Shared layout for 404 and error pages. */
export default function StatusPage({
  code,
  title,
  body,
  links,
  action,
}: {
  code: string;
  title: string;
  body: string;
  links: { href: string; label: string }[];
  action?: React.ReactNode;
}) {
  return (
    <section className="relative">
      <div className="relative mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 py-20 text-center">
        <p className="font-display text-7xl text-gold-bright">{code}</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-cream">{title}</h1>
        <p className="mt-3 text-base leading-relaxed text-muted">{body}</p>
        {action}
        <nav aria-label="Helpful links" className="mt-8 flex flex-wrap justify-center gap-2">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-cream hover:border-gold hover:text-gold-bright">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
