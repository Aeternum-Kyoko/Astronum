import Link from "next/link";
import QuickKundaliForm from "@/components/QuickKundaliForm";
import { getDictionary } from "@/lib/i18n/dictionary";
import { fromBirthQuery, type BirthParams } from "@/lib/birthParams";

type RawParams = Record<string, string | string[] | undefined>;

/** Birth details from a tool page's search params, or null to show the form. */
export function birthFromParams(params: RawParams): BirthParams | null {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (typeof v === "string") q.set(k, v);
  return fromBirthQuery(q);
}

/** Shared frame for birth-detail tools: a header, then the form or the result. */
export default function ToolShell({
  eyebrow,
  title,
  intro,
  path,
  submit,
  birth,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  path: string;
  submit: string;
  birth: BirthParams | null;
  children?: React.ReactNode;
}) {
  const form = getDictionary("en").home.form;
  return (
    <section className="relative">
      <div className="relative mx-auto max-w-5xl px-5 py-14 md:py-20">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-gold-bright">{eyebrow}</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-cream md:text-5xl">{title}</h1>
          <p className="mt-4 text-base leading-relaxed text-muted">{intro}</p>
        </header>
        {birth ? (
          <div className="mt-10">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-surface/60 px-5 py-3 text-sm">
              <span className="text-muted">
                <span className="font-semibold text-cream">{birth.name}</span> · {birth.date} · {birth.time} · {birth.place}
              </span>
              <Link href={path} className="text-xs font-semibold text-gold-bright hover:text-gold">
                Change details
              </Link>
            </div>
            {children}
          </div>
        ) : (
          <div className="mx-auto mt-10 max-w-md">
            <QuickKundaliForm copy={{ ...form, title, subtitle: "Enter the birth details.", submit }} target={path} />
          </div>
        )}
      </div>
    </section>
  );
}
