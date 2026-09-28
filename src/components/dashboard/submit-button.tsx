"use client";

import { SpinnerGap } from "@phosphor-icons/react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/cn";

export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  className,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  variant?: "primary" | "secondary" | "danger";
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-70",
        variant === "primary" &&
          "bg-blue-spruce-800 text-blue-spruce-50 hover:bg-blue-spruce-900",
        variant === "secondary" &&
          "border border-line bg-canvas text-ink hover:bg-surface-raised",
        variant === "danger" &&
          "border border-cinnamon-wood-500 bg-cinnamon-wood-50 text-cinnamon-wood-900 hover:bg-cinnamon-wood-100 dark:bg-cinnamon-wood-950 dark:text-cinnamon-wood-100 dark:hover:bg-cinnamon-wood-900",
        className,
      )}
    >
      {pending ? (
        <>
          <SpinnerGap size={16} className="animate-spin" aria-hidden="true" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
