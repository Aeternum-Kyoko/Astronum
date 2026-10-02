import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { prisma } from "@/lib/db";
import { LEARN_LINKS } from "@/lib/nav";
import { SIGN_SLUGS } from "@/lib/astrology/horoscope";
import { FESTIVALS } from "@/lib/astrology/festivals";
import { absoluteUrl } from "@/lib/site";
import { hasHindiVersion } from "@/lib/i18n/locale";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Built per request, not at build time, so the build never needs a live database.
  await connection();

  const now = new Date();
  const year = now.getFullYear();
  // Pages with a Hindi version list both URLs as hreflang alternates.
  const page = (path: string, changeFrequency: "daily" | "weekly" | "monthly", priority: number) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency,
    priority,
    ...(hasHindiVersion(path)
      ? { alternates: { languages: { "en-IN": absoluteUrl(path), "hi-IN": absoluteUrl(path === "/" ? "/hi" : `/hi${path}`) } } }
      : {}),
  });

  const posts = await prisma.blogPost
    .findMany({ where: { published: true }, select: { slug: true, updatedAt: true } })
    .catch(() => []);

  const entries = [
    page("/", "daily", 1),
    page("/kundali", "monthly", 0.9),
    page("/matching", "monthly", 0.9),
    page("/panchang", "daily", 0.9),
    page("/panchang/month", "daily", 0.7),
    page("/horoscope", "daily", 0.9),
    page("/horoscope/personal", "monthly", 0.8),
    page("/rectification", "monthly", 0.7),
    page("/prashna", "monthly", 0.7),
    page("/baby-names", "monthly", 0.7),
    ...SIGN_SLUGS.map((slug) => page(`/horoscope/${slug}`, "daily", 0.8)),
    ...SIGN_SLUGS.flatMap((slug) => ["weekly", "monthly", "yearly"].map((p) => page(`/horoscope/${slug}/${p}`, "weekly", 0.7))),
    page("/numerology", "monthly", 0.7),
    page("/palmistry", "monthly", 0.7),
    page("/lo-shu", "monthly", 0.7),
    page("/rudraksha", "monthly", 0.7),
    page("/sade-sati", "monthly", 0.8),
    page("/nakshatra-finder", "monthly", 0.7),
    page("/varshphal", "monthly", 0.7),
    page("/muhurat", "weekly", 0.8),
    ...[year, year + 1].flatMap((y) => [
      page(`/festivals/${y}`, "weekly", 0.8),
      ...[...FESTIVALS.map((f) => f.slug), "makar-sankranti"].map((slug) => page(`/festivals/${y}/${slug}`, "monthly", 0.7)),
    ]),
    page("/learn", "monthly", 0.7),
    page("/learn/compatibility", "monthly", 0.7),
    ...LEARN_LINKS.map((l) => page(l.href, "monthly", 0.6)),
    page("/blog", "weekly", 0.7),
    ...posts.map((p) => ({ url: absoluteUrl(`/blog/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
    page("/about", "monthly", 0.5),
    page("/consultation", "monthly", 0.6),
  ];

  const hindi = entries
    .filter((e) => hasHindiVersion(new URL(e.url).pathname))
    .map((e) => {
      const path = new URL(e.url).pathname;
      return { ...e, url: absoluteUrl(path === "/" ? "/hi" : `/hi${path}`) };
    });
  return [...entries, ...hindi];
}
