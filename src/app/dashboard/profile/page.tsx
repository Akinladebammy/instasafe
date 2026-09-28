import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { renameBusinessAction, updatePhoneAction } from "@/app/dashboard/actions";
import { ActionForm } from "@/components/dashboard/action-form";
import { AccountToggle } from "@/components/dashboard/account-toggle";
import {
  DataRow,
  ErrorNote,
  Money,
  SectionCard,
  StatTile,
} from "@/components/dashboard/parts";
import { formatDate } from "@/lib/money";
import { toStatusKey } from "@/lib/order-status";
import { decodeOrders } from "@/lib/types";
import {
  getSelfVendor,
  getVendorToken,
  listOrders,
  VendorApiError,
} from "@/lib/vendor-api";

export const metadata: Metadata = {
  title: "Profile — InstaSafe",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const token = await getVendorToken();
  if (!token) redirect("/login");

  const vendor = await getSelfVendor(token).catch(() => null);
  if (!vendor) redirect("/login");

  const orders = await listOrders(token, { page: 1, pageSize: 100 }).catch(
    () => null,
  );
  const orderList =
    !orders || orders instanceof VendorApiError ? [] : decodeOrders(orders.orders);

  const lifetimeKobo = orderList
    .filter((order) => order.statusKey === "Released")
    .reduce((sum, order) => sum + (order.amountKobo ?? 0), 0);
  const heldKobo = orderList
    .filter((order) => toStatusKey(order.status) === "Held")
    .reduce((sum, order) => sum + (order.amountKobo ?? 0), 0);

  const isActive = vendor.isActive !== false;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
          Profile
        </h1>
        <p className="mt-2 max-w-2xl text-base leading-7 text-ink-muted">
          Your vendor record, payout destination and account state. Changes here
          are enforced by the backend.
        </p>
      </div>

      {!isActive ? (
        <ErrorNote
          title="This account is deactivated"
          message="Buyers can still open your links, but new protected orders are paused. Reactivate to resume selling."
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          label="Member since"
          value={formatDate(vendor.createdAt)}
          hint={vendor.updatedAt ? `Updated ${formatDate(vendor.updatedAt)}` : undefined}
        />
        <StatTile
          label="Lifetime released"
          value={<Money kobo={lifetimeKobo} />}
          hint="Goods value across completed orders"
          tone="good"
        />
        <StatTile
          label="Currently held"
          value={<Money kobo={heldKobo} />}
          hint="Escrow balance across open orders"
          tone={heldKobo > 0 ? "warn" : "neutral"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Business name"
          description="This is the name buyers see on your protected links."
        >
          <div className="px-5 py-5">
            <ActionForm
              action={renameBusinessAction}
              hidden={{ vendorId: vendor.id }}
              submitLabel="Save Business Name"
              pendingLabel="Saving…"
              variant="secondary"
            >
              <div>
                <label
                  htmlFor="displayName"
                  className="text-sm font-semibold text-ink"
                >
                  Display name
                </label>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  autoComplete="organization"
                  defaultValue={vendor.displayName ?? ""}
                  maxLength={120}
                  required
                  className="mt-2 h-12 w-full rounded-xl border border-line bg-canvas px-4 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-focus/25"
                />
              </div>
            </ActionForm>
          </div>
        </SectionCard>

        <SectionCard
          title="WhatsApp number"
          description="Order alerts and rider dispatch go here. Changing it forces a fresh login."
        >
          <div className="px-5 py-5">
            <ActionForm
              action={updatePhoneAction}
              hidden={{ vendorId: vendor.id }}
              submitLabel="Update Number"
              pendingLabel="Updating…"
              variant="secondary"
            >
              <div>
                <label htmlFor="phone" className="text-sm font-semibold text-ink">
                  Mobile number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  defaultValue={vendor.phone ?? ""}
                  placeholder="0801 234 5678"
                  maxLength={24}
                  required
                  spellCheck={false}
                  aria-describedby="phone-hint"
                  className="mt-2 h-12 w-full rounded-xl border border-line bg-canvas px-4 font-mono text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-focus/25"
                />
                <p id="phone-hint" className="mt-2 text-xs leading-5 text-ink-muted">
                  Stored in the canonical 234 format. Must start 070, 080, 081,
                  090 or 091.
                </p>
              </div>
            </ActionForm>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Account" description="Server-enforced record details.">
        <dl>
          <DataRow label="Owner">
            {[vendor.firstName, vendor.lastName].filter(Boolean).join(" ") || "—"}
          </DataRow>
          <DataRow label="Email">
            <span className="flex flex-wrap items-center gap-2">
              {vendor.email ?? "—"}
              {vendor.emailVerified ? (
                <span className="rounded-full border border-shamrock-300 bg-shamrock-50 px-2 py-0.5 text-xs font-semibold text-shamrock-900 dark:bg-shamrock-950 dark:text-shamrock-100">
                  Verified
                </span>
              ) : (
                <span className="rounded-full border border-cinnamon-wood-300 bg-cinnamon-wood-50 px-2 py-0.5 text-xs font-semibold text-cinnamon-wood-900 dark:bg-cinnamon-wood-950 dark:text-cinnamon-wood-100">
                  Unverified
                </span>
              )}
            </span>
          </DataRow>
          <DataRow label="Payout account">
            {vendor.accountNumber ? (
              <span className="font-mono tabular-nums">
                {vendor.accountNumber} · bank {vendor.bankCode ?? "—"}
              </span>
            ) : (
              "Not set"
            )}
          </DataRow>
          <DataRow label="Status">
            {isActive ? "Active" : "Deactivated"}
          </DataRow>
          <DataRow label="Vendor id">
            <span className="font-mono break-all">{vendor.id}</span>
          </DataRow>
        </dl>
      </SectionCard>

      <SectionCard
        title={isActive ? "Pause selling" : "Resume selling"}
        description={
          isActive
            ? "Deactivating blocks new protected orders. Existing escrow is untouched."
            : "Reactivate to start accepting new protected orders again."
        }
      >
        <div className="px-5 py-5">
          <AccountToggle vendorId={vendor.id} isActive={isActive} />
        </div>
      </SectionCard>
    </div>
  );
}
