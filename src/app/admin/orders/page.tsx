import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { FilterChips, PageStepper } from "@/components/admin/filter-chips";
import {
  EmptyState,
  Money,
  SectionCard,
  StatTile,
} from "@/components/dashboard/parts";
import { StatusPill } from "@/components/dashboard/status-pill";
import { getAdminToken, listAdminOrders } from "@/lib/admin-api";
import { formatDateTime, formatPhone, pluralize } from "@/lib/money";
import { statusLabel, type OrderStatusKey } from "@/lib/order-status";
import { decodeOrder, orderNumber } from "@/lib/types";

export const metadata: Metadata = {
  title: "All orders — InstaSafe console",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 20;

const STATUSES: OrderStatusKey[] = [
  "Held",
  "Delivered",
  "Disputed",
  "AwaitingPayment",
  "Released",
  "Refunded",
  "Draft",
  "Cancelled",
];

function isStatus(value: string | undefined): value is OrderStatusKey {
  return STATUSES.includes(value as OrderStatusKey);
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const token = await getAdminToken();
  if (!token) redirect("/login");

  const status = isStatus(params.status) ? params.status : "all";
  const q = params.q?.trim() ?? "";
  const page = Math.max(1, Number(params.page) || 1);

  // Both filters are applied by the backend, not here, so a filtered view pages
  // through the real result set rather than one fetched window. `q` matches the
  // order number or the Paystack reference, which is what a support agent has in
  // front of them when a buyer reads a number down the phone.
  const raw = await listAdminOrders(token, {
    status: status === "all" ? undefined : status,
    q: q || undefined,
    page,
    pageSize: PAGE_SIZE + 1,
  });
  const hasNext = raw.length > PAGE_SIZE;
  const orders = raw.slice(0, PAGE_SIZE).map(decodeOrder);

  const totalKobo = orders.reduce((sum, order) => sum + order.totalKobo, 0);
  const heldKobo = orders
    .filter((order) => order.statusKey === "Held")
    .reduce((sum, order) => sum + order.totalKobo, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
          All orders
        </h1>
        <p className="mt-2 max-w-2xl text-base leading-7 text-ink-muted">
          Every order on the platform, any vendor. Refunds, dispute resolutions
          and force-releases are available on each order.
        </p>
      </div>

      <form action="/admin/orders" method="get" className="flex flex-wrap items-end gap-3">
        {status !== "all" ? (
          <input type="hidden" name="status" value={status} />
        ) : null}
        <div className="min-w-0 flex-1 sm:max-w-md">
          <label htmlFor="q" className="block text-sm font-semibold text-ink">
            Find an order
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="IS-8K4N2Q or a payment reference"
            className="mt-2 w-full rounded-xl border border-line bg-surface px-3 py-2.5 font-mono text-sm text-ink placeholder:font-sans placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          />
        </div>
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-spruce-800 px-4 text-sm font-semibold text-blue-spruce-50 transition-colors hover:bg-blue-spruce-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Search
        </button>
        {q ? (
          <Link
            href="/admin/orders"
            className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Clear
          </Link>
        ) : null}
      </form>

      <FilterChips
        basePath="/admin/orders"
        param="status"
        active={status}
        extraParams={q ? { q } : {}}
        options={[
          { key: "all", label: "All" },
          ...STATUSES.map((key) => ({ key, label: statusLabel(key) })),
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="On this page" value={orders.length} />
        <StatTile
          label="Value on this page"
          value={<Money kobo={totalKobo} compact />}
        />
        <StatTile
          label="Still in escrow here"
          value={<Money kobo={heldKobo} compact />}
          tone="info"
          hint="Sum of held orders on this page only."
        />
      </div>

      <SectionCard title="Orders">
        {orders.length === 0 ? (
          <EmptyState
            title="No orders match"
            description={
              q
                ? `Nothing matches "${q}". Check the order number or payment reference.`
                : "Nothing on the platform is in that state right now."
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {orders.map((order) => (
              <li key={order.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/orders/${encodeURIComponent(order.id)}`}
                        className="font-mono text-sm font-semibold text-brand hover:text-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      >
                        {orderNumber(order)}
                      </Link>
                      <StatusPill status={order.statusKey} />
                    </div>
                    <p className="mt-1.5 text-sm text-ink">
                      {order.customerName ?? "Buyer"}
                      <span className="text-ink-muted">
                        {" "}
                        · {formatPhone(order.customerPhone)}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      Vendor {formatPhone(order.vendorPhone)} ·{" "}
                      {pluralize(order.items?.length ?? 0, "item")} ·{" "}
                      {formatDateTime(order.heldAt ?? order.releasedAt)}
                    </p>
                  </div>
                  <p className="text-base font-semibold text-ink">
                    <Money kobo={order.totalKobo} />
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <PageStepper
          basePath="/admin/orders"
          page={page}
          hasNext={hasNext}
          extraParams={{ ...(status === "all" ? {} : { status }), ...(q ? { q } : {}) }}
        />
      </SectionCard>

      <p className="text-xs leading-5 text-ink-muted">
        Status filters are applied by the backend, so a filtered view pages
        through the real result set rather than one fetched window.
      </p>
    </div>
  );
}
