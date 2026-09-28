import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

import {
  adminForceReleaseAction,
  adminRefundAction,
  adminResolveDisputeAction,
} from "@/app/admin/actions";
import { ActionForm } from "@/components/dashboard/action-form";
import { ConfirmSubmit } from "@/components/dashboard/confirm-submit";
import {
  DataRow,
  ErrorNote,
  Money,
  SectionCard,
} from "@/components/dashboard/parts";
import { StatusPill, Tag } from "@/components/dashboard/status-pill";
import { AdminApiError, getAdminOrder, getAdminToken } from "@/lib/admin-api";
import { formatCountdown, formatDateTime, formatPhone } from "@/lib/money";
import { canRefund, isDigitalFulfilment } from "@/lib/order-status";
import { decodeOrder, orderNumber } from "@/lib/types";

export const metadata: Metadata = {
  title: "Order — InstaSafe console",
  robots: { index: false, follow: false },
};

const inputClass =
  "w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

export default async function AdminOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const token = await getAdminToken();
  if (!token) redirect("/login");

  let raw;
  try {
    raw = await getAdminOrder(token, id);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 404) notFound();
    if (error instanceof AdminApiError && error.status === 401) redirect("/login");
    return (
      <div className="space-y-6">
        <BackLink />
        <ErrorNote
          title="We could not load this order"
          message={
            error instanceof AdminApiError
              ? error.message
              : "The InstaSafe service could not be reached."
          }
        />
      </div>
    );
  }

  if (!raw) notFound();

  const order = decodeOrder(raw);
  const digital = isDigitalFulfilment(order.fulfillmentKey);
  const refundable = canRefund(order.statusKey);
  const disputed = order.statusKey === "Disputed";
  // force-release pays the vendor from Held, Delivered or Disputed; anything
  // else is a 409 from the backend, so the control is hidden rather than
  // offered and then refused.
  const forceReleasable = ["Held", "Delivered", "Disputed"].includes(
    order.statusKey,
  );

  return (
    <div className="space-y-8">
      <div>
        <BackLink />

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
              {order.customerName ?? "Order"}
            </h1>
            <p className="mt-2 font-mono text-sm break-all text-ink-muted">
              {orderNumber(order)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={order.statusKey} />
            <Tag>{digital ? "Digital" : "Dispatch"}</Tag>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <p className="text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase">
            Escrow total
          </p>
          <p className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-ink">
            <Money kobo={order.totalKobo} />
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5">
          <p className="text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase">
            Delivery fee
          </p>
          <p className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-ink">
            <Money kobo={order.deliveryFeeKobo} />
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5">
          <p className="text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase">
            Auto-release
          </p>
          <p className="mt-3 text-base font-semibold text-ink">
            {order.releaseDueAt ? formatCountdown(order.releaseDueAt) : "—"}
          </p>
          {order.releaseDueAt ? (
            <p className="mt-2 text-sm text-ink-muted">
              {formatDateTime(order.releaseDueAt)}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <SectionCard title="Moderation">
            <div className="space-y-6 px-5 py-5">
              {disputed ? (
                <div className="rounded-xl border border-cinnamon-wood-400 bg-cinnamon-wood-50 p-4 dark:border-cinnamon-wood-700 dark:bg-cinnamon-wood-950">
                  <p className="text-sm font-semibold text-cinnamon-wood-950 dark:text-cinnamon-wood-100">
                    Disputed by the buyer
                  </p>
                  {order.disputeReason ? (
                    <p className="mt-2 text-sm leading-6 text-cinnamon-wood-900 dark:text-cinnamon-wood-200">
                      {order.disputeReason}
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <ConfirmSubmit
                      action={adminResolveDisputeAction}
                      hidden={{ orderId: order.id, resolution: "release" }}
                      label="Release to vendor"
                      confirmLabel="Yes, release the funds"
                      question="Release the escrow remainder to the vendor? The dispute closes."
                      pendingLabel="Releasing…"
                    />
                    <ConfirmSubmit
                      action={adminResolveDisputeAction}
                      hidden={{ orderId: order.id, resolution: "refund" }}
                      label="Refund buyer"
                      confirmLabel="Yes, refund the buyer"
                      question="Refund the buyer in full? The vendor receives nothing from this order."
                      pendingLabel="Refunding…"
                    />
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                {refundable ? (
                  <ConfirmSubmit
                    action={adminRefundAction}
                    hidden={{ orderId: order.id }}
                    label="Refund order"
                    confirmLabel="Yes, issue the refund"
                    question={`Refund ${orderNumber(order)} in full through Paystack? This reverses real money and cannot be undone from here.`}
                    pendingLabel="Refunding…"
                  />
                ) : (
                  <p className="text-sm text-ink-muted">
                    A refund is only possible while funds are held or the order
                    is delivered. This order is{" "}
                    <span className="font-semibold text-ink">
                      {order.statusKey}
                    </span>
                    .
                  </p>
                )}
              </div>

              {forceReleasable ? (
                <div className="border-t border-line pt-5">
                  <ActionForm
                    action={adminForceReleaseAction}
                    hidden={{ orderId: order.id }}
                    submitLabel="Force release to vendor"
                    pendingLabel="Releasing…"
                    variant="secondary"
                    className="max-w-xl"
                  >
                    <div>
                      <label
                        htmlFor="note"
                        className="block text-sm font-semibold text-ink"
                      >
                        Reason
                      </label>
                      <p className="mt-1 text-sm leading-6 text-ink-muted">
                        Pays the vendor the escrow remainder now, skipping the
                        buyer window. The note is stored on the audit record.
                      </p>
                      <input
                        id="note"
                        name="note"
                        type="text"
                        required
                        minLength={5}
                        maxLength={280}
                        placeholder="Delivered on WhatsApp, buyer confirmed by phone…"
                        className={`${inputClass} mt-3`}
                      />
                    </div>
                  </ActionForm>
                </div>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard title="Items">
            <ul className="divide-y divide-line">
              {(order.items ?? []).map((item, index) => (
                <li
                  key={`${item.description}-${index}`}
                  className="flex flex-wrap items-baseline justify-between gap-3 px-5 py-3"
                >
                  <span className="text-sm text-ink">
                    <span className="font-semibold tabular-nums">
                      {item.quantity ?? 1}×
                    </span>{" "}
                    {item.description ?? "Item"}
                  </span>
                  <span className="text-sm tabular-nums text-ink-muted">
                    <Money
                      kobo={(item.unitPriceKobo ?? 0) * (item.quantity ?? 0)}
                    />
                  </span>
                </li>
              ))}
              {digital ? null : (
                <li className="flex items-baseline justify-between gap-3 px-5 py-3">
                  <span className="text-sm text-ink">Delivery fee</span>
                  <span className="text-sm tabular-nums text-ink-muted">
                    <Money kobo={order.deliveryFeeKobo} />
                  </span>
                </li>
              )}
            </ul>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Parties">
            <dl>
              <DataRow label="Buyer">
                {order.customerName ?? "—"}{" "}
                <span className="font-mono text-ink-muted">
                  {formatPhone(order.customerPhone)}
                </span>
              </DataRow>
              <DataRow label="Buyer email">{order.buyerEmail ?? "—"}</DataRow>
              <DataRow label="Vendor">
                <span className="font-mono">
                  {formatPhone(order.vendorPhone)}
                </span>
              </DataRow>
              <DataRow label="Rider">
                {order.driverPhone ? (
                  <span className="font-mono">
                    {formatPhone(order.driverPhone)}
                  </span>
                ) : (
                  "—"
                )}
              </DataRow>
              <DataRow label="Delivery address">
                {order.deliveryAddress ?? "—"}
              </DataRow>
            </dl>
          </SectionCard>

          <SectionCard title="Payment trail">
            <dl>
              <DataRow label="Order number">
                <span className="font-mono">{orderNumber(order)}</span>
              </DataRow>
              <DataRow label="Payment ref">
                <span className="font-mono break-all">
                  {order.paystackReference ?? "—"}
                </span>
              </DataRow>
              <DataRow label="Virtual account">
                {order.payVirtualAccountNumber
                  ? `${order.payVirtualAccountNumber} · ${order.payVirtualAccountBank ?? ""}`
                  : "—"}
              </DataRow>
              <DataRow label="Held">{formatDateTime(order.heldAt)}</DataRow>
              <DataRow label="Delivered">
                {formatDateTime(order.deliveredAt)}
              </DataRow>
              <DataRow label="Released">
                {formatDateTime(order.releasedAt)}
              </DataRow>
              <DataRow label="Transfer ref">
                <span className="font-mono break-all">
                  {order.transferReference ?? "—"}
                </span>
              </DataRow>
              <DataRow label="Refund ref">
                <span className="font-mono break-all">
                  {order.refundReference ?? "—"}
                </span>
              </DataRow>
              <DataRow label="Order id">
                <span className="font-mono break-all text-xs">{order.id}</span>
              </DataRow>
            </dl>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/admin/orders"
      className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <ArrowLeft size={16} aria-hidden="true" />
      Back to orders
    </Link>
  );
}
