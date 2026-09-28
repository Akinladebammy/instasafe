"use client";

import { CheckCircle, Truck, WarningCircle } from "@phosphor-icons/react";
import { useActionState, useState } from "react";

import { trackAction, type TrackResult } from "@/app/track/actions";
import { SubmitButton } from "@/components/dashboard/submit-button";
import { SectionCard } from "@/components/dashboard/parts";
import {
  canRaiseDispute,
  canVerifyOtp,
  isAwaitingRider,
  type FulfillmentKey,
  type OrderStatusKey,
} from "@/lib/order-status";
import { cn } from "@/lib/cn";

const inputClass =
  "w-full rounded-xl border border-line bg-canvas px-4 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/80 focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-focus/25";

/**
 * Buyer-side actions.
 *
 * Every form posts to one action, so the result lives in this component and
 * survives the status change that a successful action causes.
 *
 * There is exactly **one** release action, `verify-otp`, and it appears only for
 * a self-delivery order that is still `Held`. The gates in `order-status.ts`
 * mirror the API's state table: anything rendered outside them is a guaranteed
 * `409` on click.
 */
export function TrackActions({
  orderId,
  reference,
  status,
  fulfillment,
}: {
  orderId: string;
  reference: string;
  status: OrderStatusKey;
  fulfillment: FulfillmentKey;
}) {
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [state, formAction] = useActionState<TrackResult | null, FormData>(
    trackAction,
    null,
  );

  const canOtp = canVerifyOtp(status, fulfillment);
  const canDispute = canRaiseDispute(status);
  const waitingOnRider = isAwaitingRider(status, fulfillment);
  const settled =
    status === "Released" || status === "Refunded" || status === "Cancelled";

  const hidden = {
    orderId,
    reference,
  };

  return (
    <>
      {canOtp ? (
        <SectionCard
          title="Got a code?"
          description="Enter the code from your payment message to release your payment."
        >
          <form action={formAction} className="space-y-4 px-5 py-5">
            <input type="hidden" name="intent" value="otp" />
            <input type="hidden" name="orderId" value={hidden.orderId} />
            <input type="hidden" name="reference" value={hidden.reference} />
            <div>
              <label htmlFor="track-otp" className="text-sm font-semibold text-ink">
                Your code
              </label>
              <input
                id="track-otp"
                name="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                spellCheck={false}
                maxLength={8}
                required
                placeholder="123456"
                className={cn(inputClass, "mt-2 h-12 font-mono tracking-[0.3em]")}
              />
            </div>
            <SubmitButton variant="secondary" pendingLabel="Checking…" className="w-full">
              Verify code
            </SubmitButton>
          </form>
        </SectionCard>
      ) : null}

      {waitingOnRider ? (
        <SectionCard
          title="A rider is handling this"
          description="Nothing for you to do until it arrives."
        >
          <div className="flex items-start gap-3 px-5 py-5">
            <Truck size={20} className="mt-0.5 shrink-0 text-ink-muted" aria-hidden="true" />
            <p className="text-sm leading-6 text-ink-muted">
              Your payment is held safely. When the rider hands the order over,
              they confirm it and you get a short window to check everything
              arrived before the money is released.
            </p>
          </div>
        </SectionCard>
      ) : null}

      {canDispute ? (
        <SectionCard
          title="Something wrong?"
          description="Freezes the funds until it is sorted."
        >
          <div className="space-y-4 px-5 py-5">
            {!disputeOpen ? (
              <>
                <p className="text-sm leading-6 text-ink-muted">
                  Raising a dispute freezes the money in escrow so neither side can
                  move it. The vendor gets your reason and can offer a refund or
                  release.
                </p>
                <button
                  type="button"
                  onClick={() => setDisputeOpen(true)}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-cinnamon-wood-500 bg-cinnamon-wood-50 px-4 text-sm font-semibold text-cinnamon-wood-900 transition-colors hover:bg-cinnamon-wood-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus dark:bg-cinnamon-wood-950 dark:text-cinnamon-wood-100 dark:hover:bg-cinnamon-wood-900"
                >
                  Raise a dispute
                </button>
              </>
            ) : (
              <form action={formAction} className="space-y-3">
                <input type="hidden" name="intent" value="dispute" />
                <input type="hidden" name="orderId" value={hidden.orderId} />
                <input type="hidden" name="reference" value={hidden.reference} />
                <div>
                  <label htmlFor="dispute-reason" className="text-sm font-semibold text-ink">
                    What went wrong?
                  </label>
                  <textarea
                    id="dispute-reason"
                    name="reason"
                    rows={4}
                    required
                    minLength={10}
                    maxLength={500}
                    placeholder="The item arrived damaged and I cannot use it…"
                    className={cn(inputClass, "mt-2 resize-y py-3")}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <SubmitButton variant="danger" pendingLabel="Sending…">
                    Send dispute
                  </SubmitButton>
                  <button
                    type="button"
                    onClick={() => setDisputeOpen(false)}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-line bg-canvas px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </SectionCard>
      ) : null}

      {settled ? (
        <SectionCard title="All done">
          <p className="px-5 py-5 text-sm leading-6 text-ink-muted">
            {status === "Released"
              ? "This order is complete and the vendor has been paid. There is nothing left to confirm."
              : status === "Refunded"
                ? "This order was refunded, so there is nothing left to release."
                : "This order was cancelled."}
          </p>
        </SectionCard>
      ) : null}

      {/* Stable live region: the outcome of any action lands here, so it is
          readable even though the action's own form is now gone. */}
      {state ? (
        <p
          role="status"
          aria-live="polite"
          className={cn(
            "flex items-start gap-2 rounded-2xl border p-4 text-sm leading-6",
            state.ok
              ? "border-shamrock-300 bg-shamrock-50 text-shamrock-900 dark:border-shamrock-800 dark:bg-shamrock-950 dark:text-shamrock-100"
              : "border-cinnamon-wood-400 bg-cinnamon-wood-50 text-cinnamon-wood-900 dark:border-cinnamon-wood-700 dark:bg-cinnamon-wood-950 dark:text-cinnamon-wood-100",
          )}
        >
          {state.ok ? (
            <CheckCircle size={18} weight="duotone" className="mt-0.5 shrink-0" aria-hidden="true" />
          ) : (
            <WarningCircle size={18} weight="duotone" className="mt-0.5 shrink-0" aria-hidden="true" />
          )}
          <span>{state.message}</span>
        </p>
      ) : null}
    </>
  );
}
