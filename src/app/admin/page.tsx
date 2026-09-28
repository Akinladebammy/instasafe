import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

import {
  EmptyState,
  ErrorNote,
  Money,
  SectionCard,
  StatTile,
} from "@/components/dashboard/parts";
import { StatusPill } from "@/components/dashboard/status-pill";
import {
  getAdminToken,
  getOutbox,
  getStats,
  listDisputes,
  listWebhooks,
  type AdminStats,
  type OutboxStatus,
  type WebhookEvent,
} from "@/lib/admin-api";
import { formatDateTime, pluralize } from "@/lib/money";
import { statusLabel, toStatusKey } from "@/lib/order-status";
import { decodeOrder, orderNumber } from "@/lib/types";

export const metadata: Metadata = {
  title: "Console — InstaSafe",
  robots: { index: false, follow: false },
};

/**
 * `ordersByStatus` is an open dictionary keyed by the API's own enum values. The
 * deployed service sends integers, so the keys arrive as "0".."7" and are
 * decoded through the same table the rest of the app uses.
 */
function statusCounts(stats: AdminStats) {
  const entries = Object.entries(stats.ordersByStatus ?? {});
  return entries
    .map(([key, count]) => ({ status: toStatusKey(key), count: Number(count) || 0 }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count);
}

function healthTone(value: number | null | undefined) {
  if (!value) return "good" as const;
  return value > 0 ? ("warn" as const) : ("good" as const);
}

export default async function AdminOverviewPage() {
  const token = await getAdminToken();

  // Stats first: the layout already proved the token works, so a failure here
  // is a partial outage rather than an auth problem. The panels degrade on
  // their own instead of blanking the whole console.
  const [stats, disputes, outbox, webhooks] = await Promise.all([
    getStats(token),
    listDisputes(token, { pageSize: 5 }).catch(() => null),
    getOutbox(token).catch(() => null),
    listWebhooks(token, { pageSize: 6 }).catch(() => null),
  ]);

  if (!stats) {
    return <ErrorNote message="The stats endpoint did not respond. Reload to try again." />;
  }

  const counts = statusCounts(stats);
  const outboxErrors: OutboxStatus["recentErrors"] = outbox?.recentErrors ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
          Operations
        </h1>
        <p className="mt-2 max-w-2xl text-base leading-7 text-ink-muted">
          Money currently in escrow, what needs a decision, and whether the
          payment plumbing is healthy.
        </p>
      </div>

      <section aria-label="Platform totals" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Held in escrow"
          value={<Money kobo={stats.heldGmvKobo} compact />}
          hint="Buyer money the backend is still holding."
          tone="info"
        />
        <StatTile
          label="Released today"
          value={<Money kobo={stats.releasedTodayKobo} compact />}
          hint="Paid out to vendors since midnight Lagos."
          tone="good"
        />
        <StatTile
          label="Open disputes"
          value={stats.openDisputes ?? 0}
          hint={
            stats.openDisputes
              ? "Awaiting a release or refund decision."
              : "Nothing is waiting on you."
          }
          tone={stats.openDisputes ? "bad" : "good"}
        />
        <StatTile
          label="Vendors"
          value={
            <>
              {stats.vendorActive ?? 0}
              <span className="text-base font-medium text-ink-muted">
                {" "}
                / {stats.vendorTotal ?? 0} active
              </span>
            </>
          }
          hint="Deactivated vendors keep their orders."
        />
      </section>

      <section
        aria-label="System health"
        className="grid gap-4 sm:grid-cols-3"
      >
        <StatTile
          label="Outbox backlog"
          value={stats.outboxBacklog ?? 0}
          hint="Queued payout and WhatsApp jobs waiting to run."
          tone={healthTone(stats.outboxBacklog)}
        />
        <StatTile
          label="Failed webhooks (24h)"
          value={stats.failedWebhooks24h ?? 0}
          hint="Paystack deliveries that did not verify."
          tone={healthTone(stats.failedWebhooks24h)}
        />
        <StatTile
          label="Drafts open"
          value={stats.openDraftTickets ?? 0}
          hint="Orders created but never paid for."
          tone={healthTone(stats.openDraftTickets)}
        />
      </section>

      {counts.length > 0 ? (
        <SectionCard
          title="Orders by status"
          description="Live counts across every vendor, not just one store."
        >
          <ul className="divide-y divide-line">
            {counts.map((row) => (
              <li
                key={row.status}
                className="flex items-center justify-between gap-4 px-5 py-3"
              >
                <StatusPill status={row.status} />
                <span className="text-sm font-semibold tabular-nums text-ink">
                  {row.count}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Disputes"
          description="Oldest first. Each one is a buyer waiting on money."
          action={
            <Link
              href="/admin/disputes"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-brand hover:text-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              All disputes
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          }
        >
          {!disputes ? (
            <div className="px-5 py-8 text-sm text-ink-muted">
              The disputes endpoint did not respond.
            </div>
          ) : disputes.length === 0 ? (
            <EmptyState
              title="No open disputes"
              description="Nothing is blocked on a release-or-refund decision."
            />
          ) : (
            <ul className="divide-y divide-line">
              {disputes.map((raw) => {
                const order = decodeOrder(raw);
                return (
                  <li key={order.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <Link
                        href={`/admin/orders/${encodeURIComponent(order.id)}`}
                        className="font-mono text-sm font-semibold text-brand hover:text-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      >
                        {orderNumber(order)}
                      </Link>
                      <span className="text-sm font-semibold text-ink">
                        <Money kobo={order.amountKobo} />
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-ink-muted">
                      {order.customerName ?? "Buyer"} ·{" "}
                      {statusLabel(order.statusKey)}
                    </p>
                    {order.disputeReason ? (
                      <p className="mt-2 rounded-lg border border-line bg-canvas px-3 py-2 text-sm leading-6 text-ink">
                        {order.disputeReason}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        <div className="space-y-6">
          <SectionCard
            title="Outbox"
            description="Background jobs: payout transfers and WhatsApp notices."
            action={
              <Link
                href="/admin/webhooks"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-brand hover:text-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                Webhooks
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            }
          >
            {!outbox ? (
              <div className="px-5 py-8 text-sm text-ink-muted">
                The outbox endpoint did not respond.
              </div>
            ) : outboxErrors.length === 0 ? (
              <div className="px-5 py-8 text-sm leading-6 text-ink-muted">
                Nothing is failing. Backlog is{" "}
                <span className="font-semibold text-ink">{outbox.backlog ?? 0}</span>.
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {outboxErrors.map((entry) => (
                  <li key={entry.id ?? undefined} className="px-5 py-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-mono text-xs text-ink">
                        {entry.type ?? "job"}
                      </span>
                      <span className="text-xs text-ink-muted">
                        {pluralize(entry.attempts ?? 0, "attempt")} ·{" "}
                        {formatDateTime(entry.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm leading-6 text-cinnamon-wood-900 dark:text-cinnamon-wood-200">
                      {entry.error ?? "Unknown error."}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title="Recent webhooks"
            description="Paystack deliveries, newest first."
          >
            {!webhooks ? (
              <div className="px-5 py-8 text-sm text-ink-muted">
                The webhooks endpoint did not respond.
              </div>
            ) : webhooks.length === 0 ? (
              <div className="px-5 py-8 text-sm leading-6 text-ink-muted">
                No webhook deliveries recorded yet.
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {webhooks.map((event: WebhookEvent) => (
                  <li
                    key={event.id ?? undefined}
                    className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"
                  >
                    <span className="font-mono text-xs text-ink">
                      {event.eventType ?? "event"}
                    </span>
                    <span className="flex items-center gap-3 text-xs text-ink-muted">
                      {event.provider ?? "—"}
                      <span
                        className={
                          event.signatureValid
                            ? "font-semibold text-shamrock-800 dark:text-shamrock-200"
                            : "font-semibold text-cinnamon-wood-800 dark:text-cinnamon-wood-200"
                        }
                      >
                        {event.signatureValid ? "signature ok" : "signature failed"}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
