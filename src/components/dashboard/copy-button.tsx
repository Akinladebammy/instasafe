"use client";

import { Check, Copy } from "@phosphor-icons/react";
import { useState } from "react";

import { cn } from "@/lib/cn";

export function CopyButton({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the value stays visible for manual copying.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
      className={cn(
        "inline-flex min-h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-canvas text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        copied && "border-shamrock-400 text-shamrock-700 dark:text-shamrock-300",
        className,
      )}
    >
      {copied ? (
        <Check size={16} weight="bold" aria-hidden="true" />
      ) : (
        <Copy size={16} aria-hidden="true" />
      )}
    </button>
  );
}
