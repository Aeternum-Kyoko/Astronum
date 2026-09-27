import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import MotionProvider from "@/components/MotionProvider";
import JsonLd from "@/components/JsonLd";
import { THEME_INIT_SCRIPT } from "@/components/ThemeToggle";
import type { Locale } from "@/lib/i18n/locale";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

const SITE_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: SITE_URL, name: SITE_NAME, description: SITE_DESCRIPTION, inLanguage: ["en-IN", "hi-IN"] },
    { "@type": "Organization", "@id": `${SITE_URL}/#organization`, url: SITE_URL, name: SITE_NAME, logo: `${SITE_URL}/icon.svg` },
  ],
};

/** Everything inside <head> that both root layouts share. */
export function SiteHead() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      <JsonLd data={SITE_JSON_LD} />
    </>
  );
}

/** The page chrome around every page, in the layout's language. */
export function SiteBody({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <body className="min-h-full flex flex-col bg-ink pb-16 text-cream lg:pb-0 print:pb-0">
      <MotionProvider>
        <Header locale={locale} />
        <main className="flex-1">{children}</main>
        <Footer locale={locale} />
        <MobileTabBar locale={locale} />
      </MotionProvider>
    </body>
  );
}
