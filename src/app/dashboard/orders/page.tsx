import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  EmptyState,
  ErrorNote,
  Money,
  PrimaryLink,
  StatTile,
} from "@/components/dashboard/parts";
import { StatusPill } from "@/components/dashboard/status-pill";
import { formatDateTime, formatPhone, pluralize } from "@/lib/money";
import { ACTIVE_STATUSES, statusLabel, type OrderStatusKey } from "@/lib/order-status";
import { decodeOrders, shortOrderNumber } from "@/lib/types";
import { getVendorToken, listOrders, VendorApiError } from "@/lib/vendor-api";

export const metadata: Metadata = {
  title: "Orders — InstaSafe",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 10;

type Filter = "all" | "active" | OrderStatusKey;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "AwaitingPayment", label: statusLabel("AwaitingPayment") },
  { key: "Held", label: statusLabel("Held") },
  { key: "Delivered", label: statusLabel("Delivered") },
  { key: "Disputed", label: statusLabel("Disputed") },
  { key: "Released", label: statusLabel("Released") },
  { key: "Refunded", label: statusLabel("Refunded") },
  { key: "Cancelled", label: statusLabel("Cancelled") },
];

function isFilter(value: string | undefined): value is Filter {
  return FILTERS.some((filter) => filter.key === value);
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const token = await getVendorToken();
  if (!token) redirect("/login");

  const filter: Filter = isFilter(params.status) ? params.status : "all";
  const page = Math.max(1, Number(params.page) || 1);

  // Ask for a wider window when filtering so the filter can be applied to more
  // than a single page of history.
  const fetchSize = filter === "all" ? PAGE_SIZE : 100;
  const result = await listOrders(token, { page: 1, pageSize: fetchSize });
  const failed = result instanceof VendorApiError;
  const all = failed ? [] : decodeOrders(result.orders);

  const filtered =
    filter === "all"
      ? all
      : filter === "active"
        ? all.filter((order) => ACTIVE_STATUSES.includes(order.statusKey))
        : all.filter((order) => order.statusKey === filter);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const orders = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const pageKobo = orders.reduce((sum, order) => sum + order.totalKobo, 0);
  const heldKobo = all
    .filter((order) => order.statusKey === "Held")
    .reduce((sum, order) => sum + order.totalKobo, 0);

  const buildHref = (next: { status?: Filter; page?: number }) => {
    const query = new URLSearchParams();
    const nextFilter = next.status ?? filter;
    if (nextFilter !== "all") query.set("status", nextFilter);
    if (next.page && next.page > 1) query.set("page", String(next.page));
    const value = query.toString();
    return value ? `/dashboard/orders?${value}` : "/dashboard/orders";
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
            Orders
          </h1>
          <p className="mt-2 text-base leading-7 text-ink-muted">
            Every protected order on your account, newest first, with the escrow
            state the backend reports.
          </p>
        </div>
        <PrimaryLink href="/dashboard/orders/new">Create Order</PrimaryLink>
      </div>

      {failed ? (
        <ErrorNote
          title="We could not load your orders"
          message={result.status === 401 ? "Your session expired. Log in again." : result.message}
          action={<PrimaryLink href="/login">Log in again</PrimaryLink>}
        />
      ) : null}

      {!failed ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatTile
              label="Matching orders"
              value={String(filtered.length)}
              hint={filter === "all" ? "All statuses" : FILTERS.find((f) => f.key === filter)?.label}
            />
            <StatTile
              label="Value on this page"
              value={<Money kobo={pageKobo} compact />}
              hint="Buyer total including delivery"
            />
            <StatTile
              label="Held in escrow"
              value={<Money kobo={heldKobo} compact />}
              hint="Releases after delivery is confirmed"
              tone={heldKobo > 0 ? "warn" : "neutral"}
            />
          </div>

          <nav aria-label="Filter orders by status">
            <ul className="flex flex-wrap gap-2">
              {FILTERS.map((item) => {
                const active = item.key === filter;
                return (
                  <li key={item.key}>
                    <Link
                      href={buildHref({ status: item.key })}
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

          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            {orders.length === 0 ? (
              <EmptyState
                title={filter === "all" ? "No orders yet" : "Nothing matches this filter"}
                description={
                  filter === "all"
                    ? "Create a protected order and share its payment link with your buyer."
                    : "Try a different status, or clear the filter to see everything."
                }
                action={
                  filter === "all" ? (
                    <PrimaryLink href="/dashboard/orders/new">Create your first order</PrimaryLink>
                  ) : (
                    <Link
                      href="/dashboard/orders"
                      className="inline-flex min-h-11 items-center rounded-xl border border-line bg-canvas px-4 text-sm font-semibold text-ink hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                    >
                      Clear filter
                    </Link>
                  )
                }
              />
            ) : (
              <ul>
                {orders.map((order) => (
                  <li key={order.id} className="border-b border-line last:border-b-0">
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="grid gap-3 px-5 py-4 transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus lg:grid-cols-[1.5fr_1fr_auto_auto] lg:items-center lg:gap-4"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink">
                          {order.customerName ?? "Customer"}
                        </span>
                        <span className="mt-0.5 block font-mono text-xs text-ink-muted">
                          {shortOrderNumber(order)}
                        </span>
                      </span>
                      <span className="min-w-0 text-xs text-ink-muted">
                        <span className="block truncate">
                          {order.customerPhone
                            ? formatPhone(order.customerPhone)
                            : "No phone"}
                        </span>
                        <span className="block truncate">
                          {order.fulfillmentKey} · {pluralize(order.items?.length ?? 0, "item")}
                        </span>
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-ink">
                        <Money kobo={order.totalKobo} />
                      </span>
                      <span className="flex items-center gap-3 lg:justify-end">
                        <StatusPill status={order.statusKey} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {totalPages > 1 ? (
            <nav aria-label="Orders pagination" className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-ink-muted">
                Page {current} of {totalPages} · {pluralize(filtered.length, "order")}
              </p>
              <div className="flex gap-2">
                {current > 1 ? (
                  <Link
                    href={buildHref({ page: current - 1 })}
                    className="inline-flex min-h-11 items-center rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-ink hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    Previous
                  </Link>
                ) : null}
                {current < totalPages ? (
                  <Link
                    href={buildHref({ page: current + 1 })}
                    className="inline-flex min-h-11 items-center rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-ink hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    Next
                  </Link>
                ) : null}
              </div>
            </nav>
          ) : null}

          <p className="text-xs leading-5 text-ink-muted">
            Last checked {formatDateTime(new Date().toISOString())}. Amounts are the
            buyer total, so delivery fees are included.
          </p>
        </>
      ) : null}
    </div>
  );
}
