/**
 * Vendor bot deep links. Single source of truth for the WhatsApp number so
 * a number change is one line here, not four file edits.
 *
 * The vendor bot number, hardcoded. It is a public contact address (it
 * appears verbatim in every wa.me link), so an env var bought nothing but
 * a silent-invisible failure mode when unset at build time.
 */
export function botChatUrl(prefill = "Hi"): string | null {
  const digits = "2347079832962";
  if (digits.length < 7 || digits.length > 15) return null;
  const text = prefill.trim();
  return text
    ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
    : `https://wa.me/${digits}`;
}

