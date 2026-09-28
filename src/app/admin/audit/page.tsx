import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageStepper } from "@/components/admin/filter-chips";
import { DataRow, EmptyState, SectionCard } from "@/components/dashboard/parts";
import { getAdminToken, listAudit } from "@/lib/admin-api";
import { formatDateTime } from "@/lib/money";

export const metadata: Metadata = {
  title: "Audit — InstaSafe console",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 50;

/**
 * Actions the backend records for a super-admin. The `action` filter is a
 * free-text prefix on the API, so it is echoed back rather than turned into a
 * chip list — the API guide does not publish a closed enum of action names.
 */
export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; page?: string }>;
}) {
  const params = await searchParams;
  const token = await getAdminToken();
  if (!token) redirect("/login");

  const action = params.action?.trim() ?? "";
  const page = Math.max(1, Number(params.page) || 1);
  const raw = await listAudit(token, { action, page, pageSize: PAGE_SIZE + 1 });
  const hasNext = raw.length > PAGE_SIZE;
  const entries = raw.slice(0, PAGE_SIZE);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
          Audit log
        </h1>
        <p className="mt-2 max-w-2xl text-base leading-7 text-ink-muted">
          Every moderation action, written by the backend with the actor and any
          note. This is the record of who released or refunded what.
        </p>
      </div>

      <form action="/admin/audit" method="get" className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 sm:max-w-md">
          <label htmlFor="action" className="block text-sm font-semibold text-ink">
            Action contains
          </label>
          <input
            id="action"
            name="action"
            type="search"
            defaultValue={action}
            placeholder="refund, release, deactivate…"
            className="mt-2 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          />
        </div>
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-spruce-800 px-4 text-sm font-semibold text-blue-spruce-50 transition-colors hover:bg-blue-spruce-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Filter
        </button>
        {action ? (
          <Link
            href="/admin/audit"
            className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Clear
          </Link>
        ) : null}
      </form>

      <SectionCard
        title="Entries"
        description={
          action ? `Filtered on "${action}".` : "Newest first, as the backend orders them."
        }
      >
        {entries.length === 0 ? (
          <EmptyState
            title="Nothing recorded"
            description={
              action
                ? `No moderation action matches "${action}".`
                : "No super-admin has taken a moderation action yet."
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {entries.map((entry, index) => (
              <li key={entry.id ?? `${entry.createdAt}-${index}`}>
                <dl>
                  <DataRow label="Action">
                    <span className="font-mono text-sm">{entry.action ?? "—"}</span>
                    {entry.note ? (
                      <span className="mt-1 block text-sm leading-6 font-normal text-ink-muted">
                        {entry.note}
                      </span>
                    ) : null}
                  </DataRow>
                  <DataRow label="Actor">{entry.actor ?? "—"}</DataRow>
                  <DataRow label="Target">
                    <span className="font-mono text-xs break-all">
                      {entry.targetType ?? "—"}
                      {entry.targetId ? ` · ${entry.targetId}` : ""}
                    </span>
                  </DataRow>
                  <DataRow label="When">{formatDateTime(entry.createdAt)}</DataRow>
                </dl>
              </li>
            ))}
          </ul>
        )}
        <PageStepper
          basePath="/admin/audit"
          page={page}
          hasNext={hasNext}
          extraParams={action ? { action } : {}}
        />
      </SectionCard>
    </div>
  );
}
