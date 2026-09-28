import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { FilterChips, PageStepper } from "@/components/admin/filter-chips";
import { EmptyState, SectionCard, StatTile } from "@/components/dashboard/parts";
import { getAdminToken, getOutbox, listWebhooks } from "@/lib/admin-api";
import { formatDateTime, pluralize } from "@/lib/money";

export const metadata: Metadata = {
  title: "Webhooks — InstaSafe console",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 25;

export default async function AdminWebhooksPage({
  searchParams,
}: {
  searchParams: Promise<{
    signature?: string;
    provider?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const token = await getAdminToken();
  if (!token) redirect("/login");

  const signature = params.signature ?? "all";
  const provider = params.provider?.trim() ?? "";
  const page = Math.max(1, Number(params.page) || 1);

  const [raw, outbox] = await Promise.all([
    listWebhooks(token, {
      validOnly: signature === "valid" ? true : undefined,
      provider: provider || undefined,
      page,
      pageSize: PAGE_SIZE + 1,
    }),
    getOutbox(token).catch(() => null),
  ]);

  const hasNext = raw.length > PAGE_SIZE;
  const events = raw.slice(0, PAGE_SIZE);
  const invalid = events.filter((event) => event.signatureValid === false).length;
  const unprocessed = events.filter((event) => event.processed === false).length;

  const extra = {
    ...(signature !== "all" ? { signature } : {}),
    ...(provider ? { provider } : {}),
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
          Webhooks &amp; outbox
        </h1>
        <p className="mt-2 max-w-2xl text-base leading-7 text-ink-muted">
          How Paystack tells InstaSafe money moved, and what the background
          worker still has to do. A signature failure means a delivery was
          rejected, so escrow may be sitting on an order the backend never
          learned about.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatTile
          label="Backlog"
          value={outbox?.backlog ?? 0}
          hint="Queued transfers and notifications."
          tone={(outbox?.backlog ?? 0) > 0 ? "warn" : "good"}
        />
        <StatTile
          label="Signature failures"
          value={invalid}
          hint="On this page."
          tone={invalid ? "bad" : "good"}
        />
        <StatTile
          label="Unprocessed"
          value={unprocessed}
          hint="Delivered but not yet acted on."
          tone={unprocessed ? "warn" : "good"}
        />
        <StatTile label="On this page" value={events.length} />
      </div>

      <FilterChips
        basePath="/admin/webhooks"
        param="signature"
        active={signature}
        options={[
          { key: "all", label: "All deliveries" },
          { key: "valid", label: "Signature valid only" },
        ]}
      />

      <SectionCard title="Recent deliveries">
        {events.length === 0 ? (
          <EmptyState
            title="No webhook deliveries"
            description="Nothing has been delivered to InstaSafe yet, or the filter excluded everything."
          />
        ) : (
          <ul className="divide-y divide-line">
            {events.map((event) => (
              <li
                key={event.id ?? undefined}
                className="flex flex-wrap items-start justify-between gap-3 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold text-ink">
                    {event.eventType ?? "unknown event"}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {event.provider ?? "unknown provider"} ·{" "}
                    {formatDateTime(event.createdAt)}
                  </p>
                  {event.idempotencyKey ? (
                    <p className="mt-1 font-mono text-xs break-all text-ink-muted">
                      {event.idempotencyKey}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={
                      event.signatureValid
                        ? "rounded-full border border-shamrock-300 bg-shamrock-50 px-2.5 py-1 text-xs font-semibold text-shamrock-900 dark:border-shamrock-700 dark:bg-shamrock-950 dark:text-shamrock-100"
                        : "rounded-full border border-cinnamon-wood-400 bg-cinnamon-wood-50 px-2.5 py-1 text-xs font-semibold text-cinnamon-wood-900 dark:bg-cinnamon-wood-950 dark:text-cinnamon-wood-100"
                    }
                  >
                    {event.signatureValid ? "Signature ok" : "Signature failed"}
                  </span>
                  <span className="rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-semibold text-ink-muted">
                    {event.processed ? "Processed" : "Not processed"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
        <PageStepper
          basePath="/admin/webhooks"
          page={page}
          hasNext={hasNext}
          extraParams={extra}
        />
      </SectionCard>

      {outbox?.recentErrors?.length ? (
        <SectionCard
          title="Outbox errors"
          description="Jobs the worker could not finish. Each one is retried."
        >
          <ul className="divide-y divide-line">
            {outbox.recentErrors.map((entry) => (
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
        </SectionCard>
      ) : null}
    </div>
  );
}
