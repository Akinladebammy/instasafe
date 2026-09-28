import Link from "next/link";

/**
 * Scoped to `/track/{orderNumber}`.
 *
 * `notFound()` is used deliberately rather than rendering the friendly panel as a
 * normal 200: an unknown number should answer a real `404` so a client or cache
 * knows the order does not exist, while the buyer still gets a readable page
 * instead of a stack-trace-shaped error screen. The copy tells them what to do
 * next, because this is the page a buyer lands on when a link is mistyped.
 */
export default function TrackOrderNotFound() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-14 sm:px-8">
      <div className="rounded-2xl border border-cinnamon-wood-400 bg-cinnamon-wood-50 p-6 dark:border-cinnamon-wood-700 dark:bg-cinnamon-wood-950">
        <h1 className="text-lg font-semibold text-cinnamon-wood-950 dark:text-cinnamon-wood-100">
          Order not found
        </h1>
        <p className="mt-2 text-sm leading-6 text-cinnamon-wood-900 dark:text-cinnamon-wood-200">
          We could not find an order with that number. It looks like{" "}
          <span className="font-mono">IS-XXXXXX</span> — six characters after the
          dash. Check the link your vendor sent you, or search by the number
          directly.
        </p>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/track"
          className="inline-flex min-h-11 items-center rounded-xl bg-blue-spruce-800 px-4 text-sm font-semibold text-blue-spruce-50 transition-colors hover:bg-blue-spruce-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Search by number
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          InstaSafe home
        </Link>
      </div>
    </div>
  );
}
