import type { Metadata } from "next";
import GlossaryExplorer from "@/components/learn/GlossaryExplorer";

export const metadata: Metadata = {
  title: "Glossary",
  description: "Sanskrit and technical Jyotish terms used across the site, defined plainly.",
};

export default function GlossaryLearnPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 md:py-20">
      <div className="text-center">
        <p className="text-sm font-medium tracking-[0.2em] text-gold-bright uppercase">Reference</p>
        <h1 className="mt-3 font-display text-3xl text-cream md:text-4xl">Glossary</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          Sanskrit and technical terms used throughout this site, defined plainly.
        </p>
      </div>
      <div className="mt-12">
        <GlossaryExplorer />
      </div>
    </section>
  );
}
