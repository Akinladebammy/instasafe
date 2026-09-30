import type { Metadata } from "next";
import Link from "next/link";
import { formatDateTime } from "@/lib/money";
import {
  isSelfDelivery,
  statusLabel,
  type FulfillmentKey,
  type OrderStatusKey,
} from "@/lib/order-status";
import { CopyButton } from "@/components/dashboard/copy-button";
import {
  decodePublicOrder,
  publicOrderNumber,
  type DecodedPublicOrder,
} from "@/lib/types";
import {
  getOrderByReference,
  getTimelineByReference,
  TrackApiError,
} from "@/lib/track-api";
import { OrderTimeline } from "@/components/track/order-timeline";
import { TrackActions } from "@/components/track/track-actions";
import { Money, SectionCard } from "@/components/dashboard/parts";
import { StatusPill } from "@/components/dashboard/status-pill";

export const metadata: Metadata = {
  title: "Track your order — InstaSafe",
  description: "Follow an InstaSafe protected order from payment to payout.",
  robots: { index: false, follow: false },
};

/** The order number is a bearer token, so nothing here may reference an external origin. */
export const referrerPolicy = "no-referrer";

/** Only `Held` needs the fulfilment to word it, so it is the one that asks. */
function summaryFor(status: OrderStatusKey, fulfillment: FulfillmentKey) {
  if (status !== "Held") return "";
  return isSelfDelivery(fulfillment)
    ? "Your payment is held safely until you confirm the handover."
    : "Your payment is held safely until the rider confirms the handover.";
}

export function NotFound({ message }: { message?: string }) {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-14 sm:px-8">
      <div className="rounded-2xl border border-cinnamon-wood-400 bg-cinnamon-wood-50 p-6 dark:border-cinnamon-wood-700 dark:bg-cinnamon-wood-950">
        <h1 className="text-lg font-semibold text-cinnamon-wood-950 dark:text-cinnamon-wood-100">
          Order not found
        </h1>
        <p className="mt-2 text-sm leading-6 text-cinnamon-wood-900 dark:text-cinnamon-wood-200">
          {message ??
            "We could not find an order with that number. Check the link your vendor sent you."}
        </p>
      </div>
      <Link
        href="/track"
        className="mt-6 inline-flex min-h-11 items-center rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        Try another number
      </Link>
    </div>
  );
}

/**
 * The tracker itself, shared by `/track?ref=…` and `/track/{orderNumber}`.
 *
 * Everything rendered here comes from `PublicOrderDto`, which has no buyer
 * contact details, no Paystack reference and no escrow account — so there are no
 * masked fields to show and nothing payable on a shareable page.
 */
export function TrackView({
  order,
  timeline,
}: {
  order: DecodedPublicOrder;
  timeline: Awaited<ReturnType<typeof getTimelineByReference>> | null;
}) {
  const items = order.items ?? [];
  const number = publicOrderNumber(order);

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
            <span>{number}</span>
            <CopyButton value={number} label="order number" />
          </p>
        </div>
        <StatusPill status={order.statusKey} />
      </div>

      <p className="mt-4 max-w-2xl text-base leading-7 text-ink-muted">
        This order is currently{" "}
        <span className="font-semibold text-ink">
          {statusLabel(order.statusKey).toLowerCase()}
        </span>
        {order.statusKey === "Delivered"
          ? ". You have a short window to raise a problem before funds release."
          : order.statusKey === "Released"
            ? " — you have been paid and the vendor has been paid. Nothing else to do."
            : order.statusKey === "Refunded"
              ? " — it was refunded."
              : order.statusKey === "Disputed"
                ? " — funds are frozen while this is sorted out, and the vendor has been notified."
                : order.statusKey === "Cancelled"
                  ? " — it was cancelled."
                  : order.statusKey === "Held"
                    ? ` — ${summaryFor(order.statusKey, order.fulfillmentKey)}`
                    : " — waiting for payment to come through."}
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
                  <Money kobo={order.goodsKobo} className="text-sm font-semibold text-ink" />
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
                <span className="font-mono">{number}</span>
              </Row>
              <Row label="Status">{statusLabel(order.statusKey)}</Row>
              <Row label="How it arrives">
                {isSelfDelivery(order.fulfillmentKey)
                  ? "The vendor delivers it to you"
                  : "A rider delivers it to you"}
              </Row>
              {order.deliveryAddress ? (
                <Row label="Delivering to">{order.deliveryAddress}</Row>
              ) : null}
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
            reference={number}
            status={order.statusKey}
            fulfillment={order.fulfillmentKey}
          />

          <p className="px-1 text-xs leading-5 text-ink-muted">
            Anyone with this number can see this page, so contact and payment
            details are not shown here. Do not share it publicly.
          </p>
        </div>
      </div>
    </div>
  );
}

export async function loadTrack(
  reference: string,
): Promise<{ order: DecodedPublicOrder; timeline: Awaited<ReturnType<typeof getTimelineByReference>> | null } | null> {
  const [orderResult, timelineResult] = await Promise.all([
    getOrderByReference(reference).catch((error: unknown) => error as TrackApiError),
    getTimelineByReference(reference).catch((error: unknown) => error as TrackApiError),
  ]);

  if (orderResult instanceof TrackApiError) return null;
  const raw = orderResult as { id?: string } | null;
  if (!raw?.id) return null;

  return {
    order: decodePublicOrder(raw as Parameters<typeof decodePublicOrder>[0]),
    timeline: timelineResult instanceof TrackApiError ? null : timelineResult,
  };
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
