import type { Metadata } from "next";
import StatusPage from "@/components/StatusPage";
import { SiteBody, SiteHead } from "@/components/SiteShell";
import { anek } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Page not found — Astronum",
  description: "The page you were looking for doesn't exist.",
};

/** 404 for URLs outside both root layouts; it renders its own document, so it brings the shell with it. */
export default function GlobalNotFound() {
  return (
    <html lang="en" className={`${anek.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <SiteHead />
      </head>
      <SiteBody locale="en">
        <StatusPage
          code="404"
          title="This page isn't in the stars"
          body="The page you were looking for doesn't exist or has moved. Here are some places to start instead."
          links={[
            { href: "/", label: "Home" },
            { href: "/kundali", label: "Free Kundli" },
            { href: "/horoscope", label: "Daily Horoscope" },
            { href: "/hi", label: "हिंदी" },
          ]}
        />
      </SiteBody>
    </html>
  );
}
