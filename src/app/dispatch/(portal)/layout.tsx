import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, SignOut } from "@phosphor-icons/react/dist/ssr";
import { redirect } from "next/navigation";

import { BrandMark } from "@/components/brand-mark";
import { ErrorNote } from "@/components/dashboard/parts";
import { DispatchNav } from "@/components/dispatch/dispatch-nav";
import { formatPhone } from "@/lib/money";
import {
  DispatchApiError,
  getDispatchToken,
  listAssigned,
} from "@/lib/dispatch-api";

export const metadata: Metadata = {
  title: "Rider deliveries — InstaSafe",
  robots: { index: false, follow: false },
};

function RiderUnreachable({ reason }: { reason: string }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-canvas px-5 py-16">
      <div className="w-full max-w-md space-y-5">
        <BrandMark />
        <ErrorNote
          title="We could not reach InstaSafe"
          message={`${reason} You are still signed in — this is a connection problem, not a sign-out.`}
          action={
            <Link
              href="/dispatch"
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
 * Gate for the rider portal. The rider token is a separate httpOnly cookie from
 * the vendor session, so a signed-in vendor is still sent to the rider login.
 */
export default async function DispatchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getDispatchToken();
  if (!token) redirect("/dispatch/login");

  let phone: string | null = null;
  let unreachable: string | null = null;

  try {
    // The assigned list is the cheapest call that proves the token is still good.
    const result = await listAssigned(token, { page: 1, pageSize: 50 });
    phone = result.orders[0]?.driverPhone ?? null;
  } catch (error) {
    if (error instanceof DispatchApiError && error.status === 401) {
      redirect("/dispatch/login");
    }
    unreachable =
      error instanceof DispatchApiError
        ? error.message
        : "The InstaSafe service could not be reached.";
  }

  if (unreachable) return <RiderUnreachable reason={unreachable} />;

  return (
    <div className="min-h-[100dvh] bg-canvas">
      <div className="sticky top-0 z-40 border-b border-line bg-surface">
        <header className="border-b border-line">
          <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
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
                <span className="block text-sm font-semibold text-ink">
                  Rider mode
                </span>
                <span className="block font-mono text-xs text-ink-muted">
                  {formatPhone(phone)}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                <ArrowLeft size={16} aria-hidden="true" />
                Site
              </Link>
              <form action="/api/auth/dispatch/logout" method="post">
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-line bg-canvas px-3 text-sm font-semibold text-ink transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  <SignOut size={16} aria-hidden="true" />
                  End shift
                </button>
              </form>
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-5xl px-5 sm:px-8">
          <DispatchNav />
        </div>
      </div>

      <main id="main-content" className="scroll-mt-40">
        <div className="mx-auto w-full max-w-5xl px-5 py-6 sm:px-8 sm:py-8">
          {children}
        </div>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-5 pb-10 sm:px-8">
        <p className="border-t border-line pt-6 text-xs leading-5 text-ink-muted">
          Riders are paid by the backend the moment a delivery is confirmed. This
          screen never moves money.
        </p>
      </footer>
    </div>
  );
}
