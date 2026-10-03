import Link from "next/link";
import QuickKundaliForm from "@/components/QuickKundaliForm";
import { getDictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locale";
import { fromBirthQuery, toBirthQuery, type BirthParams } from "@/lib/birthParams";
import { getProfiles } from "@/lib/profiles";

type RawParams = Record<string, string | string[] | undefined>;

/** Birth details from a tool page's search params, or null to show the form. */
export function birthFromParams(params: RawParams): BirthParams | null {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (typeof v === "string") q.set(k, v);
  return fromBirthQuery(q);
}

/** Shared frame for birth-detail tools: a header, then the form or the result. */
export default async function ToolShell({
  eyebrow,
  title,
  intro,
  path,
  submit,
  birth,
  children,
  locale = "en",
}: {
  eyebrow: string;
  title: string;
  intro: string;
  path: string;
  submit: string;
  birth: BirthParams | null;
  children?: React.ReactNode;
  locale?: Locale;
}) {
  const hi = locale === "hi";
  const form = getDictionary(locale).home.form;
  const profiles = birth ? [] : await getProfiles();
  return (
    <section className="relative">
      <div className={`relative mx-auto max-w-5xl px-5 ${birth ? "py-8 md:py-14" : "py-14 md:py-20"}`}>
        {birth ? (
          // With a result on screen, the page title steps back so the reading comes first.
          <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-border/50 pb-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-cream md:text-3xl">{eyebrow}</h1>
              <p className="mt-1 text-sm text-muted">
                {[birth.name, birth.date, birth.time, birth.place].filter(Boolean).join(", ")}
              </p>
            </div>
            <Link href={path} className="text-sm font-semibold text-cream underline decoration-gold/60 underline-offset-4 hover:decoration-gold">
              {hi ? "विवरण बदलें" : "Change details"}
            </Link>
          </header>
        ) : (
          <header className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-gold-bright">{eyebrow}</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-cream md:text-5xl">{title}</h1>
            <p className="mt-4 text-base leading-relaxed text-muted">{intro}</p>
          </header>
        )}
        {birth ? (
          <div className="mt-8">{children}</div>
        ) : (
          <div className="mx-auto mt-10 max-w-md">
            {profiles.length > 0 && (
              <div className="mb-6 text-center">
                <p className="text-xs font-semibold text-muted">{hi ? "सहेजी गई प्रोफ़ाइल चुनें" : "Use a saved profile"}</p>
                <ul className="mt-2 flex flex-wrap justify-center gap-2">
                  {profiles.map((p) => (
                    <li key={p.id}>
                      <Link href={`${path}?${toBirthQuery(p)}`} className={`inline-block rounded-full border px-4 py-2 text-sm font-semibold ${p.isDefault ? "border-gold bg-gold text-on-gold" : "border-border text-cream hover:border-gold"}`}>
                        {p.name} <span className={`text-xs font-normal ${p.isDefault ? "" : "text-muted"}`}>· {p.relation}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-muted">{hi ? "या नया विवरण भरें" : "or enter new details"}</p>
              </div>
            )}
            <QuickKundaliForm copy={{ ...form, title, subtitle: hi ? "जन्म विवरण भरें।" : "Enter the birth details.", submit }} target={path} />
          </div>
        )}
      </div>
    </section>
  );
}
