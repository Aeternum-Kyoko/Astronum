import type { Metadata } from "next";
import YogasExplorer from "@/components/learn/YogasExplorer";

export const metadata: Metadata = {
  title: "Yogas & Doshas",
  description: "A classical yoga and dosha glossary — which combinations this site's engine detects on a real chart, and which are reference-only.",
};

export default function YogasLearnPage() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-16 md:py-20">
      <div className="text-center">
        <p className="text-sm font-medium tracking-[0.2em] text-gold-bright uppercase">Reference</p>
        <h1 className="mt-3 font-display text-3xl text-cream md:text-4xl">Yogas &amp; Doshas</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          Classical planetary combinations, from the auspicious to the challenging. Entries marked{" "}
          <span className="text-gold-bright">Detected on your chart</span> are actually computed by this site&rsquo;s
          engine — the rest are reference-only.
        </p>
      </div>
      <div className="mt-12">
        <YogasExplorer />
      </div>
    </section>
  );
}
