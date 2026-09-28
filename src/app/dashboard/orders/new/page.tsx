import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { redirect } from "next/navigation";

import { CreateOrderForm } from "@/components/dashboard/create-order-form";
import { SectionCard } from "@/components/dashboard/parts";
import { getVendorToken, listBanks } from "@/lib/vendor-api";

export const metadata: Metadata = {
  title: "New order — InstaSafe",
  robots: { index: false, follow: false },
};

export default async function NewOrderPage() {
  const token = await getVendorToken();
  if (!token) redirect("/login");

  // Short list of banks that can receive a dedicated transfer account, used for
  // the optional rider payout details. Falls back to empty if unavailable so the
  // form stays usable with manual codes.
  const banks = await listBanks({ transferOnly: true }).catch(() => []);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/dashboard/orders"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to orders
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
          Create a protected order
        </h1>
        <p className="mt-2 max-w-2xl text-base leading-7 text-ink-muted">
          The buyer is charged the order total and the money is held until
          delivery is confirmed. You get a payment link to share.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <CreateOrderForm banks={banks} />

        <SectionCard
          title="How this order settles"
          description="Server-enforced, so you always know where the money is."
        >
          <ol className="space-y-4 px-5 py-5 text-sm leading-6 text-ink-muted">
            <li>
              <span className="font-semibold text-ink">1. Buyer pays.</span> The
              total sits in escrow, not your account. Nothing is released yet.
            </li>
            <li>
              <span className="font-semibold text-ink">2. Delivery happens.</span>{" "}
              A rider confirms with the buyer&apos;s code, which opens a 24-hour
              inspection window.
            </li>
            <li>
              <span className="font-semibold text-ink">3. Funds release.</span> If
              the buyer does not dispute, the backend releases your payout
              automatically at the end of the window.
            </li>
            <li>
              <span className="font-semibold text-ink">Disputes freeze funds.</span>{" "}
              While an order is disputed you choose release or refund.
            </li>
          </ol>
        </SectionCard>
      </div>
    </div>
  );
}
