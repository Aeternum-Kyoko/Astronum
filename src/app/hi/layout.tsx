import type { Metadata } from "next";
import { SiteBody, SiteHead } from "@/components/SiteShell";
import { anek, anekDevanagari } from "@/lib/fonts";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Astronum — वैदिक ज्योतिष, कुंडली, राशिफल और पंचांग",
    template: "%s — Astronum",
  },
  description: "फ्री वैदिक कुंडली, कुंडली मिलान, आज का पंचांग और दैनिक राशिफल — असली खगोल गणना और लाहिड़ी अयनांश पर आधारित।",
  applicationName: SITE_NAME,
  openGraph: { type: "website", siteName: SITE_NAME, locale: "hi_IN" },
  twitter: { card: "summary_large_image" },
};

export default function HindiRootLayout({ children }: LayoutProps<"/hi">) {
  return (
    <html
      lang="hi"
      className={`${anek.variable} ${anekDevanagari.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <SiteHead />
      </head>
      <SiteBody locale="hi">{children}</SiteBody>
    </html>
  );
}
