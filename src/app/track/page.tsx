import type { Metadata } from "next";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";

import { NotFound, TrackView, loadTrack } from "./_view";

export const metadata: Metadata = {
  title: "Track your order — InstaSafe",
  description: "Follow an InstaSafe protected order from payment to payout.",
  robots: { index: false, follow: false },
};

export const referrerPolicy = "no-referrer";

/**
 * `/track?ref=…` is the typed-entry form and the fallback for links minted before
 * the backend moved to path-style URLs. The canonical route is
 * `/track/{orderNumber}`, which is what the payment-link WhatsApp, the
 * bank-transfer message, the status emails and the dispatcher's assignment
 * message all point at.
 */
export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string | string[] }>;
}) {
  const params = await searchParams;
  const reference =
    (Array.isArray(params.ref) ? params.ref[0] : params.ref)?.trim() ?? "";

  if (!reference) {
    return (
      <div className="mx-auto w-full max-w-2xl px-5 py-14 sm:px-8">
        <div className="text-center">
          <p className="text-xs font-semibold tracking-[0.18em] text-brand uppercase">
            Order tracking
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
            Where is my order?
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-base leading-7 text-ink-muted">
            Paste the order number from your payment message — it looks like{" "}
            <span className="font-mono text-ink">IS-8K4N2Q</span>. A payment
            reference or order id works too. No account needed.
          </p>
        </div>

        <form action="/track" method="get" className="mt-8">
          <label htmlFor="ref" className="text-sm font-semibold text-ink">
            Order reference
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <MagnifyingGlass
                size={19}
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
              />
              <input
                id="ref"
                name="ref"
                type="text"
                required
                autoComplete="off"
                spellCheck={false}
                placeholder="IS-8K4N2Q, payment reference, or order id"
                className="h-12 w-full rounded-xl border border-line bg-surface pl-11 pr-4 font-mono text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:font-sans placeholder:text-ink-muted focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-focus/25"
              />
            </div>
            <button
              type="submit"
              className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-blue-spruce-800 px-5 text-sm font-semibold text-blue-spruce-50 transition-colors hover:bg-blue-spruce-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              Track order
            </button>
          </div>
        </form>
      </div>
    );
  }

  const data = await loadTrack(reference);
  if (!data) return <NotFound />;

  return <TrackView order={data.order} timeline={data.timeline} />;
}
