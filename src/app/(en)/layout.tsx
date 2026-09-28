import type { Metadata, Viewport } from "next";
import { SiteBody, SiteHead } from "@/components/SiteShell";
import { anek } from "@/lib/fonts";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Astronum — Vedic Astrology & Kundali",
    template: "%s — Astronum",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  appleWebApp: { capable: true, title: "Astronum", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  openGraph: { type: "website", siteName: SITE_NAME, locale: "en_IN" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0e1733" },
    { media: "(prefers-color-scheme: light)", color: "#edefea" },
  ],
};

export default function EnglishRootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: THEME_INIT_SCRIPT sets data-theme on <html> before React hydrates.
    <html lang="en" className={`${anek.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <SiteHead />
      </head>
      <SiteBody locale="en">{children}</SiteBody>
    </html>
  );
}
