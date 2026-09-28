"use client";

import { useState } from "react";

import { ActionForm, type ActionOutcome } from "@/components/dashboard/action-form";

type Action = (
  prev: ActionOutcome | null,
  formData: FormData,
) => Promise<ActionOutcome>;

/**
 * Two-step guard for irreversible actions. Nothing is submitted until the vendor
 * explicitly confirms, and backing out resets to the plain trigger.
 */
export function ConfirmSubmit({
  action,
  hidden,
  label,
  confirmLabel,
  question,
  pendingLabel,
}: {
  action: Action;
  hidden: Record<string, string>;
  label: string;
  confirmLabel: string;
  question: string;
  pendingLabel: string;
}) {
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-cinnamon-wood-500 bg-cinnamon-wood-50 px-4 py-2.5 text-sm font-semibold text-cinnamon-wood-900 transition-colors hover:bg-cinnamon-wood-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus dark:bg-cinnamon-wood-950 dark:text-cinnamon-wood-100 dark:hover:bg-cinnamon-wood-900"
      >
        {label}
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <p role="status" className="text-sm leading-6 text-ink">
        {question}
      </p>
      <div className="flex flex-wrap items-start gap-2">
        <ActionForm
          action={action}
          hidden={hidden}
          submitLabel={confirmLabel}
          pendingLabel={pendingLabel}
          variant="danger"
          className="flex flex-col items-start gap-3"
          buttonClassName="shrink-0"
        />
        <button
          type="button"
          onClick={() => setArmed(false)}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
