import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { adminToggleDispatcherAction } from "@/app/admin/actions";
import { PageStepper } from "@/components/admin/filter-chips";
import { ActionForm } from "@/components/dashboard/action-form";
import { EmptyState, SectionCard, StatTile } from "@/components/dashboard/parts";
import { getAdminToken, listDispatchers } from "@/lib/admin-api";
import { formatDate, formatPhone } from "@/lib/money";

export const metadata: Metadata = {
  title: "Riders — InstaSafe console",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 25;

export default async function AdminDispatchersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const token = await getAdminToken();
  if (!token) redirect("/login");

  const page = Math.max(1, Number(params.page) || 1);
  const raw = await listDispatchers(token, { page, pageSize: PAGE_SIZE + 1 });
  const hasNext = raw.length > PAGE_SIZE;
  const dispatchers = raw.slice(0, PAGE_SIZE);
  const inactive = dispatchers.filter((row) => row.isActive === false).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
          Riders
        </h1>
        <p className="mt-2 max-w-2xl text-base leading-7 text-ink-muted">
          Riders sign in with a WhatsApp code to their number. They hold no bank
          details of their own — the payout account is supplied per order by the
          vendor.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="On this page" value={dispatchers.length} />
        <StatTile
          label="Deactivated here"
          value={inactive}
          hint="Cannot request a delivery code."
          tone={inactive ? "warn" : "good"}
        />
        <StatTile
          label="Active here"
          value={dispatchers.length - inactive}
          tone="good"
        />
      </div>

      <SectionCard title="Riders">
        {dispatchers.length === 0 ? (
          <EmptyState
            title="No riders registered"
            description="Riders appear here after they request their first delivery code."
          />
        ) : (
          <ul className="divide-y divide-line">
            {dispatchers.map((rider) => (
              <li
                key={rider.id}
                className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold text-ink">
                    {formatPhone(rider.phone)}
                    {rider.isActive === false ? (
                      <span className="ml-2 rounded-full border border-cinnamon-wood-400 bg-cinnamon-wood-50 px-2.5 py-0.5 text-xs font-semibold text-cinnamon-wood-900 dark:bg-cinnamon-wood-950 dark:text-cinnamon-wood-100">
                        Deactivated
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    Added {formatDate(rider.createdAt)}
                  </p>
                </div>
                <ActionForm
                  action={adminToggleDispatcherAction}
                  hidden={{
                    dispatcherId: rider.id,
                    active: rider.isActive === false ? "true" : "false",
                  }}
                  submitLabel={
                    rider.isActive === false ? "Reactivate" : "Deactivate"
                  }
                  pendingLabel="Working…"
                  variant={rider.isActive === false ? "secondary" : "danger"}
                  className="max-w-xs"
                >
                  <p className="text-sm leading-6 text-ink-muted">
                    {rider.isActive === false
                      ? "Restores code requests and delivery confirmation."
                      : "Stops them receiving new deliveries. Deliveries already assigned still need confirming."}
                  </p>
                </ActionForm>
              </li>
            ))}
          </ul>
        )}
        <PageStepper basePath="/admin/dispatchers" page={page} hasNext={hasNext} />
      </SectionCard>
    </div>
  );
}
