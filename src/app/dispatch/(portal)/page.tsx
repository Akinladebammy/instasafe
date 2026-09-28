import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Package, Wallet } from "@phosphor-icons/react/dist/ssr";
import { redirect } from "next/navigation";

import { Money, SectionCard, StatTile } from "@/components/dashboard/parts";
import { StatusPill } from "@/components/dashboard/status-pill";
import { formatDateTime, formatPhone, pluralize } from "@/lib/money";
import { isRiderActionable, isRiderCompleted } from "@/lib/order-status";
import { decodeDispatchOrders, orderNumber } from "@/lib/types";
import { DispatchApiError, getDispatchToken, listAssigned } from "@/lib/dispatch-api";

export const metadata: Metadata = {
  title: "My deliveries — InstaSafe",
  robots: { index: false, follow: false },
};

export default async function DispatchHome({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const token = await getDispatchToken();
  if (!token) redirect("/dispatch/login");

  const result = await listAssigned(token, { page: 1, pageSize: 100 }).catch(
    (error: unknown) => error as DispatchApiError,
  );

  if (result instanceof DispatchApiError) {
    if (result.status === 401) redirect("/dispatch/login");
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink">
          My deliveries
        </h1>
        <div className="rounded-2xl border border-cinnamon-wood-400 bg-cinnamon-wood-50 p-5 dark:border-cinnamon-wood-700 dark:bg-cinnamon-wood-950">
          <p className="text-sm leading-6 text-cinnamon-wood-900 dark:text-cinnamon-wood-200">
            {result.message}
          </p>
        </div>
      </div>
    );
  }

  const orders = decodeDispatchOrders(result.orders);
  const awaiting = orders.filter((order) => isRiderActionable(order.statusKey));
  const completed = orders.filter((order) => isRiderCompleted(order.statusKey));
  const showCompleted = params.status !== "awaiting";

  const visible = showCompleted ? orders : awaiting;
  // `DispatchOrderDto` deliberately has no `amountKobo` — a rider never handles
  // the order value, and `deliveryFeeKobo` is their own payout. So the only
  // money this screen quotes is what they actually earned.
  const completedFee = completed.reduce((sum, o) => sum + (o.deliveryFeeKobo ?? 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
          My deliveries
        </h1>
        <p className="mt-2 max-w-2xl text-base leading-7 text-ink-muted">
          Everything assigned to your number. Ask the buyer for their one-time
          code to confirm a handover.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          label="Waiting on you"
          value={String(awaiting.length)}
          hint="Funds held until you confirm"
          tone={awaiting.length ? "warn" : "neutral"}
        />
        <StatTile
          label="Confirmed"
          value={String(completed.length)}
          hint="In the 24-hour buyer window"
          tone={completed.length ? "good" : "neutral"}
        />
        <StatTile
          label="Fees earned"
          value={<Money kobo={completedFee} compact />}
          hint="Paid on each confirmed drop"
          tone="good"
        />
      </div>

      <nav aria-label="Filter deliveries">
        <ul className="flex flex-wrap gap-2">
          {(
            [
              { key: "all", label: "All" },
              { key: "awaiting", label: "Waiting on me" },
            ] as const
          ).map((item) => {
            const active = (params.status ?? "all") === item.key;
            return (
              <li key={item.key}>
                <Link
                  href={item.key === "all" ? "/dispatch" : `/dispatch?status=${item.key}`}
                  aria-current={active ? "true" : undefined}
                  className={
                    active
                      ? "inline-flex min-h-9 items-center rounded-full border border-blue-spruce-800 bg-blue-spruce-800 px-3 text-xs font-semibold text-blue-spruce-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      : "inline-flex min-h-9 items-center rounded-full border border-line bg-surface px-3 text-xs font-semibold text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  }
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {visible.length === 0 ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="px-5 py-14 text-center">
            <Package size={28} className="mx-auto text-ink-muted" aria-hidden="true" />
            <p className="mt-4 text-base font-semibold text-ink">
              {awaiting.length === 0 ? "No deliveries assigned" : "Nothing waiting on you"}
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-muted">
              {awaiting.length === 0
                ? "When a vendor assigns you a delivery, it appears here with the drop details."
                : "Every delivery assigned to you has been confirmed."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((order) => (
            <SectionCard
              key={order.id}
              title={order.customerName ?? "Customer"}
              description={`${orderNumber(order)} · ${pluralize(order.items?.length ?? 0, "item")}`}
              action={<StatusPill status={order.statusKey} />}
            >
              <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase">
                    Drop off
                  </p>
                  <p className="mt-1.5 text-sm leading-6 text-ink">
                    {order.deliveryAddress || "No address on this order"}
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">
                    {order.customerName ?? "Customer"} ·{" "}
                    {formatPhone(order.customerPhone)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase">
                    Your fee
                  </p>
                  <p className="mt-1.5 text-sm text-semibold text-ink">
                    <Money kobo={order.deliveryFeeKobo} />
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {pluralize(order.items?.length ?? 0, "item")} ·{" "}
                    {orderNumber(order)}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {isRiderCompleted(order.statusKey) ? "Confirmed" : "Held until you confirm"}{" "}
                    {order.deliveredAt ? formatDateTime(order.deliveredAt) : ""}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-4">
                <Link
                  href={`/dispatch/${order.id}`}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-line bg-canvas px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  {isRiderActionable(order.statusKey)
                    ? "Confirm delivery"
                    : "View details"}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
                {isRiderCompleted(order.statusKey) ? (
                  <p className="flex items-center gap-1.5 text-sm text-ink-muted">
                    <Wallet size={16} aria-hidden="true" />
                    Buyer has {order.releaseDueAt ? "until their window closes" : "been notified"}. Funds
                    release automatically.
                  </p>
                ) : null}
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      <p className="text-xs leading-5 text-ink-muted">
        Deliveries disappear from this list once the backend releases or refunds
        them. The rider fee is paid by the backend on confirmation.
      </p>
    </div>
  );
}
