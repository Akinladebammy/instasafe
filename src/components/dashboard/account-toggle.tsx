"use client";

import { useActionState, useState } from "react";

import { setActiveAction, type ActionResult } from "@/app/dashboard/actions";
import { SubmitButton } from "@/components/dashboard/submit-button";
import { cn } from "@/lib/cn";

/**
 * Pause/resume control.
 *
 * This deliberately keeps ONE form instance mounted for both directions. An
 * earlier version swapped `ConfirmSubmit` and `ActionForm` on the active flag,
 * which changed the component type at the same tree position, so React threw the
 * form away and the confirmation message vanished the moment it was needed most.
 */
export function AccountToggle({
  vendorId,
  isActive,
}: {
  vendorId: string;
  isActive: boolean;
}) {
  const [armed, setArmed] = useState(false);
  const [result, formAction] = useActionState<ActionResult | null, FormData>(
    setActiveAction,
    null,
  );
  const pendingLabel = isActive ? "Deactivating…" : "Reactivating…";

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="vendorId" value={vendorId} />
        <input type="hidden" name="active" value={String(!isActive)} />

        {armed ? (
          <>
            <p role="status" className="text-sm leading-6 text-ink">
              {isActive
                ? "Deactivate this vendor account? New orders will be paused."
                : "Reactivate this vendor account? New orders can start again."}
            </p>
            <div className="flex flex-wrap gap-2">
              <SubmitButton
                variant={isActive ? "danger" : "primary"}
                pendingLabel={pendingLabel}
              >
                {isActive ? "Yes, deactivate" : "Yes, reactivate"}
              </SubmitButton>
              <button
                type="button"
                onClick={() => setArmed(false)}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setArmed(true)}
            className={cn(
              "inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
              isActive
                ? "border border-cinnamon-wood-500 bg-cinnamon-wood-50 text-cinnamon-wood-900 hover:bg-cinnamon-wood-100 dark:bg-cinnamon-wood-950 dark:text-cinnamon-wood-100 dark:hover:bg-cinnamon-wood-900"
                : "bg-blue-spruce-800 text-blue-spruce-50 hover:bg-blue-spruce-900",
            )}
          >
            {isActive ? "Deactivate Account" : "Reactivate Account"}
          </button>
        )}
      </form>

      {result ? (
        <p
          role="status"
          aria-live="polite"
          className={cn(
            "text-sm leading-6",
            result.ok
              ? "text-shamrock-800 dark:text-shamrock-200"
              : "text-cinnamon-wood-800 dark:text-cinnamon-wood-200",
          )}
        >
          {result.message}
        </p>
      ) : null}
    </div>
  );
}
