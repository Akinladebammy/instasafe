"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  CheckCircle,
  ChatCircleText,
  CreditCard,
  Package,
  ShieldCheck,
} from "@phosphor-icons/react";
import { useState } from "react";
import { cn } from "@/lib/cn";

const formattedAmount = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
}).format(45000);

const stages = [
  {
    label: "Protected",
    title: "Payment secured",
    detail: "Paystack confirms the buyer payment. Vendor payout stays pending.",
    icon: ShieldCheck,
  },
  {
    label: "Delivered",
    title: "Delivery code entered",
    detail: "The rider submits the buyer’s one-time delivery code.",
    icon: Package,
  },
  {
    label: "Released",
    title: "Vendor payout initiated",
    detail: "InstaSafe releases the transfer after server-side verification.",
    icon: CheckCircle,
  },
];

export function TransactionPreview() {
  const [activeStage, setActiveStage] = useState(0);
  const reduceMotion = useReducedMotion();
  const stage = stages[activeStage];
  const StageIcon = stage.icon;

  return (
    <div className="relative mx-auto w-full max-w-[520px] lg:mr-0">
      <div
        aria-hidden="true"
        className="absolute -inset-3 -z-10 rounded-[32px] border border-blue-spruce-300/45"
      />
      <div className="overflow-hidden rounded-[28px] border border-blue-spruce-800 bg-blue-spruce-950 text-blue-spruce-50 shadow-ledger">
        <div className="flex items-center justify-between border-b border-blue-spruce-800 px-5 py-4 sm:px-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-blue-spruce-300">
              Protected order
            </p>
            <p className="mt-1 font-mono text-sm text-blue-spruce-100">IS-2407</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-shamrock-400/35 bg-shamrock-400/10 px-3 py-1.5 text-xs font-semibold text-shamrock-200">
            <span className="h-1.5 w-1.5 rounded-full bg-shamrock-300" />
            Live journey
          </span>
        </div>

        <div className="px-5 py-6 sm:px-6 sm:py-7">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-sm text-blue-spruce-200">2 pairs of sneakers</p>
              <p className="mt-1 text-sm text-blue-spruce-300">For Chidi · Lekki</p>
            </div>
            <div className="text-right">
              <p
                translate="no"
                className="font-mono text-2xl font-semibold tracking-[-0.04em]"
              >
                {formattedAmount}
              </p>
              <p className="mt-1 text-xs text-blue-spruce-300">Paystack payment</p>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-3 gap-2" aria-label="Transaction progress">
            {stages.map((item, index) => {
              const Icon = item.icon;
              const active = index <= activeStage;
              return (
                <div key={item.label}>
                  <div className="relative mb-3 h-1.5 overflow-hidden rounded-full bg-blue-spruce-900">
                    <div
                      className={cn(
                        "h-full rounded-full bg-blue-spruce-400 transition-transform duration-500",
                        active ? "scale-x-100" : "scale-x-0",
                      )}
                      style={{ transformOrigin: "left" }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "grid h-7 w-7 place-items-center rounded-full border",
                        active
                          ? "border-blue-spruce-300 bg-blue-spruce-300 text-blue-spruce-950"
                          : "border-blue-spruce-700 text-blue-spruce-400",
                      )}
                    >
                      <Icon size={14} weight="bold" aria-hidden="true" />
                    </span>
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        active ? "text-blue-spruce-50" : "text-blue-spruce-400",
                      )}
                    >
                      {item.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            aria-live="polite"
            aria-atomic="true"
            className="mt-7 min-h-[148px] rounded-2xl border border-blue-spruce-800 bg-blue-spruce-900/70 p-5"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={stage.title}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: reduceMotion ? 0 : 0.24 }}
                className="flex gap-4"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-spruce-800 text-blue-spruce-200">
                  <StageIcon size={21} weight="duotone" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-base font-semibold tracking-[-0.02em]">
                    {stage.title}
                  </h2>
                  <p className="mt-1.5 text-sm leading-6 text-blue-spruce-200">
                    {stage.detail}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-5 flex items-center gap-3 border-t border-blue-spruce-800 pt-5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-shamrock-400 text-blue-spruce-950">
              {activeStage === 0 ? (
                <CreditCard size={18} weight="bold" aria-hidden="true" />
              ) : (
                <ChatCircleText size={18} weight="bold" aria-hidden="true" />
              )}
            </span>
            <p className="text-sm leading-5 text-blue-spruce-200">
              {activeStage === 0
                ? "Buyer opens a secure Paystack checkout link."
                : activeStage === 1
                  ? "Buyer shares code 482913 with the rider."
                  : "Vendor sees the released balance update."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 border-t border-blue-spruce-800 bg-blue-spruce-950">
          {stages.map((item, index) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setActiveStage(index)}
              aria-pressed={activeStage === index}
              className={cn(
                "min-h-12 border-r border-blue-spruce-800 px-2 py-3 text-xs font-semibold transition-colors last:border-r-0 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-blue-spruce-300",
                activeStage === index
                  ? "bg-blue-spruce-800 text-blue-spruce-50"
                  : "text-blue-spruce-300 hover:bg-blue-spruce-900 hover:text-blue-spruce-100",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
