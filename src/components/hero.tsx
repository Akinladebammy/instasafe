import { ArrowDown, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { TransactionPreview } from "@/components/transaction-preview";
import { botChatUrl } from "@/lib/whatsapp";

export function Hero() {
  const liveUrl = botChatUrl();
  return (
    <section id="top" className="relative overflow-hidden border-b border-line">
      <div aria-hidden="true" className="ledger-grid absolute inset-0 opacity-45" />
      <div
        aria-hidden="true"
        className="absolute -right-24 top-20 h-80 w-80 rounded-full border border-blue-spruce-300/35"
      />
      <div className="relative mx-auto grid max-w-[1400px] gap-16 px-5 pb-20 pt-20 sm:px-8 sm:pt-24 lg:grid-cols-12 lg:items-center lg:gap-10 lg:px-10 lg:pb-24 lg:pt-24">
        <Reveal className="lg:col-span-7 lg:pr-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            Protected payments for social commerce
          </p>
          <h1 className="mt-6 max-w-[760px] text-[clamp(2.75rem,5.4vw,4.9rem)] font-semibold leading-[0.98] tracking-[-0.065em] text-ink">
            Sell on <span translate="no">WhatsApp.</span>{" "}
            <span className="block text-brand" translate="no">
              Get paid on delivery.
            </span>
          </h1>
          <p className="mt-7 max-w-[620px] text-lg leading-8 text-ink-muted sm:text-xl">
            InstaSafe holds buyer funds until a one-time delivery check confirms
            the order.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href="#demo"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-spruce-800 px-5 py-3 text-sm font-semibold text-blue-spruce-50 transition-[transform,background-color] hover:bg-blue-spruce-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:translate-y-px"
            >
              Try the flow
              <ArrowRight size={18} weight="bold" aria-hidden="true" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-ash-grey-400 hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              See how it works
              <ArrowDown size={18} weight="bold" aria-hidden="true" />
            </a>
          </div>
          {liveUrl ? (
            <p className="mt-4 text-sm text-ink-muted">
              Already selling with us?{" "}
              <a
                href={liveUrl}
                target="_blank"
                rel="noopener"
                className="font-semibold text-brand underline decoration-blue-spruce-300 underline-offset-4 transition-colors hover:text-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                Continue with the bot on WhatsApp
              </a>
            </p>
          ) : null}

          {/* Buyers reach the site from a payment message, often long after the
              vendor shared it. Keep tracking one click from the hero. */}
          <div className="mt-7 flex flex-wrap items-center gap-x-2 gap-y-3 border-t border-line pt-6 text-sm text-ink-muted">
            <span>Bought something and want to check it?</span>
            <Link
              href="/track"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg font-semibold text-brand underline decoration-blue-spruce-300 underline-offset-4 transition-colors hover:text-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              Track your order
              <ArrowRight size={15} weight="bold" aria-hidden="true" />
            </Link>
            <span aria-hidden="true" className="text-ink-muted/50">
              ·
            </span>
            <span>Delivering for a vendor?</span>
            <Link
              href="/login?as=rider"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg font-semibold text-brand underline decoration-blue-spruce-300 underline-offset-4 transition-colors hover:text-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              Rider sign in
              <ArrowRight size={15} weight="bold" aria-hidden="true" />
            </Link>
          </div>
        </Reveal>

        <Reveal className="lg:col-span-5 lg:pl-4" delay={0.12} distance={30}>
          <TransactionPreview />
        </Reveal>
      </div>
    </section>
  );
}
