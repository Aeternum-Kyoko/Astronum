import Link from "next/link";

export default function LearnPageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <Link href="/learn" className="text-xs font-semibold tracking-[0.2em] text-gold-bright uppercase hover:text-gold">
        ← Learn
      </Link>
      <p className="mt-4 text-sm font-medium tracking-[0.2em] text-gold-bright uppercase">{eyebrow}</p>
      <h1 className="mt-3 font-display text-3xl text-cream md:text-4xl">{title}</h1>
      <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted">{description}</p>
    </div>
  );
}
