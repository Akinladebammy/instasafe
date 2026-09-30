import { ArrowUp } from "@phosphor-icons/react/dist/ssr";
import { botChatUrl } from "@/lib/whatsapp";
import { BrandMark } from "@/components/brand-mark";

const exploreLinks = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Security", href: "#security" },
  { label: "Live demo", href: "#demo" },
];

/** Grouped by audience so nobody has to guess which door is theirs. */
const roleLinks = [
  { label: "Track your order", href: "/track" },
  { label: "Rider sign in", href: "/login?as=rider" },
  { label: "Vendor log in", href: "/login" },
  { label: "Create a vendor account", href: "/signup" },
];

export function SiteFooter() {
  const liveUrl = botChatUrl();
  return (
    <footer className="bg-canvas py-12 sm:py-16">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-10 border-b border-line pb-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <a href="#top" aria-label="InstaSafe home">
              <BrandMark />
            </a>
            <p className="mt-5 max-w-[520px] text-base leading-7 text-ink-muted">
              Payment protection and delivery-triggered payout coordination for social
              commerce.
            </p>
          </div>
          <nav aria-label="Footer navigation" className="lg:col-span-3">
            <p className="text-sm font-semibold text-ink">Explore</p>
            <ul className="mt-4 space-y-3">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>

            <p className="mt-8 text-sm font-semibold text-ink">Access</p>
            <ul className="mt-4 space-y-3">
              {roleLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              {liveUrl ? (
                <li>
                  <a
                    href={liveUrl}
                    target="_blank"
                    rel="noopener"
                    className="text-sm text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    Chat with the bot
                  </a>
                </li>
              ) : null}
            </ul>
          </nav>
          <div className="lg:col-span-2 lg:text-right">
            <a
              href="#top"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              Back to top
              <ArrowUp size={16} weight="bold" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-6 text-xs leading-5 text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 InstaSafe. Built for StacStart Career Summit.</p>
          <p>Payment protection and payout coordination, not a bank deposit.</p>
        </div>
      </div>
    </footer>
  );
}
