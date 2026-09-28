"use client";

import { CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { useActionState } from "react";

import { confirmDeliveryAction, type DispatchResult } from "@/app/dispatch/actions";
import { SubmitButton } from "@/components/dashboard/submit-button";
import { SectionCard } from "@/components/dashboard/parts";
import { formatCountdown, formatDateTime } from "@/lib/money";
import { cn } from "@/lib/cn";

const inputClass =
  "h-12 w-full rounded-xl border border-line bg-canvas px-4 font-mono text-lg tracking-[0.3em] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/80 placeholder:tracking-normal focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-focus/25";

/**
 * Rides delivery confirmation.
 *
 * Holds its own `useActionState` and keeps ONE card mounted across the Held →
 * Delivered transition. An earlier version swapped between two different cards,
 * so React unmounted the form on success and the confirmation message was
 * destroyed at the exact moment the rider needed to see it.
 */
export function DeliveryConfirm({
  orderId,
  held,
  deliveredAt,
  releaseDueAt,
}: {
  orderId: string;
  held: boolean;
  deliveredAt: string | null;
  releaseDueAt: string | null;
}) {
  const [state, formAction] = useActionState<DispatchResult | null, FormData>(
    confirmDeliveryAction,
    null,
  );

  return (
    <SectionCard
      title={held ? "Confirm delivery" : "Delivery confirmed"}
      description={
        held
          ? "Ask the buyer to read you the one-time code from their payment message."
          : "Nothing more to do here."
      }
    >
      <div className="space-y-4 px-5 py-5">
        {held ? (
          <>
            <p className="text-sm leading-6 text-ink-muted">
              Do not accept the code over a message you can screenshot. Confirming
              releases the buyer&apos;s 24-hour inspection window and pays your fee.
            </p>
            <form action={formAction} className="space-y-3">
              <input type="hidden" name="orderId" value={orderId} />
              <div>
                <label htmlFor="otp" className="text-sm font-semibold text-ink">
                  Buyer&apos;s code
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  spellCheck={false}
                  maxLength={8}
                  required
                  placeholder="123456"
                  className={cn(inputClass, "mt-2")}
                />
              </div>
              <SubmitButton pendingLabel="Confirming…" className="w-full">
                Confirm Delivery
              </SubmitButton>
            </form>
          </>
        ) : (
          <div className="space-y-3 text-sm leading-6 text-ink-muted">
            <p>
              Confirmed {formatDateTime(deliveredAt)}. The buyer&apos;s inspection
              window closes {releaseDueAt ? formatDateTime(releaseDueAt) : "shortly"}
              , then the backend releases the vendor&apos;s funds automatically.
            </p>
            <p>
              {deliveredAt ? `That is ${formatCountdown(releaseDueAt)}. ` : ""}
              Your fee was paid by the backend at confirmation. If it has not landed,
              raise it with the vendor — this screen does not move money.
            </p>
          </div>
        )}

        {state ? (
          <p
            role="status"
            aria-live="polite"
            className={cn(
              "flex items-start gap-2 rounded-xl border p-3 text-sm leading-6",
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
      </div>
    </SectionCard>
  );
}
