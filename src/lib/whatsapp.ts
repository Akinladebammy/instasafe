/**
 * Vendor bot deep links. Single source of truth for the WhatsApp number so
 * a number change is one env edit, not four file edits.
 *
 * Set NEXT_PUBLIC_WHATSAPP_BOT_NUMBER to digits only, e.g. 2347079832962.
 * Every consumer renders nothing when it returns null - never a dead link.
 */
export function botChatUrl(prefill = "Hi"): string | null {
  const digits = (process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER ?? "").replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return null;
  const text = prefill.trim();
  return text
    ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
    : `https://wa.me/${digits}`;
}

