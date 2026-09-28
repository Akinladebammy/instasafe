"use client";

import { ListChecks } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";

const LINKS = [{ href: "/dispatch", label: "My deliveries", icon: ListChecks }] as const;

export function DispatchNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Rider sections">
      <ul className="flex flex-wrap items-center gap-1.5">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dispatch"
              ? pathname === "/dispatch"
              : pathname.startsWith(href);

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                  active
                    ? "bg-blue-spruce-800 text-blue-spruce-50 dark:bg-blue-spruce-400 dark:text-blue-spruce-950"
                    : "text-ink-muted hover:bg-surface hover:text-ink",
                )}
              >
                <Icon size={18} aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
