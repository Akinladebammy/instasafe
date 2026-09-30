 "use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  ChatCircleDots,
  Check,
  CheckCircle,
  ShieldCheck,
} from "@phosphor-icons/react";
import { useState } from "react";
import { Reveal } from "@/components/reveal";
import { cn } from "@/lib/cn";
import { botChatUrl } from "@/lib/whatsapp";
type DemoState = "message" | "parsed" | "confirmed";

const formattedAmount = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
}).format(45000);

const orderDetails = [
  ["Customer", "Chidi Okafor"],
  ["Phone", "0801 234 5678"],
  ["Item", "2 pairs of sneakers"],
  ["Amount", formattedAmount],
  ["Delivery", "Lekki, Lagos"],
];

export function WhatsappDemo() {
  const [demoState, setDemoState] = useState<DemoState>("message");
  const reduceMotion = useReducedMotion();
  const liveUrl = botChatUrl();

  return (
    <section id="demo" className="scroll-mt-[88px] border-b border-line bg-canvas py-24 sm:py-28 lg:py-36">
      <div className="mx-auto grid max-w-[1400px] gap-16 px-5 sm:px-8 lg:grid-cols-12 lg:items-center lg:gap-14 lg:px-10">
        <Reveal className="lg:col-span-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            Try the product flow
          </p>
          <h2 className="mt-6 text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-ink sm:text-5xl lg:text-6xl">
            A normal message becomes a protected order.
          </h2>
          <p className="mt-6 max-w-[540px] text-lg leading-8 text-ink-muted">
            The vendor does not learn a new form. InstaSafe turns the message into a
            confirmable order before any payment link is created.
          </p>
          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-line bg-surface p-4">
            <ShieldCheck size={22} weight="duotone" className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
            <p className="text-sm leading-6 text-ink-muted">
              This prototype previews the interaction. It does not create a real order or
              move money.
            </p>
          </div>
          {liveUrl ? (
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener"
              className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-shamrock-400 px-5 py-3 text-sm font-semibold text-blue-spruce-950 transition-[transform,background-color] hover:bg-shamrock-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:translate-y-px"
            >
              Try it live on WhatsApp
              <ArrowRight size={18} weight="bold" aria-hidden="true" />
            </a>
          ) : null}
        </Reveal>

        <Reveal className="lg:col-span-7 lg:pl-8" delay={0.1} distance={30}>
          <div className="mx-auto max-w-[620px] overflow-hidden rounded-[28px] border border-line bg-surface shadow-ledger">
            <div className="flex items-center justify-between border-b border-line bg-blue-spruce-950 px-5 py-4 text-blue-spruce-50 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-shamrock-400 text-blue-spruce-950">
                  <ChatCircleDots size={21} weight="fill" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold">InstaSafe Orders</p>
                  <p className="text-xs text-blue-spruce-300">WhatsApp concierge</p>
                </div>
              </div>
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-blue-spruce-300">
                Demo
              </span>
            </div>

            <div className="min-h-[500px] bg-blue-spruce-50 p-4 sm:p-6 dark:bg-blue-spruce-900">
              <div className="ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-blue-spruce-800 px-4 py-3 text-sm leading-6 text-blue-spruce-50 shadow-sm">
                Order: 2 pairs of sneakers for Chidi, 08012345678, Lekki, ₦45,000
              </div>

              <AnimatePresence mode="wait" initial={false}>
                {demoState === "message" ? (
                  <motion.div
                    key="message"
                    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                    transition={{ duration: reduceMotion ? 0 : 0.22 }}
                    className="mt-8"
                  >
                    <p className="max-w-[420px] text-sm leading-6 text-ink-muted">
                      Preview how Groq turns a vendor message into the fields required for
                      payment and delivery.
                    </p>
                    <button
                      type="button"
                      onClick={() => setDemoState("parsed")}
                      className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-spruce-800 px-5 text-sm font-semibold text-blue-spruce-50 transition-[transform,background-color] hover:bg-blue-spruce-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:translate-y-px"
                    >
                      Preview structured order
                      <ArrowRight size={18} weight="bold" aria-hidden="true" />
                    </button>
                  </motion.div>
                ) : null}

                {demoState === "parsed" ? (
                  <motion.div
                    key="parsed"
                    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                    transition={{ duration: reduceMotion ? 0 : 0.22 }}
                    className="mt-7"
                  >
                    <div className="max-w-[500px] rounded-2xl rounded-bl-md border border-line bg-ash-grey-50 p-4 shadow-sm dark:bg-blue-spruce-950 sm:p-5">
                      <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
                            Order ready
                          </p>
                          <p className="mt-1 font-mono text-xs text-ink-muted">IS-2407</p>
                        </div>
                        <span className="rounded-full bg-shamrock-100 px-3 py-1.5 text-xs font-semibold text-shamrock-800 dark:bg-shamrock-900 dark:text-shamrock-200">
                          5 fields found
                        </span>
                      </div>
                      <dl className="mt-2 divide-y divide-line">
                        {orderDetails.map(([label, value]) => (
                          <div key={label} className="grid grid-cols-[92px_1fr] gap-3 py-3 text-sm">
                            <dt className="text-ink-muted">{label}</dt>
                            <dd className="font-medium text-ink">{value}</dd>
                          </div>
                        ))}
                      </dl>
                      <button
                        type="button"
                        onClick={() => setDemoState("confirmed")}
                        className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-spruce-800 px-5 text-sm font-semibold text-blue-spruce-50 transition-[transform,background-color] hover:bg-blue-spruce-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:translate-y-px"
                      >
                        Confirm order
                        <Check size={18} weight="bold" aria-hidden="true" />
                      </button>
                    </div>
                  </motion.div>
                ) : null}

                {demoState === "confirmed" ? (
                  <motion.div
                    key="confirmed"
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                    transition={{ duration: reduceMotion ? 0 : 0.24 }}
                    className="mt-7 max-w-[500px] rounded-2xl rounded-bl-md border border-shamrock-300 bg-shamrock-50 p-5 shadow-sm dark:border-shamrock-800 dark:bg-shamrock-950"
                    aria-live="polite"
                  >
                    <div className="flex gap-4">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-shamrock-600 text-shamrock-50">
                        <CheckCircle size={23} weight="fill" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="text-base font-semibold tracking-[-0.02em] text-shamrock-950 dark:text-shamrock-100">
                          Order confirmed
                        </h3>
                        <p className="mt-1.5 text-sm leading-6 text-shamrock-900 dark:text-shamrock-200">
                          A secure buyer payment link is now ready to send. In production,
                          this is where Paystack transaction initialization begins.
                        </p>
                        <button
                          type="button"
                          onClick={() => setDemoState("message")}
                          className={cn(
                            "mt-5 text-sm font-semibold text-shamrock-800 underline decoration-shamrock-400 underline-offset-4 hover:text-shamrock-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus dark:text-shamrock-200 dark:hover:text-shamrock-50",
                          )}
                        >
                          Reset preview
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
