"use client";

import { Storefront, Truck } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { DispatchLoginForm } from "@/components/dispatch/dispatch-login-form";
import { LoginForm } from "@/components/auth/login-form";
import { cn } from "@/lib/cn";

export type SignInRole = "vendor" | "rider";

const ROLES = [
  {
    key: "vendor" as const,
    label: "I'm a vendor",
    icon: Storefront,
    eyebrow: "Vendor access",
    title: "Welcome back.",
    description:
      "Log in with the email or phone number on your vendor profile. Lost your password? Use a WhatsApp recovery code instead.",
  },
  {
    key: "rider" as const,
    label: "I'm a rider",
    icon: Truck,
    eyebrow: "Rider access",
    title: "Delivery runs.",
    description:
      "Sign in with the number your vendor booked you with. We text a one-time code to WhatsApp — no password, no account.",
  },
];

const linkClass =
  "inline-block rounded py-1 font-semibold text-brand underline decoration-blue-spruce-300 underline-offset-4 hover:text-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/**
 * One sign-in page for two very different jobs.
 *
 * A separate "choose your role" page would add a click for every vendor, who are
 * the primary audience, so the switcher sits above the form instead. Both forms
 * stay mounted and the inactive one is `hidden`, so switching roles mid-entry
 * does not throw away a half-typed email or a code that just arrived.
 */
export function SignInScreen({
  initialRole = "vendor",
  initialLoginId = "",
  initialPhone = "",
}: {
  initialRole?: SignInRole;
  initialLoginId?: string;
  initialPhone?: string;
}) {
  const [role, setRole] = useState<SignInRole>(initialRole);
  const active = ROLES.find((entry) => entry.key === role) ?? ROLES[0];

  return (
    <AuthShell
      eyebrow={active.eyebrow}
      title={active.title}
      description={active.description}
      footer={
        role === "vendor" ? (
          <div className="space-y-2.5">
            <p>
              New to InstaSafe?{" "}
              <Link href="/signup" className={linkClass}>
                Create a vendor account
              </Link>
            </p>
            <p className="text-sm text-ink-muted">
              Bought something?{" "}
              <Link href="/track" className={linkClass}>
                Track your order
              </Link>
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            <p>
              Buying something instead?{" "}
              <Link href="/track" className={linkClass}>
                Track your order
              </Link>
            </p>
            <p className="text-sm text-ink-muted">
              Selling on InstaSafe instead?{" "}
              <Link href="/login" className={linkClass}>
                Vendor log in
              </Link>
            </p>
          </div>
        )
      }
    >
      <div
        role="group"
        aria-label="Who are you signing in as?"
        className="mb-7 grid grid-cols-2 gap-1 rounded-xl bg-surface p-1"
      >
        {ROLES.map(({ key, label, icon: Icon }) => {
          const selected = key === role;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={selected}
              onClick={() => setRole(key)}
              className={cn(
                "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                selected
                  ? "bg-canvas text-ink shadow-sm"
                  : "text-ink-muted hover:text-ink",
              )}
            >
              <Icon size={17} aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>

      <div hidden={role !== "vendor"}>
        <LoginForm
          initialLoginId={initialLoginId}
          // The vendor form is mounted for the rider tab too, so pass a number
          // that is never valid to keep the two flows independent.
          initialPhone={role === "vendor" ? initialPhone : ""}
        />
      </div>

      <div hidden={role !== "rider"}>
        <DispatchLoginForm initialPhone={role === "rider" ? initialPhone : ""} />
      </div>
    </AuthShell>
  );
}
