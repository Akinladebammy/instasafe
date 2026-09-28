"use client";

import { CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { useActionState } from "react";

import { SubmitButton } from "@/components/dashboard/submit-button";
import { cn } from "@/lib/cn";

/**
 * Declared structurally rather than imported so the admin console can share this
 * shell. Every dashboard action resolves to the same two-outcome shape.
 */
export type ActionOutcome = { ok: boolean; message: string };

type Action = (
  prev: ActionOutcome | null,
  formData: FormData,
) => Promise<ActionOutcome>;

/**
 * Shared shell for every dashboard mutation: submits a server action, blocks
 * double submits, and announces the outcome in a live region.
 */
export function ActionForm({
  action,
  hidden,
  children,
  submitLabel,
  pendingLabel,
  variant = "primary",
  className,
  buttonClassName,
  successTone = "good",
}: {
  action: Action;
  hidden?: Record<string, string>;
  children?: React.ReactNode;
  submitLabel: string;
  pendingLabel: string;
  variant?: "primary" | "secondary" | "danger";
  className?: string;
  buttonClassName?: string;
  successTone?: "good" | "info";
}) {
  const [state, formAction] = useActionState<ActionOutcome | null, FormData>(action, null);

  return (
    <form action={formAction} className={cn("space-y-4", className)}>
      {Object.entries(hidden ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {children}
      <SubmitButton
        variant={variant}
        pendingLabel={pendingLabel}
        className={buttonClassName}
      >
        {submitLabel}
      </SubmitButton>
      {state ? (
        <p
          role="status"
          aria-live="polite"
          className={cn(
            "flex items-start gap-2 text-sm leading-6",
            state.ok
              ? successTone === "good"
                ? "text-shamrock-800 dark:text-shamrock-200"
                : "text-blue-spruce-800 dark:text-blue-spruce-200"
              : "text-cinnamon-wood-800 dark:text-cinnamon-wood-200",
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
    </form>
  );
}
