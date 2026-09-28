"use client";

import { Check, Copy, ShareNetwork } from "@phosphor-icons/react";
import { useState } from "react";

import { cn } from "@/lib/cn";

/**
 * The shareable buyer link for one order.
 *
 * The vendor is the one composing the WhatsApp message, and `paystackAuthUrl`
 * points at Paystack's own domain — we cannot add our link to it. So the
 * trackable URL is built on the server (see `lib/url.ts`) and copied from here,
 * ready to paste into the same message as the payment link.
 */
export function ShareTrackingLink({
  href,
  className,
}: {
  href: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard can be blocked; the URL below stays selectable by hand.
    }
  }

  async function share() {
    // Prefer the OS share sheet on phones, which is how these links travel.
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Track your InstaSafe order",
          text: "Follow your order here — it stays protected until delivery is confirmed.",
          url: href,
        });
        setShared(true);
        window.setTimeout(() => setShared(false), 2500);
        return;
      } catch {
        // Dismissed, or unsupported: fall through to copying.
      }
    }
    await copy();
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={share}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-spruce-800 px-4 py-2.5 text-sm font-semibold text-blue-spruce-50 transition-colors hover:bg-blue-spruce-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {shared ? (
            <Check size={17} weight="bold" aria-hidden="true" />
          ) : (
            <ShareNetwork size={17} weight="bold" aria-hidden="true" />
          )}
          {shared ? "Shared" : "Share tracking link"}
        </button>
        <button
          type="button"
          onClick={copy}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {copied ? (
            <Check size={17} weight="bold" aria-hidden="true" />
          ) : (
            <Copy size={17} aria-hidden="true" />
          )}
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
      <p className="font-mono text-xs break-all text-ink-muted">{href}</p>
    </div>
  );
}
