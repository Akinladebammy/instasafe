"use client";

import { motion, useReducedMotion } from "motion/react";
import { List, Package, X } from "@phosphor-icons/react";
import Link from "next/link";
import { type MouseEvent, useState } from "react";
import { BrandMark } from "@/components/brand-mark";

const navItems = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Security", href: "#security" },
  { label: "For vendors", href: "#outcomes" },
  { label: "Live demo", href: "#demo" },
];

/**
 * Buyers land here from a payment message and riders from a dispatch text, so
 * both routes get a persistent place in the header rather than being buried in
 * the footer.
 */
const utilityLinks = [
  { label: "Track your order", href: "/track" },
  { label: "Rider sign in", href: "/login?as=rider" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  const navigateToSection = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    if (!href.startsWith("#")) {
      setOpen(false);
      return;
    }

    const target = document.querySelector(href);
    if (!target) return;

    event.preventDefault();
    setOpen(false);
    window.history.pushState(null, "", href);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        target.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        });
      });
    });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas">
      <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between px-5 sm:px-8 lg:px-10">
        <a
          href="#top"
          aria-label="InstaSafe home"
          onClick={() => setOpen(false)}
        >
          <BrandMark />
        </a>

        <nav aria-label="Primary navigation" className="hidden min-[900px]:block">
          <ul className="flex items-center gap-5 min-[1100px]:gap-7">
            {navItems.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={(event) => navigateToSection(event, item.href)}
                  className="text-sm font-medium text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/track"
            onClick={(event) => navigateToSection(event, "/track")}
            className="mr-1 hidden min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-ink-muted transition-colors hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus min-[900px]:inline-flex"
          >
            <Package size={17} aria-hidden="true" />
            Track order
          </Link>

          <div className="hidden min-[900px]:flex min-[900px]:flex-col min-[900px]:items-stretch min-[1100px]:flex-row min-[1100px]:items-center min-[1100px]:gap-2">
            <a
              href="/login"
              onClick={(event) => navigateToSection(event, "/login")}
              className="inline-flex min-h-8 items-center justify-center rounded-lg border border-line bg-surface px-3 text-xs font-semibold text-ink transition-colors hover:border-ash-grey-400 hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:translate-y-px min-[1100px]:min-h-11 min-[1100px]:rounded-xl min-[1100px]:px-4 min-[1100px]:text-sm"
            >
              Log in
            </a>
            <a
              href="/signup"
              onClick={(event) => navigateToSection(event, "/signup")}
              className="inline-flex min-h-8 items-center justify-center rounded-lg bg-blue-spruce-800 px-3 text-xs font-semibold text-blue-spruce-50 transition-[transform,background-color] hover:bg-blue-spruce-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:translate-y-px min-[1100px]:min-h-11 min-[1100px]:rounded-xl min-[1100px]:px-4 min-[1100px]:text-sm"
            >
              Sign up
            </a>
          </div>

          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? "Close navigation" : "Open navigation"}
            onClick={() => setOpen((current) => !current)}
            className="grid h-11 w-11 place-items-center rounded-xl border border-line text-ink transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus min-[900px]:hidden"
          >
            {open ? <X size={22} aria-hidden="true" /> : <List size={22} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open ? (
        <motion.nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          initial={reduceMotion ? false : { height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden border-t border-line bg-canvas min-[900px]:hidden"
        >
          <div className="grid gap-2 border-b border-line px-5 py-4">
            <a
              href="/signup"
              onClick={(event) => navigateToSection(event, "/signup")}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-blue-spruce-800 px-4 text-sm font-semibold text-blue-spruce-50 transition-[transform,background-color] hover:bg-blue-spruce-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:translate-y-px"
            >
              Sign up
            </a>
            <a
              href="/login"
              onClick={(event) => navigateToSection(event, "/login")}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              Log in
            </a>
          </div>

          <ul className="space-y-1 px-5 py-4">
            {navItems.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={(event) => navigateToSection(event, item.href)}
                  className="block rounded-xl px-3 py-3 text-base font-medium text-ink transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="border-t border-line px-5 py-4">
            <p className="px-3 pb-2 text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase">
              Already have something?
            </p>
            <ul className="space-y-1">
              {utilityLinks.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={(event) => navigateToSection(event, item.href)}
                    className="block rounded-xl px-3 py-3 text-base font-medium text-ink transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </motion.nav>
      ) : null}
    </header>
  );
}
