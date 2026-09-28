import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageStepper } from "@/components/admin/filter-chips";
import {
  EmptyState,
  ErrorNote,
  Money,
  SectionCard,
  StatTile,
} from "@/components/dashboard/parts";
import { StatusPill } from "@/components/dashboard/status-pill";
import { adminResolveDisputeAction } from "@/app/admin/actions";
import { ConfirmSubmit } from "@/components/dashboard/confirm-submit";
import {
  getAdminToken,
  listDisputes,
} from "@/lib/admin-api";
import { formatDateTime, formatPhone } from "@/lib/money";
import { decodeOrder, orderNumber } from "@/lib/types";

export const metadata: Metadata = {
  title: "Disputes — InstaSafe console",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 10;

export default async function AdminDisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const token = await getAdminToken();
  if (!token) redirect("/login");

  const page = Math.max(1, Number(params.page) || 1);
  // Ask for one row past the page so "is there a next page" is answerable
  // without a total count — the API returns a bare array here.
  const raw = await listDisputes(token, { page, pageSize: PAGE_SIZE + 1 });
  const hasNext = raw.length > PAGE_SIZE;
  const disputes = raw.slice(0, PAGE_SIZE).map(decodeOrder);

  const totalKobo = disputes.reduce((sum, order) => sum + order.totalKobo, 0);

  // The API has no `disputeRaisedAt`, so age is measured from when the money
  // entered escrow — the floor for how long a buyer could have been waiting.
  const oldestHeld = disputes
    .map((order) => order.heldAt)
    .filter((value): value is string => Boolean(value))
    .sort()[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
          Disputes
        </h1>
        <p className="mt-2 max-w-2xl text-base leading-7 text-ink-muted">
          Oldest first, because that is the order buyers are waiting in. Every
          decision is written to the moderation log.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          label="On this page"
          value={disputes.length}
          hint={hasNext ? "More are queued behind this page." : "That is the whole queue."}
        />
        <StatTile
          label="Value at stake"
          value={<Money kobo={totalKobo} compact />}
          hint="Held escrow these decisions release or return."
          tone="info"
        />
        <StatTile
          label="Longest in escrow"
          value={disputes.length ? formatDateTime(oldestHeld) : "—"}
          hint={
            disputes.length
              ? "Funds have been sitting since this date."
              : "Nothing is waiting."
          }
          tone={disputes.length ? "warn" : "good"}
        />
      </div>

      <SectionCard
        title="Open disputes"
        description="Release pays the vendor the remainder; refund returns the buyer their full amount."
      >
        {disputes.length === 0 ? (
          <EmptyState
            title="Nothing is disputed"
            description="No buyer is currently waiting on a release-or-refund decision."
          />
        ) : (
          <ul className="divide-y divide-line">
            {disputes.map((order) => (
              <li key={order.id} className="space-y-4 px-5 py-5">
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
                    <p className="mt-1.5 text-sm text-ink-muted">
                      {order.customerName ?? "Buyer"} ·{" "}
                      {formatPhone(order.customerPhone)}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-ink-muted">
                      Vendor {formatPhone(order.vendorPhone)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-ink">
                      <Money kobo={order.amountKobo} />
                    </p>
                    {(order.deliveryFeeKobo ?? 0) > 0 ? (
                      <p className="mt-0.5 text-xs text-ink-muted">
                        + <Money kobo={order.deliveryFeeKobo} /> delivery
                      </p>
                    ) : null}
                  </div>
                </div>

                {order.disputeReason ? (
                  <blockquote className="rounded-xl border-l-4 border-cinnamon-wood-400 bg-canvas px-4 py-3 text-sm leading-6 text-ink">
                    {order.disputeReason}
                  </blockquote>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                  <ConfirmSubmit
                    action={adminResolveDisputeAction}
                    hidden={{ orderId: order.id, resolution: "release" }}
                    label="Release to vendor"
                    confirmLabel="Yes, release the funds"
                    question={`Pay the vendor the escrow remainder on ${orderNumber(order)}? The dispute closes and the buyer is told.`}
                    pendingLabel="Releasing…"
                  />
                  <ConfirmSubmit
                    action={adminResolveDisputeAction}
                    hidden={{ orderId: order.id, resolution: "refund" }}
                    label="Refund buyer"
                    confirmLabel="Yes, refund the buyer"
                    question={`Refund ${order.customerName ?? "the buyer"} in full on ${orderNumber(order)}? The vendor receives nothing.`}
                    pendingLabel="Refunding…"
                  />
                  <Link
                    href={`/admin/orders/${encodeURIComponent(order.id)}`}
                    className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    Inspect
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
        <PageStepper basePath="/admin/disputes" page={page} hasNext={hasNext} />
      </SectionCard>

      <ErrorNote
        title="Before you resolve"
        message="A refund is a real Paystack reversal and cannot be undone from this console. Release is final for the vendor's payout. If the buyer's claim needs verification you cannot do here, leave the dispute open and resolve it from the order page with a note instead."
      />
    </div>
  );
}
