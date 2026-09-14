"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "motion/react";
import MoonMark from "@/components/MoonMark";

const NAV_LINKS = [
  { href: "/kundali", label: "Free Kundali" },
  { href: "/learn", label: "Learn" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/consultation", label: "Consultation" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const lastY = useRef(0);
  const { scrollY } = useScroll();
  const pathname = usePathname();

  useMotionValueEvent(scrollY, "change", (y) => {
    if (open) return;
    const goingDown = y > lastY.current;
    setHidden(goingDown && y > 120);
    lastY.current = y;
  });

  return (
    <motion.header
      animate={{ y: hidden ? "-100%" : "0%" }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-50 border-b border-border/60 bg-ink-deep/85 backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <MoonMark />
          <span className="font-display text-xl tracking-wide text-cream">
            Astro<span className="text-gradient-gold">num</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" onMouseLeave={() => setHovered(null)}>
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                onMouseEnter={() => setHovered(link.href)}
                className="relative px-3.5 py-2 text-sm text-muted transition-colors hover:text-gold-bright"
              >
                <span className={isActive ? "text-cream" : ""}>{link.label}</span>
                {(hovered === link.href || (!hovered && isActive)) && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-3.5 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-gold-bright to-transparent"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
              </Link>
            );
          })}
          <Link
            href="/kundali"
            className="btn-shimmer ml-3 rounded-full bg-gold px-5 py-2 text-sm font-medium text-ink-deep transition-colors hover:bg-gold-bright"
          >
            Generate Kundali
          </Link>
        </nav>

        <button
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-cream md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
            <path d="M1 1h16M1 7h16M1 13h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-1 overflow-hidden border-t border-border/60 px-5 md:hidden"
          >
            <div className="flex flex-col gap-1 py-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-2.5 text-sm text-muted hover:bg-surface hover:text-gold-bright"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/kundali"
                className="mt-2 rounded-full bg-gold px-5 py-2.5 text-center text-sm font-medium text-ink-deep"
                onClick={() => setOpen(false)}
              >
                Generate Kundali
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
