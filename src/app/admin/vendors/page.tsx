import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { adminToggleVendorAction, adminVendorPhoneAction } from "@/app/admin/actions";
import { PageStepper } from "@/components/admin/filter-chips";
import { ActionForm } from "@/components/dashboard/action-form";
import {
  EmptyState,
  SectionCard,
  StatTile,
} from "@/components/dashboard/parts";
import { getAdminToken, listVendors } from "@/lib/admin-api";
import { formatDate, formatPhone } from "@/lib/money";
import type { Vendor } from "@/lib/types";

export const metadata: Metadata = {
  title: "Vendors — InstaSafe console",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 20;

function onboardingLabel(vendor: {
  emailVerified?: boolean;
  onboardingCompleted?: boolean;
}) {
  if (vendor.emailVerified === false) return "Email unverified";
  if (vendor.onboardingCompleted === false) return "Payout not set up";
  return "Fully onboarded";
}

export default async function AdminVendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const token = await getAdminToken();
  if (!token) redirect("/login");

  const q = params.q?.trim() ?? "";
  const page = Math.max(1, Number(params.page) || 1);
  const raw = await listVendors(token, { q, page, pageSize: PAGE_SIZE + 1 });
  const hasNext = raw.length > PAGE_SIZE;
  const vendors: Vendor[] = raw.slice(0, PAGE_SIZE);

  const inactive = vendors.filter((vendor) => vendor.isActive === false).length;
  const incomplete = vendors.filter(
    (vendor) =>
      vendor.emailVerified === false || vendor.onboardingCompleted === false,
  ).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
          Vendors
        </h1>
        <p className="mt-2 max-w-2xl text-base leading-7 text-ink-muted">
          Search by name, phone or email. Deactivating blocks new orders but
          leaves existing ones and their escrow untouched.
        </p>
      </div>

      <form action="/admin/vendors" method="get" className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 sm:max-w-md">
          <label htmlFor="q" className="block text-sm font-semibold text-ink">
            Search
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Name, phone or email"
            className="mt-2 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          />
        </div>
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-spruce-800 px-4 text-sm font-semibold text-blue-spruce-50 transition-colors hover:bg-blue-spruce-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Search
        </button>
        {q ? (
          <a
            href="/admin/vendors"
            className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Clear
          </a>
        ) : null}
      </form>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="On this page" value={vendors.length} />
        <StatTile
          label="Deactivated here"
          value={inactive}
          hint="Cannot create or sign in to new work."
          tone={inactive ? "warn" : "good"}
        />
        <StatTile
          label="Onboarding unfinished"
          value={incomplete}
          hint="No payout destination yet, so escrow cannot release."
          tone={incomplete ? "warn" : "good"}
        />
      </div>

      <SectionCard title="Stores">
        {vendors.length === 0 ? (
          <EmptyState
            title="No vendors match"
            description={
              q
                ? `Nothing matches "${q}". Try part of a phone number or the store name.`
                : "No vendors are registered yet."
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {vendors.map((vendor) => (
              <li key={vendor.id} className="space-y-4 px-5 py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-ink">
                      {vendor.displayName ?? "Unnamed store"}
                      {vendor.isActive === false ? (
                        <span className="ml-2 rounded-full border border-cinnamon-wood-400 bg-cinnamon-wood-50 px-2.5 py-0.5 text-xs font-semibold text-cinnamon-wood-900 dark:bg-cinnamon-wood-950 dark:text-cinnamon-wood-100">
                          Deactivated
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 font-mono text-sm text-ink-muted">
                      {formatPhone(vendor.phone)}
                    </p>
                    <p className="mt-0.5 text-sm break-words text-ink-muted">
                      {vendor.email ?? "No email on file"}
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">
                      {onboardingLabel(vendor)} · joined{" "}
                      {formatDate(vendor.createdAt)}
                      {vendor.accountNumber
                        ? ` · payout ${vendor.accountNumber}`
                        : ""}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <ActionForm
                    action={adminToggleVendorAction}
                    hidden={{
                      vendorId: vendor.id,
                      active: vendor.isActive === false ? "true" : "false",
                    }}
                    submitLabel={
                      vendor.isActive === false
                        ? "Reactivate vendor"
                        : "Deactivate vendor"
                    }
                    pendingLabel="Working…"
                    variant={vendor.isActive === false ? "secondary" : "danger"}
                  >
                    <p className="text-sm leading-6 text-ink-muted">
                      {vendor.isActive === false
                        ? "This store is deactivated. Reactivating restores sign-in and order creation."
                        : "Deactivating blocks sign-in and new orders. Escrow on existing orders still releases on schedule."}
                    </p>
                  </ActionForm>

                  <ActionForm
                    action={adminVendorPhoneAction}
                    hidden={{ vendorId: vendor.id }}
                    submitLabel="Update number"
                    pendingLabel="Saving…"
                    variant="secondary"
                  >
                    <div>
                      <label
                        htmlFor={`phone-${vendor.id}`}
                        className="block text-sm font-semibold text-ink"
                      >
                        WhatsApp number
                      </label>
                      <p className="mt-1 text-sm leading-6 text-ink-muted">
                        Changing it invalidates the vendor&apos;s current session —
                        they sign in again with the new number.
                      </p>
                      <input
                        id={`phone-${vendor.id}`}
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        required
                        maxLength={24}
                        defaultValue={vendor.phone ?? ""}
                        className="mt-2 w-full rounded-xl border border-line bg-canvas px-3 py-2.5 font-mono text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      />
                    </div>
                  </ActionForm>
                </div>
              </li>
            ))}
          </ul>
        )}
        <PageStepper
          basePath="/admin/vendors"
          page={page}
          hasNext={hasNext}
          extraParams={q ? { q } : {}}
        />
      </SectionCard>
    </div>
  );
}
