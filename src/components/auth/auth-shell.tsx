import Link from "next/link";
import {
  ChatCircleDots,
  CheckCircle,
  CreditCard,
  Package,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand-mark";
import { Reveal } from "@/components/reveal";

const journey = [
  { icon: ChatCircleDots, label: "Order received", detail: "WhatsApp" },
  { icon: CreditCard, label: "Payment protected", detail: "Paystack" },
  { icon: Package, label: "Delivery verified", detail: "One-time code" },
  { icon: CheckCircle, label: "Vendor paid", detail: "Payout initiated" },
];

type AuthShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthShell({
  eyebrow = "Vendor access",
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  const year = new Date().getFullYear();

  return (
    <main id="main-content" className="min-h-[100dvh] bg-canvas">
      <div className="grid min-h-[100dvh] lg:grid-cols-[minmax(0,1.05fr)_minmax(520px,0.75fr)]">
        <aside
          aria-labelledby="auth-trust-title"
          className="relative hidden overflow-hidden bg-blue-spruce-950 px-10 py-9 text-blue-spruce-50 lg:flex lg:flex-col xl:px-16 xl:py-12"
        >
          <div aria-hidden="true" className="hairline-grid absolute inset-0 opacity-25" />
          <div
            aria-hidden="true"
            className="absolute -right-40 top-1/4 h-[520px] w-[520px] rounded-full border border-blue-spruce-700"
          />

          <div className="relative">
            <Link
              href="/"
              aria-label="InstaSafe home"
              className="inline-flex min-h-11 items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
            >
              <BrandMark inverted />
            </Link>
          </div>

          <Reveal className="relative my-auto max-w-[660px] py-16" distance={30}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-spruce-300">
              Vendor trust workspace
            </p>
            <p
              id="auth-trust-title"
              className="mt-6 text-5xl font-semibold leading-[0.98] tracking-[-0.055em] xl:text-6xl"
            >
              A protected sale starts with a trusted vendor.
            </p>
            <p className="mt-6 max-w-[560px] text-lg leading-8 text-blue-spruce-200">
              Access the workspace where social orders become protected payments and
              delivery-confirmed payouts.
            </p>

            <div className="mt-12 max-w-[580px] border-t border-blue-spruce-800">
              {journey.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="grid grid-cols-[44px_1fr_auto] items-center gap-4 border-b border-blue-spruce-800 py-4"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-xl border border-blue-spruce-700 bg-blue-spruce-900 text-blue-spruce-300">
                      <Icon size={19} weight="duotone" aria-hidden="true" />
                    </span>
                    <p className="text-sm font-semibold text-blue-spruce-50">
                      {item.label}
                    </p>
                    <div className="text-right">
                      <p className="font-mono text-[11px] text-blue-spruce-300">
                        0{index + 1}
                      </p>
                      <p className="mt-0.5 text-xs text-blue-spruce-400">{item.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Reveal>

          <div className="relative flex items-center gap-3 text-sm text-blue-spruce-300">
            <ShieldCheck size={20} weight="duotone" aria-hidden="true" />
            Payment release remains server-authoritative.
          </div>
        </aside>

        <section
          aria-labelledby="auth-page-title"
          className="flex min-h-[100dvh] flex-col px-5 py-6 sm:px-10 lg:px-14 xl:px-20"
        >
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              aria-label="InstaSafe home"
              className="inline-flex min-h-11 items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus lg:hidden"
            >
              <BrandMark />
            </Link>
            <Link
              href="/"
              className="ml-auto rounded-xl px-3 py-2 text-sm font-semibold text-ink-muted transition-colors hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              Back to site
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-center py-12 sm:py-16">
            <Reveal className="w-full max-w-[460px]" distance={26}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                  {eyebrow}
                </p>
                <h1
                  id="auth-page-title"
                  className="mt-5 text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-ink sm:text-5xl"
                >
                  {title}
                </h1>
                <p className="mt-4 text-base leading-7 text-ink-muted">{description}</p>
              </div>

              <div className="mt-9">{children}</div>

              <div className="mt-8 border-t border-line pt-6 text-sm leading-6 text-ink-muted">
                {footer}
              </div>
            </Reveal>
          </div>

          <p className="text-center text-xs leading-5 text-ink-muted">
            © {year} InstaSafe. Payment protection, not a bank deposit.
          </p>
        </section>
      </div>
    </main>
  );
}
