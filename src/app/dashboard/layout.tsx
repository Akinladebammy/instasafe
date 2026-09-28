import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldWarning,
  SignOut,
} from "@phosphor-icons/react/dist/ssr";
import { redirect } from "next/navigation";

import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { BrandMark } from "@/components/brand-mark";
import { ErrorNote } from "@/components/dashboard/parts";
import { formatPhone } from "@/lib/money";
import type { Vendor } from "@/lib/types";
import {
  getSelfVendor,
  getVendorToken,
  VendorApiError,
} from "@/lib/vendor-api";

export const metadata: Metadata = {
  title: "Vendor dashboard — InstaSafe",
  description: "Track protected orders, payouts and disputes.",
  robots: { index: false, follow: false },
};

function Unreachable({ reason }: { reason: string }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-canvas px-5 py-16">
      <div className="w-full max-w-md space-y-5">
        <BrandMark />
        <ErrorNote
          title="We could not reach InstaSafe"
          message={`${reason} Your session is still signed in — this is a connection problem, not a logout.`}
          action={
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 items-center rounded-xl border border-line bg-canvas px-4 text-sm font-semibold text-ink hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              Try again
            </Link>
          }
        />
      </div>
    </div>
  );
}

/**
 * Single gate for every dashboard route. Order matters: an unverified vendor is
 * sent to email verification first, because payout setup needs a session they do
 * not have yet.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getVendorToken();
  if (!token) redirect("/login");

  let profile: Vendor | null = null;
  let unreachable: string | null = null;

  try {
    profile = await getSelfVendor(token);
  } catch (error) {
    if (error instanceof VendorApiError && error.status === 401)
      redirect("/login");
    unreachable =
      error instanceof VendorApiError
        ? error.message
        : "The InstaSafe service could not be reached.";
  }

  if (!profile && !unreachable) redirect("/login");
  if (!profile) return <Unreachable reason={unreachable ?? "Unknown error."} />;

  if (profile.emailVerified === false) {
    redirect(
      `/signup?step=verify&vendorId=${encodeURIComponent(profile.id)}&email=${encodeURIComponent(profile.email ?? "")}`,
    );
  }
  if (profile.onboardingCompleted === false) {
    redirect(`/signup?step=payout&vendorId=${encodeURIComponent(profile.id)}`);
  }

  return (
    <div className="min-h-[100dvh] bg-canvas">
      {/* Brand chrome and section tabs form one pinned unit. The surface is
          fully opaque, so content passes cleanly underneath it. */}
      <div className="sticky top-0 z-40 border-b border-line bg-surface">
        <header className="border-b border-line">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                aria-label="InstaSafe home"
                className="inline-flex min-h-11 items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                <BrandMark />
              </Link>
              <span aria-hidden="true" className="h-6 w-px bg-line" />
              <p className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink">
                  {profile.displayName ?? "Your store"}
                </span>
                <span className="block font-mono text-xs text-ink-muted">
                  {formatPhone(profile.phone)}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              {profile.isActive === false ? (
                <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-cinnamon-wood-400 bg-cinnamon-wood-50 px-3 text-xs font-semibold text-cinnamon-wood-900 dark:bg-cinnamon-wood-950 dark:text-cinnamon-wood-100">
                  <ShieldWarning
                    size={14}
                    weight="duotone"
                    aria-hidden="true"
                  />
                  Deactivated
                </span>
              ) : null}
              <Link
                href="/"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                <ArrowLeft size={16} aria-hidden="true" />
                Site
              </Link>
              <form action="/api/auth/vendor/logout" method="post">
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-line bg-canvas px-3 text-sm font-semibold text-ink transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  <SignOut size={16} aria-hidden="true" />
                  Log out
                </button>
              </form>
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          <DashboardNav />
        </div>
      </div>

      {/* scroll-mt keeps the skip-link target clear of the pinned bar. */}
      <main id="main-content" className="scroll-mt-40">
        <div className="mx-auto w-full max-w-6xl px-5 py-6 sm:px-8 sm:py-8">
          {children}
        </div>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-5 pb-10 sm:px-8">
        <p className="border-t border-line pt-6 text-xs leading-5 text-ink-muted">
          Payment release stays server-authoritative. Nothing on this page moves
          money without a backend response.
        </p>
      </footer>
    </div>
  );
}
