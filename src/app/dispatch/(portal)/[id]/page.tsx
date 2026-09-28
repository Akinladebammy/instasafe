import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Hash, MapPin, Phone } from "@phosphor-icons/react/dist/ssr";
import { notFound, redirect } from "next/navigation";

import { CopyButton } from "@/components/dashboard/copy-button";
import { DeliveryConfirm } from "@/components/dispatch/delivery-confirm";
import { DataRow, Money, SectionCard, StatTile } from "@/components/dashboard/parts";
import { StatusPill, Tag } from "@/components/dashboard/status-pill";
import { formatCountdown, formatDateTime, formatPhone } from "@/lib/money";
import { isRiderActionable, isRiderCompleted } from "@/lib/order-status";
import { decodeDispatchOrder, orderNumber } from "@/lib/types";
import {
  DispatchApiError,
  getDispatchToken,
  listAssigned,
} from "@/lib/dispatch-api";

export const metadata: Metadata = {
  title: "Delivery — InstaSafe",
  robots: { index: false, follow: false },
};

export default async function DispatchOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const token = await getDispatchToken();
  if (!token) redirect("/dispatch/login");

  // Riders have no per-order endpoint, so confirm the delivery is theirs by
  // finding it in their own assigned list. That also keeps ownership
  // enforcement server-side.
  const result = await listAssigned(token, { page: 1, pageSize: 100 }).catch(
    (error: unknown) => error as DispatchApiError,
  );

  if (result instanceof DispatchApiError) {
    if (result.status === 401) redirect("/dispatch/login");
    notFound();
  }

  const raw = result.orders.find((entry) => entry.id === id);
  if (!raw) notFound();

  const order = decodeDispatchOrder(raw);
  const items = order.items ?? [];
  const actionable = isRiderActionable(order.statusKey);
  const completed = isRiderCompleted(order.statusKey);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/dispatch"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to deliveries
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
              {order.customerName ?? "Customer"}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-2 font-mono text-sm text-ink-muted">
              <Hash size={15} aria-hidden="true" />
              <span className="break-all">{orderNumber(order)}</span>
              <CopyButton value={orderNumber(order)} label="order number" />
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={order.statusKey} />
            <Tag>Rider delivery</Tag>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          label="Your fee"
          value={<Money kobo={order.deliveryFeeKobo} />}
          hint="Paid by the backend the moment you confirm."
          tone="good"
        />
        <StatTile
          label="Buyer phone"
          value={formatPhone(order.customerPhone)}
          hint="Call if you cannot find the drop"
        />
        <StatTile
          label={completed ? "Buyer window" : "Funds"}
          value={completed ? formatCountdown(order.releaseDueAt) : "Held in escrow"}
          hint={
            completed
              ? "The buyer can still raise a dispute before it closes"
              : "Released once you confirm delivery"
          }
          tone={completed ? "info" : "warn"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <SectionCard
            title="Drop details"
            description="Hand the parcel over at this address only."
          >
            <div className="px-5 py-5">
              <p className="flex items-start gap-2 text-base font-medium text-ink">
                <MapPin size={18} className="mt-0.5 shrink-0 text-ink-muted" aria-hidden="true" />
                <span className="min-w-0 break-words">
                  {order.deliveryAddress || "No address on this order"}
                </span>
              </p>
              <p className="mt-3 flex items-center gap-2 text-sm text-ink-muted">
                <Phone size={16} aria-hidden="true" />
                {formatPhone(order.customerPhone)}
              </p>
            </div>
          </SectionCard>

          <SectionCard
            title="Items"
            description={items.length ? pluralise(items.length) : undefined}
          >
            {items.length === 0 ? (
              <p className="px-5 py-6 text-sm text-ink-muted">
                The backend did not return line items for this delivery.
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
                        {((item.unitPriceKobo ?? 0) / 100).toLocaleString("en-NG", {
                          style: "currency",
                          currency: "NGN",
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          <DeliveryConfirm
            orderId={order.id}
            held={actionable}
            deliveredAt={order.deliveredAt ?? null}
            releaseDueAt={order.releaseDueAt ?? null}
          />

          <SectionCard title="Order record">
            <dl>
              <DataRow label="Order number">
                <span className="font-mono">{orderNumber(order)}</span>
              </DataRow>
              <DataRow label="Your fee">
                <Money kobo={order.deliveryFeeKobo} />
              </DataRow>
              <DataRow label="Your number">
                <span className="font-mono">{formatPhone(order.driverPhone)}</span>
              </DataRow>
              {order.deliveredAt ? (
                <DataRow label="Delivered">{formatDateTime(order.deliveredAt)}</DataRow>
              ) : null}
              {order.releaseDueAt ? (
                <DataRow label="Funds release">
                  {formatDateTime(order.releaseDueAt)}
                </DataRow>
              ) : null}
            </dl>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function pluralise(count: number) {
  return count === 1 ? "1 item" : `${count} items`;
}
