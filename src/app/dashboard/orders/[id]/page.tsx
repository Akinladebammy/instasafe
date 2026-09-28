import Link from "next/link";
import { ArrowLeft, Bank, LinkSimple, Truck } from "@phosphor-icons/react/dist/ssr";
import { notFound, redirect } from "next/navigation";

import { refundOrderAction, requestBankTransferAction, resolveDisputeAction } from "@/app/dashboard/actions";
import { ActionForm } from "@/components/dashboard/action-form";
import { ConfirmSubmit } from "@/components/dashboard/confirm-submit";
import { CopyButton } from "@/components/dashboard/copy-button";
import {
  DataRow,
  ErrorNote,
  Money,
  SectionCard,
  StatTile,
} from "@/components/dashboard/parts";
import { StatusPill, Tag } from "@/components/dashboard/status-pill";
import { ShareTrackingLink } from "@/components/dashboard/share-tracking-link";
import {
  formatCountdown,
  formatDateTime,
  formatPhone,
  pluralize,
} from "@/lib/money";
import {
  canRefund,
  canRequestBankTransfer,
  canResolveDispute,
  fulfillmentLabel,
  isSelfDelivery,
} from "@/lib/order-status";
import { decodeOrder, orderNumber } from "@/lib/types";
import { trackUrlFor } from "@/lib/url";
import {
  getOrder,
  getOrderTimeline,
  getVendorToken,
  VendorApiError,
} from "@/lib/vendor-api";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const token = await getVendorToken();
  if (!token) redirect("/login");

  let raw: Awaited<ReturnType<typeof getOrder>> = null;
  let loadError: VendorApiError | null = null;
  try {
    raw = await getOrder(token, id);
  } catch (error) {
    if (error instanceof VendorApiError) {
      if (error.status === 404) notFound();
      loadError = error;
    } else {
      throw error;
    }
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/orders"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to orders
        </Link>
        <ErrorNote
          title="We could not load this order"
          message={
            loadError.status === 403
              ? "This order belongs to another vendor."
              : loadError.message
          }
        />
      </div>
    );
  }

  if (!raw) notFound();

  const order = decodeOrder(raw);
  // The timeline is public and accepts the order number, the Paystack reference
  // or the id, so prefer the customer-facing number.
  const timeline = await getOrderTimeline(orderNumber(order)).catch(() => null);

  const items = order.items ?? [];
  const itemsTotalKobo = items.reduce(
    (sum, item) => sum + (item.unitPriceKobo ?? 0) * (item.quantity ?? 0),
    0,
  );

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/dashboard/orders"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to orders
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
              {order.customerName ?? "Customer"}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-2 font-mono text-sm text-ink-muted">
              <span className="break-all">{orderNumber(order)}</span>
              <CopyButton value={orderNumber(order)} label="order number" />
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={order.statusKey} />
            <Tag>{fulfillmentLabel(order.fulfillmentKey)}</Tag>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          label="Buyer total"
          value={<Money kobo={order.totalKobo} />}
          hint={
            <>
              <Money kobo={order.amountKobo} /> goods +{" "}
              <Money kobo={order.deliveryFeeKobo} /> delivery
            </>
          }
        />
        <StatTile
          label="Delivery"
          value={
            isSelfDelivery(order.fulfillmentKey) ? "You deliver it" : "Rider assigned"
          }
          hint={
            order.driverPhone
              ? `Rider ${formatPhone(order.driverPhone)}`
              : isSelfDelivery(order.fulfillmentKey)
                ? "Buyer releases it from their tracking page"
                : "No rider assigned yet"
          }
        />
        <StatTile
          label={order.releasedAt ? "Released" : "Release state"}
          value={
            order.releasedAt
              ? formatDateTime(order.releasedAt)
              : order.deliveredAt
                ? formatCountdown(order.releaseDueAt)
                : "Not yet"
          }
          hint={
            order.statusKey === "Disputed"
              ? "Frozen by a dispute"
              : order.disputeReason
                ? "Dispute resolved — see the release state"
                : order.deliveredAt
                  ? "Inspection window closes, then the backend releases funds"
                  : "Funds release after delivery is confirmed"
          }
          tone={
            order.statusKey === "Disputed"
              ? "bad"
              : order.releasedAt
                ? "good"
                : "neutral"
          }
        />
      </div>

      {order.statusKey === "Disputed" && order.disputeReason ? (
        <ErrorNote
          title="This order is disputed"
          message={order.disputeReason}
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          <SectionCard
            title="Items"
            description={
              items.length
                ? pluralize(items.length, "line")
                : undefined
            }
          >
            {items.length === 0 ? (
              <p className="px-5 py-6 text-sm text-ink-muted">
                The backend did not return line items for this order.
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
                        {item.quantity ?? 0} × <Money kobo={item.unitPriceKobo} />
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-ink">
                      <Money kobo={(item.unitPriceKobo ?? 0) * (item.quantity ?? 0)} />
                    </span>
                  </li>
                ))}
                <li className="flex items-center justify-between gap-4 bg-surface-raised px-5 py-3.5">
                  <span className="text-sm font-semibold text-ink">Goods subtotal</span>
                  <span className="text-sm font-semibold tabular-nums text-ink">
                    <Money kobo={itemsTotalKobo} />
                  </span>
                </li>
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title="Order timeline"
            description="Rendered from the public tracker endpoint."
          >
            {timeline?.events?.length ? (
              <ol className="px-5 py-5">
                {timeline.events.map((event, index) => (
                  <li key={`${event.key}-${index}`} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span
                        aria-hidden="true"
                        className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand"
                      />
                      {index < (timeline.events?.length ?? 0) - 1 ? (
                        <span aria-hidden="true" className="w-px flex-1 bg-line" />
                      ) : null}
                    </div>
                    <div className="min-w-0 pb-6 last:pb-0">
                      <p className="text-sm font-semibold text-ink">
                        {event.label ?? event.key ?? "Update"}
                      </p>
                      {event.at ? (
                        <p className="mt-0.5 text-xs text-ink-muted">
                          {formatDateTime(event.at)}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="px-5 py-6 text-sm text-ink-muted">
                No timeline events yet. They appear as the buyer pays and the
                order moves through escrow.
              </p>
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Actions">
            <div className="space-y-5 px-5 py-5">
              {canRequestBankTransfer(order.statusKey) ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      Bank-transfer details
                    </p>
                    <p className="mt-1 text-sm leading-6 text-ink-muted">
                      Generates a dedicated account for this order. The buyer
                      transfers the exact total; confirmation arrives by webhook.
                    </p>
                  </div>
                  <ActionForm
                    action={requestBankTransferAction}
                    hidden={{ orderId: order.id }}
                    submitLabel="Get Transfer Details"
                    pendingLabel="Requesting…"
                    variant="secondary"
                    buttonClassName="w-full"
                    successTone="info"
                  />
                </div>
              ) : null}

              {canRefund(order.statusKey) ? (
                <div className="space-y-3 border-t border-line pt-5">
                  <div>
                    <p className="text-sm font-semibold text-ink">Refund buyer</p>
                    <p className="mt-1 text-sm leading-6 text-ink-muted">
                      Issues a real Paystack refund for{" "}
                      <Money kobo={order.amountKobo} /> of goods value.
                    </p>
                  </div>
                  <ConfirmSubmit
                    action={refundOrderAction}
                    hidden={{ orderId: order.id }}
                    label="Refund this order"
                    confirmLabel="Yes, refund now"
                    question={`Refund $<Money kobo={order.amountKobo} /> to the buyer? This cannot be undone.`}
                    pendingLabel="Refunding…"
                  />
                </div>
              ) : null}

              {canResolveDispute(order.statusKey) ? (
                <div className="space-y-4 border-t border-line pt-5">
                  <div>
                    <p className="text-sm font-semibold text-ink">Resolve dispute</p>
                    <p className="mt-1 text-sm leading-6 text-ink-muted">
                      Frozen funds go to the buyer on refund, or to you on
                      release.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ActionForm
                      action={resolveDisputeAction}
                      hidden={{ orderId: order.id, resolution: "release" }}
                      submitLabel="Release to me"
                      pendingLabel="Releasing…"
                      className="flex-1"
                      buttonClassName="w-full"
                    />
                    <ActionForm
                      action={resolveDisputeAction}
                      hidden={{ orderId: order.id, resolution: "refund" }}
                      submitLabel="Refund buyer"
                      pendingLabel="Refunding…"
                      variant="danger"
                      className="flex-1"
                      buttonClassName="w-full"
                    />
                  </div>
                </div>
              ) : null}

              {order.statusKey === "Released" ? (
                <p className="text-sm leading-6 text-ink-muted">
                  This order is complete. Refunds are no longer available once
                  funds are released.
                </p>
              ) : null}

              {order.statusKey === "Refunded" || order.statusKey === "Cancelled" ? (
                <p className="text-sm leading-6 text-ink-muted">
                  This order is closed. No further vendor actions are available.
                </p>
              ) : null}
            </div>
          </SectionCard>

          {order.payVirtualAccountNumber ? (
            <SectionCard
              title="Dedicated transfer account"
              description="Share these with the buyer."
            >
              <dl>
                <DataRow label="Account number">
                  <span className="flex items-center gap-2">
                    <span className="font-mono tabular-nums">
                      {order.payVirtualAccountNumber}
                    </span>
                    <CopyButton
                      value={order.payVirtualAccountNumber}
                      label="account number"
                    />
                  </span>
                </DataRow>
                {order.payVirtualAccountBank ? (
                  <DataRow label="Bank">
                    <span className="flex items-center gap-2">
                      <Bank size={16} className="text-ink-muted" aria-hidden="true" />
                      {order.payVirtualAccountBank}
                    </span>
                  </DataRow>
                ) : null}
                {order.transferReference ? (
                  <DataRow label="Transfer reference">
                    <span className="flex items-center gap-2">
                      <span className="font-mono break-all">
                        {order.transferReference}
                      </span>
                      <CopyButton
                        value={order.transferReference}
                        label="transfer reference"
                      />
                    </span>
                  </DataRow>
                ) : null}
              </dl>
            </SectionCard>
          ) : null}

          {order.paystackAuthUrl ? (
            <SectionCard
              title="Card payment link"
              description="Send this to the buyer if they prefer to pay by card."
            >
              <div className="space-y-3 px-5 py-5">
                <p className="flex items-start gap-2 text-sm leading-6 text-ink-muted">
                  <LinkSimple size={16} className="mt-1 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 break-all">{order.paystackAuthUrl}</span>
                </p>
                <a
                  href={order.paystackAuthUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-line bg-canvas px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  Open payment link
                </a>
              </div>
            </SectionCard>
          ) : null}

          {/* The buyer-facing page. The payment link goes to Paystack's domain so
              we cannot add it there — this is the link to paste into the same
              WhatsApp message. */}
          <SectionCard
            title="Buyer tracking link"
            description="Paste this into the message with the payment link so they can follow the order."
          >
            <div className="px-5 py-5">
              <ShareTrackingLink
                href={await trackUrlFor(orderNumber(order))}
              />
            </div>
          </SectionCard>

          <SectionCard title="Details">
            <dl>
              <DataRow label="Order number">
                <span className="font-mono">{orderNumber(order)}</span>
              </DataRow>
              {order.paystackReference ? (
                <DataRow label="Payment ref">
                  <span className="font-mono break-all">{order.paystackReference}</span>
                </DataRow>
              ) : null}
              <DataRow label="Buyer email">{order.buyerEmail ?? "—"}</DataRow>
              <DataRow label="Buyer phone">
                {formatPhone(order.customerPhone)}
              </DataRow>
              <DataRow label="Delivery address">
                {order.deliveryAddress || "Not required"}
              </DataRow>
              <DataRow label="Vendor phone">
                <span className="font-mono">{formatPhone(order.vendorPhone)}</span>
              </DataRow>
              {order.driverPhone ? (
                <DataRow label="Rider">
                  <span className="flex items-center gap-2">
                    <Truck size={16} className="text-ink-muted" aria-hidden="true" />
                    {formatPhone(order.driverPhone)}
                  </span>
                </DataRow>
              ) : null}
              {order.driverTransferReference ? (
                <DataRow label="Rider transfer">
                  <span className="font-mono break-all">
                    {order.driverTransferReference}
                  </span>
                </DataRow>
              ) : null}
              <DataRow label="Order id">
                <span className="font-mono break-all">{order.id}</span>
              </DataRow>
              {order.heldAt ? (
                <DataRow label="Funds held">{formatDateTime(order.heldAt)}</DataRow>
              ) : null}
              {order.deliveredAt ? (
                <DataRow label="Delivered">
                  {formatDateTime(order.deliveredAt)}
                </DataRow>
              ) : null}
              {order.releaseDueAt ? (
                <DataRow label="Auto-release">
                  {formatDateTime(order.releaseDueAt)}
                </DataRow>
              ) : null}
              {order.releasedAt ? (
                <DataRow label="Released">
                  {formatDateTime(order.releasedAt)}
                </DataRow>
              ) : null}
              {order.refundReference ? (
                <DataRow label="Refund reference">
                  <span className="font-mono break-all">{order.refundReference}</span>
                </DataRow>
              ) : null}
            </dl>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
