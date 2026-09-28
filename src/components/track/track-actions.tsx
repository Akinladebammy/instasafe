"use client";

import { CheckCircle, HandsClapping, WarningCircle } from "@phosphor-icons/react";
import { useActionState, useState } from "react";

import { trackAction, type TrackResult } from "@/app/track/actions";
import { SubmitButton } from "@/components/dashboard/submit-button";
import { SectionCard } from "@/components/dashboard/parts";
import {
  canConfirmSatisfaction,
  canRaiseDispute,
  canVerifyOtp,
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
 * survives the status change that a successful action causes. Which panels
 * appear follows the API guide: satisfaction and dispute only while money is in
 * escrow, and the OTP box only when no rider is assigned.
 */
export function TrackActions({
  orderId,
  reference,
  status,
  fulfillment,
  driverPhone,
}: {
  orderId: string;
  reference: string;
  status: OrderStatusKey;
  fulfillment: FulfillmentKey;
  driverPhone: string | null;
}) {
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [state, formAction] = useActionState<TrackResult | null, FormData>(
    trackAction,
    null,
  );

  const canSatisfy = canConfirmSatisfaction(status, fulfillment);
  const canDispute = canRaiseDispute(status);
  const canOtp = canVerifyOtp(status, fulfillment, driverPhone);
  const settled =
    status === "Released" || status === "Refunded" || status === "Cancelled";

  const hidden = {
    orderId,
    reference,
  };

  return (
    <>
      {canSatisfy ? (
        <SectionCard
          title="Everything as expected?"
          description="Releases your payment to the vendor straight away."
        >
          <div className="space-y-4 px-5 py-5">
            <p className="text-sm leading-6 text-ink-muted">
              This is a digital order, so there is no delivery to wait for. Only
              confirm if you have what you paid for.
            </p>
            <form action={formAction} className="space-y-3">
              <input type="hidden" name="intent" value="satisfy" />
              <input type="hidden" name="orderId" value={hidden.orderId} />
              <input type="hidden" name="reference" value={hidden.reference} />
              <SubmitButton pendingLabel="Releasing…" className="w-full">
                <HandsClapping size={17} aria-hidden="true" />
                Yes, release my payment
              </SubmitButton>
            </form>
          </div>
        </SectionCard>
      ) : null}

      {canOtp ? (
        <SectionCard
          title="Got a code?"
          description="For digital orders, or deliveries with no rider assigned."
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
