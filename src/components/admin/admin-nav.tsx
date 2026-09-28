"use client";

import {
  ChartBar,
  ChatCircleDots,
  Gavel,
  ListChecks,
  ShieldCheck,
  Storefront,
  Truck,
  WebhooksLogo,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/admin", label: "Overview", icon: ChartBar },
  { href: "/admin/disputes", label: "Disputes", icon: Gavel },
  { href: "/admin/orders", label: "Orders", icon: ListChecks },
  { href: "/admin/vendors", label: "Vendors", icon: Storefront },
  { href: "/admin/dispatchers", label: "Riders", icon: Truck },
  { href: "/admin/chats", label: "Messages", icon: ChatCircleDots },
  { href: "/admin/webhooks", label: "Webhooks", icon: WebhooksLogo },
  { href: "/admin/audit", label: "Audit", icon: ShieldCheck },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Console sections">
      <ul className="flex flex-wrap items-center gap-1.5">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/admin"
              ? pathname === "/admin"
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
