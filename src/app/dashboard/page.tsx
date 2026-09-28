import Link from "next/link";
import { ArrowRight, Warning } from "@phosphor-icons/react/dist/ssr";
import { redirect } from "next/navigation";

import {
  EmptyState,
  ErrorNote,
  Money,
  PrimaryLink,
  SectionCard,
  StatTile,
} from "@/components/dashboard/parts";
import { StatusPill } from "@/components/dashboard/status-pill";
import {
  formatCountdown,
  formatDateTime,
  pluralize,
} from "@/lib/money";
import {
  ACTIVE_STATUSES,
  type OrderStatusKey,
} from "@/lib/order-status";
import { decodeOrders, shortOrderNumber, type DecodedOrder } from "@/lib/types";
import { getVendorToken, listOrders, VendorApiError } from "@/lib/vendor-api";

function sumBy(orders: DecodedOrder[], statuses: OrderStatusKey[]) {
  return orders
    .filter((order) => statuses.includes(order.statusKey))
    .reduce((total, order) => total + order.totalKobo, 0);
}

function countBy(orders: DecodedOrder[], statuses: OrderStatusKey[]) {
  return orders.filter((order) => statuses.includes(order.statusKey)).length;
}

export default async function DashboardPage() {
  const token = await getVendorToken();
  if (!token) redirect("/login");

  const result = await listOrders(token, { page: 1, pageSize: 50 });
  const failed = result instanceof VendorApiError;
  const orders = failed ? [] : decodeOrders(result.orders);

  const heldOrders = orders.filter((order) => order.statusKey === "Held");
  const deliveredOrders = orders.filter((order) => order.statusKey === "Delivered");
  const awaitingOrders = orders.filter(
    (order) => order.statusKey === "AwaitingPayment" || order.statusKey === "Draft",
  );
  const disputedOrders = orders.filter((order) => order.statusKey === "Disputed");
  const releasedOrders = orders.filter((order) => order.statusKey === "Released");

  const inFlightKobo = sumBy(orders, ACTIVE_STATUSES);
  const heldKobo = sumBy(heldOrders, ["Held"]);
  const deliveredKobo = sumBy(deliveredOrders, ["Delivered"]);
  const disputedKobo = sumBy(disputedOrders, ["Disputed"]);
  const releasedKobo = sumBy(releasedOrders, ["Released"]);

  // Released funds arrive asynchronously, so the count is more honest than a
  // sum when we only hold a partial page.
  const partial = result.totalCount === null && orders.length >= 50;

  const recent = orders.slice(0, 6);
  const needsAttention = [...disputedOrders, ...deliveredOrders].slice(0, 4);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
          Order control room
        </h1>
        <p className="mt-2 max-w-2xl text-base leading-7 text-ink-muted">
          Every sale, its escrow state and the moment funds become yours. Payment
          release is decided by the backend, not this page.
        </p>
      </div>

      {failed ? (
        <ErrorNote
          title="We could not load your orders"
          message={
            result.status === 401
              ? "Your session expired. Log in again to see your orders."
              : result.message
          }
          action={<PrimaryLink href="/login">Log in again</PrimaryLink>}
        />
      ) : null}

      {!failed ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="In flight"
            value={<Money kobo={inFlightKobo} compact />}
            hint={`${pluralize(countBy(orders, ACTIVE_STATUSES), "active order")} across held, delivered and disputed`}
          />
          <StatTile
            label="Held in escrow"
            value={<Money kobo={heldKobo} compact />}
            hint={`${pluralize(heldOrders.length, "order")} awaiting delivery confirmation`}
            tone={heldKobo > 0 ? "warn" : "neutral"}
          />
          <StatTile
            label="In inspection window"
            value={<Money kobo={deliveredKobo} compact />}
            hint={
              deliveredOrders.length
                ? `Releases ${formatCountdown(deliveredOrders[0].releaseDueAt)}`
                : "Nothing waiting on the buyer"
            }
            tone={deliveredOrders.length ? "info" : "neutral"}
          />
          <StatTile
            label="Disputed"
            value={<Money kobo={disputedKobo} compact />}
            hint={
              disputedOrders.length
                ? `${pluralize(disputedOrders.length, "order")} frozen — resolve to release or refund`
                : "No frozen funds"
            }
            tone={disputedOrders.length ? "bad" : "good"}
          />
        </div>
      ) : null}

      {!failed && needsAttention.length > 0 ? (
        <SectionCard
          title="Needs your decision"
          description="Disputes are frozen and delivered orders release on their own. Both can be acted on now."
        >
          <ul>
            {needsAttention.map((order) => (
              <li key={order.id} className="border-b border-line last:border-b-0">
                <Link
                  href={`/dashboard/orders/${order.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink">
                      {order.customerName ?? "Customer"}
                    </span>
                    <span className="mt-0.5 block text-xs tabular-nums text-ink-muted">
                      <Money kobo={order.totalKobo} /> ·{" "}
                      {shortOrderNumber(order)}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <StatusPill status={order.statusKey} />
                    <ArrowRight size={16} aria-hidden="true" className="text-ink-muted" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <SectionCard
          title="Recent orders"
          description={partial ? "Newest first, from the most recent 50." : "Newest first."}
          action={
            <Link
              href="/dashboard/orders"
              className="inline-flex min-h-9 items-center rounded-lg px-2 text-sm font-semibold text-brand underline decoration-blue-spruce-300 underline-offset-4 hover:text-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              View all
            </Link>
          }
        >
          {recent.length === 0 ? (
            <EmptyState
              title="No orders yet"
              description="Once a buyer pays one of your protected links, the order and its escrow state show up here."
            />
          ) : (
            <ul>
              {recent.map((order) => (
                <li key={order.id} className="border-b border-line last:border-b-0">
                  <Link
                    href={`/dashboard/orders/${order.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {order.customerName ?? "Customer"}
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-muted">
                        {formatDateTime(order.heldAt ?? order.deliveredAt)}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-sm font-semibold tabular-nums text-ink">
                        <Money kobo={order.totalKobo} />
                      </span>
                      <StatusPill status={order.statusKey} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Awaiting payment" description="Buyers who have not paid yet.">
            {awaitingOrders.length === 0 ? (
              <EmptyState
                title="Nothing outstanding"
                description="Every protected link you shared has been paid."
              />
            ) : (
              <ul>
                {awaitingOrders.slice(0, 5).map((order) => (
                  <li
                    key={order.id}
                    className="flex items-center justify-between gap-3 border-b border-line px-5 py-3 last:border-b-0"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink">
                        {order.customerName ?? "Customer"}
                      </span>
                      <span className="block text-xs tabular-nums text-ink-muted">
                        <Money kobo={order.totalKobo} />
                      </span>
                    </span>
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="inline-flex min-h-9 shrink-0 items-center rounded-lg border border-line bg-canvas px-2.5 text-xs font-semibold text-ink hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                    >
                      Get link
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Released" description="Funds the backend has paid out.">
            <div className="px-5 py-5">
              <p className="text-2xl font-semibold tabular-nums text-shamrock-800 dark:text-shamrock-200">
                <Money kobo={releasedKobo} />
              </p>
              <p className="mt-1.5 text-sm text-ink-muted">
                {releasedOrders.length
                  ? `${pluralize(releasedOrders.length, "order")} completed`
                  : "No completed payouts yet"}
              </p>
            </div>
          </SectionCard>

          {orders.length > 0 && partial ? (
            <p className="flex items-start gap-2 text-xs leading-5 text-ink-muted">
              <Warning size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
              Totals cover the 50 most recent orders only. Use Orders for the full
              history.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
