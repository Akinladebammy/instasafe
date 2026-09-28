import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/reveal";

const integrations = [
  {
    name: "WhatsApp",
    role: "Order creation",
    detail: "Vendors send the sale in the channel they already use.",
  },
  {
    name: "Groq",
    role: "Order understanding",
    detail: "Natural language becomes a clean, confirmable order summary.",
  },
  {
    name: "Paystack",
    role: "Payment and payout",
    detail: "Payments are collected and delivery-triggered transfers are initiated.",
  },
];

export function IntegrationRail() {
  return (
    <section
      aria-label="Technology integrations"
      className="border-b border-line bg-surface"
    >
      <div className="mx-auto grid max-w-[1400px] gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[0.8fr_2.2fr] lg:items-center lg:px-10">
        <Reveal>
          <p className="max-w-xs text-sm leading-6 text-ink-muted">
            Built around the tools already inside a social sale.
          </p>
        </Reveal>
        <ol className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
          {integrations.map((integration, index) => (
            <li
              key={integration.name}
              className="group relative bg-canvas transition-colors hover:bg-surface-raised"
            >
              <Reveal className="h-full px-5 py-5" delay={index * 0.07} distance={16}>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-mono text-xs text-brand">0{index + 1}</span>
                  {index < integrations.length - 1 ? (
                    <ArrowRight
                      size={16}
                      aria-hidden="true"
                      className="text-ink-muted transition-transform group-hover:translate-x-0.5"
                    />
                  ) : null}
                </div>
                <p
                  translate="no"
                  className="mt-5 text-base font-semibold tracking-[-0.02em] text-ink"
                >
                  {integration.name}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand">
                  {integration.role}
                </p>
                <p className="mt-3 text-sm leading-6 text-ink-muted">
                  {integration.detail}
                </p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
