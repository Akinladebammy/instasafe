import type { Metadata } from "next";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";

import { formatDateTime } from "@/lib/money";
import { statusLabel } from "@/lib/order-status";
import { CopyButton } from "@/components/dashboard/copy-button";
import { decodeOrder, orderNumber } from "@/lib/types";
import { getOrderByReference, getTimelineByReference, TrackApiError } from "@/lib/track-api";
import { OrderTimeline } from "@/components/track/order-timeline";
import { TrackActions } from "@/components/track/track-actions";
import { Money, SectionCard } from "@/components/dashboard/parts";
import { StatusPill } from "@/components/dashboard/status-pill";

export const metadata: Metadata = {
  title: "Track your order — InstaSafe",
  description: "Follow an InstaSafe protected order from payment to payout.",
  robots: { index: false, follow: false },
};

/** Masks an email or phone so a shared tracking link does not leak contact details. */
function maskContact(value: string | null | undefined) {
  if (!value) return "—";
  const digits = value.replace(/\D/g, "");
  if (digits.length >= 11) {
    return `•••• ${digits.slice(-4)}`;
  }
  const [local, domain] = value.split("@");
  if (local && domain) {
    return `${local.slice(0, 1)}•••@${domain}`;
  }
  return value;
}

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

  const [orderResult, timelineResult] = await Promise.all([
    getOrderByReference(reference).catch((error: unknown) => error as TrackApiError),
    getTimelineByReference(reference).catch((error: unknown) => error as TrackApiError),
  ]);

  if (orderResult instanceof TrackApiError) {
    const notFound = orderResult.status === 404;
    return (
      <div className="mx-auto w-full max-w-2xl px-5 py-14 sm:px-8">
        <div className="rounded-2xl border border-cinnamon-wood-400 bg-cinnamon-wood-50 p-6 dark:border-cinnamon-wood-700 dark:bg-cinnamon-wood-950">
          <h1 className="text-lg font-semibold text-cinnamon-wood-950 dark:text-cinnamon-wood-100">
            {notFound ? "Order not found" : "We could not load that order"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-cinnamon-wood-900 dark:text-cinnamon-wood-200">
            {orderResult.message}
          </p>
        </div>
        <a
          href="/track"
          className="mt-6 inline-flex min-h-11 items-center rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Try another reference
        </a>
      </div>
    );
  }

  if (!(orderResult as { id?: string } | null)?.id) {
    return (
      <div className="mx-auto w-full max-w-2xl px-5 py-14 sm:px-8">
        <div className="rounded-2xl border border-cinnamon-wood-400 bg-cinnamon-wood-50 p-6 dark:border-cinnamon-wood-700 dark:bg-cinnamon-wood-950">
          <h1 className="text-lg font-semibold text-cinnamon-wood-950 dark:text-cinnamon-wood-100">
            Nothing to show
          </h1>
          <p className="mt-2 text-sm leading-6 text-cinnamon-wood-900 dark:text-cinnamon-wood-200">
            The API did not return an order for that reference.
          </p>
        </div>
      </div>
    );
  }

  const order = decodeOrder(orderResult as Parameters<typeof decodeOrder>[0]);
  const timeline =
    timelineResult instanceof TrackApiError ? null : timelineResult;
  const items = order.items ?? [];

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.18em] text-brand uppercase">
            Order tracking
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
            {order.customerName ?? "Your order"}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 font-mono text-sm text-ink-muted">
            <span>{orderNumber(order)}</span>
            <CopyButton value={orderNumber(order)} label="order number" />
          </p>
        </div>
        <StatusPill status={order.statusKey} />
      </div>

      <p className="mt-4 max-w-2xl text-base leading-7 text-ink-muted">
        This order is currently{" "}
        <span className="font-semibold text-ink">
          {statusLabel(order.statusKey).toLowerCase()}
        </span>
        .{" "}
        {order.statusKey === "Released"
          ? "You have been paid and the vendor has been paid. Nothing else to do."
          : order.statusKey === "Refunded"
            ? "This order was refunded."
            : order.statusKey === "Disputed"
              ? "Funds are frozen while this is sorted out. The vendor has been notified."
              : order.statusKey === "Delivered"
                ? "Delivered. You have a short window to raise a problem before funds release."
                : order.statusKey === "Held"
                  ? "Your payment is held safely until delivery is confirmed."
                  : "Waiting for payment to come through."}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-6">
          <SectionCard
            title="Progress"
            description="Every step the backend has recorded for this order."
          >
            <OrderTimeline events={timeline?.events ?? []} />
          </SectionCard>

          <SectionCard
            title="What you ordered"
            description={items.length ? undefined : "No line items returned"}
          >
            {items.length === 0 ? (
              <p className="px-5 py-6 text-sm text-ink-muted">
                The vendor has not itemised this order yet.
              </p>
            ) : (
              <ul>
                {items.map((item, index) => (
                  <li
                    key={`${item.description}-${index}`}
                    className="flex items-start justify-between gap-4 border-b border-line px-5 py-3.5 last:border-b-0"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-ink">
                        {item.description ?? "Item"}
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-muted">
                        {item.quantity ?? 0} ×{" "}
                        <Money kobo={item.unitPriceKobo} />
                      </span>
                    </span>
                    <Money
                      kobo={(item.unitPriceKobo ?? 0) * (item.quantity ?? 0)}
                      className="text-sm font-semibold text-ink"
                    />
                  </li>
                ))}
                <li className="flex items-center justify-between gap-4 bg-surface-raised px-5 py-3.5">
                  <span className="text-sm font-semibold text-ink">Goods</span>
                  <Money kobo={order.amountKobo} className="text-sm font-semibold text-ink" />
                </li>
                {order.deliveryFeeKobo ? (
                  <li className="flex items-center justify-between gap-4 border-t border-line px-5 py-3.5">
                    <span className="text-sm text-ink-muted">Delivery</span>
                    <Money kobo={order.deliveryFeeKobo} className="text-sm text-ink-muted" />
                  </li>
                ) : null}
                <li className="flex items-center justify-between gap-4 border-t border-line bg-surface-raised px-5 py-3.5">
                  <span className="text-sm font-semibold text-ink">Total paid</span>
                  <Money kobo={order.totalKobo} className="text-base font-semibold text-ink" />
                </li>
              </ul>
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Details">
            <dl className="px-5 py-2">
              <Row label="Order number">
                <span className="font-mono">{orderNumber(order)}</span>
              </Row>
              {order.paystackReference ? (
                <Row label="Payment ref">
                  <span className="font-mono">{order.paystackReference}</span>
                </Row>
              ) : null}
              <Row label="Status">{statusLabel(order.statusKey)}</Row>
              <Row label="Type">{order.fulfillmentKey === "Digital" ? "Digital" : "Physical delivery"}</Row>
              {order.deliveryAddress ? (
                <Row label="Delivering to">{order.deliveryAddress}</Row>
              ) : null}
              <Row label="Your email">{maskContact(order.buyerEmail)}</Row>
              <Row label="Your phone">{maskContact(order.customerPhone)}</Row>
              <Row label="Vendor">{maskContact(order.vendorPhone)}</Row>
              {order.heldAt ? <Row label="Paid">{formatDateTime(order.heldAt)}</Row> : null}
              {order.deliveredAt ? (
                <Row label="Delivered">{formatDateTime(order.deliveredAt)}</Row>
              ) : null}
              {order.releaseDueAt ? (
                <Row label="Funds release">{formatDateTime(order.releaseDueAt)}</Row>
              ) : null}
              {order.disputeReason ? <Row label="Dispute">{order.disputeReason}</Row> : null}
            </dl>
          </SectionCard>

          <TrackActions
            orderId={order.id}
            reference={orderNumber(order)}
            status={order.statusKey}
            fulfillment={order.fulfillmentKey}
            driverPhone={order.driverPhone ?? null}
          />

          <p className="px-1 text-xs leading-5 text-ink-muted">
            Anyone with this link can see this page, so contact details are
            masked. Do not share it publicly.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-3 last:border-b-0">
      <dt className="shrink-0 text-sm text-ink-muted">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-medium break-words text-ink">
        {children}
      </dd>
    </div>
  );
}
