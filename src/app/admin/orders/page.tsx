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
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const token = await getAdminToken();
  if (!token) redirect("/login");

  const status = isStatus(params.status) ? params.status : "all";
  const page = Math.max(1, Number(params.page) || 1);

  // The status filter is applied by the backend, not here, so a filtered view
  // pages through the real result set rather than one fetched window.
  const raw = await listAdminOrders(token, {
    status: status === "all" ? undefined : status,
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

      <FilterChips
        basePath="/admin/orders"
        param="status"
        active={status}
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
            description="Nothing on the platform is in that state right now."
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
          extraParams={status === "all" ? {} : { status }}
        />
      </SectionCard>

      <p className="text-xs leading-5 text-ink-muted">
        Status filters are applied by the backend, so a filtered view pages
        through the real result set rather than one fetched window.
      </p>
    </div>
  );
}
