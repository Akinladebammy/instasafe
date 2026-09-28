import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, SignOut } from "@phosphor-icons/react/dist/ssr";
import { redirect } from "next/navigation";

import { AdminNav } from "@/components/admin/admin-nav";
import { BrandMark } from "@/components/brand-mark";
import { ErrorNote, PrimaryLink } from "@/components/dashboard/parts";
import { AdminApiError, getAdminToken, getStats } from "@/lib/admin-api";

export const metadata: Metadata = {
  title: "Console — InstaSafe",
  description: "Super-admin operations console.",
  robots: { index: false, follow: false },
};

function Notice({
  title,
  message,
  href = "/login",
  linkLabel = "Sign in",
}: {
  title: string;
  message: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-canvas px-5 py-16">
      <div className="w-full max-w-md space-y-5">
        <BrandMark />
        <ErrorNote
          title={title}
          message={message}
          action={<PrimaryLink href={href}>{linkLabel}</PrimaryLink>}
        />
      </div>
    </div>
  );
}

/**
 * Gate for the whole console.
 *
 * The super-admin authenticates through `POST /api/auth/vendor/login`, so the
 * only thing the cookie proves is that *some* InstaSafe session exists. The
 * authoritative check is the backend's own `[Authorize(Roles="admin")]` gate:
 * `GET /api/admin/stats` answers 401 for a lapsed token and 403 for a vendor or
 * rider token. Trusting the role claim alone would let a vendor who forged or
 * replayed a JWT walk straight in.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getAdminToken();
  if (!token) redirect("/login");

  try {
    await getStats(token);
  } catch (error) {
    if (error instanceof AdminApiError) {
      if (error.status === 401) redirect("/login");
      if (error.status === 403) {
        return (
          <Notice
            title="This account is not a super-admin"
            message="Your session is valid with InstaSafe, but it does not carry the admin role. The console is limited to the super-admin account. Sign in with the admin email to continue."
          />
        );
      }
      return (
        <Notice
          title="We could not reach InstaSafe"
          message={`${error.message} Your admin session is still active — this is a connection problem, not a sign-out.`}
          href="/admin"
          linkLabel="Try again"
        />
      );
    }
    return (
      <Notice
        title="We could not reach InstaSafe"
        message="The InstaSafe service did not respond. Your admin session is still active."
        href="/admin"
        linkLabel="Try again"
      />
    );
  }

  return (
    <div className="min-h-[100dvh] bg-canvas">
      <div className="sticky top-0 z-40 border-b border-line bg-surface">
        <header className="border-b border-line">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
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
                  Operations console
                </span>
                <span className="block font-mono text-xs text-ink-muted">
                  super-admin
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

        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <AdminNav />
        </div>
      </div>

      <main id="main-content" className="scroll-mt-40">
        <div className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8 sm:py-8">
          {children}
        </div>
      </main>

      <footer className="mx-auto w-full max-w-7xl px-5 pb-10 sm:px-8">
        <p className="border-t border-line pt-6 text-xs leading-5 text-ink-muted">
          Every action here is written to the moderation log by the backend with
          your actor id. Refunds and force-releases move real money.
        </p>
      </footer>
    </div>
  );
}
