import {
  ChatCircleText,
  CheckCircle,
  CreditCard,
  Package,
} from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/reveal";
import { ScrollLine } from "@/components/scroll-line";

// Adapted from the 21st.dev Process Timeline component by shadcnui-blocks.
// The vertical registry pattern is reworked into InstaSafe's transaction spine.
const steps = [
  {
    number: "01",
    title: "Send the order",
    description: "The vendor sends a normal order message through WhatsApp.",
    detail: "No new dashboard required",
    icon: ChatCircleText,
  },
  {
    number: "02",
    title: "Buyer pays",
    description: "InstaSafe creates a Paystack checkout and confirms the payment.",
    detail: "Webhook verified",
    icon: CreditCard,
  },
  {
    number: "03",
    title: "Delivery is checked",
    description: "The buyer shares a private, single-use code with the rider.",
    detail: "Limited attempts",
    icon: Package,
  },
  {
    number: "04",
    title: "Payout is released",
    description: "The backend validates delivery and initiates the vendor transfer.",
    detail: "Idempotent release",
    icon: CheckCircle,
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-[88px] border-b border-line bg-surface py-24 sm:py-28 lg:py-36"
    >
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-10">
        <Reveal className="max-w-[760px]">
          <h2 className="text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-ink sm:text-5xl lg:text-6xl">
            One order. One protected path.
          </h2>
          <p className="mt-6 max-w-[620px] text-lg leading-8 text-ink-muted">
            Every step has a clear owner, a server-verified state and one next action.
          </p>
        </Reveal>

        <ol className="relative mt-16 grid gap-0 md:grid-cols-4 md:gap-8">
          <div
            aria-hidden="true"
            className="absolute left-[27px] top-6 hidden h-px w-[calc(100%-3.5rem)] bg-line md:block"
          >
            <ScrollLine />
          </div>

          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <li
                key={step.number}
                className="relative grid grid-cols-[56px_1fr] gap-5 pb-12 last:pb-0 md:block md:pb-0"
              >
                <div className="relative">
                  <div className="absolute left-0 top-0 hidden h-12 w-12 place-items-center rounded-xl border border-blue-spruce-700 bg-blue-spruce-700 text-blue-spruce-50 md:grid">
                    <Icon size={22} weight="duotone" aria-hidden="true" />
                  </div>
                  <div className="absolute left-0 top-0 grid h-12 w-12 place-items-center rounded-xl border border-line bg-canvas font-mono text-xs font-semibold text-brand md:hidden">
                    {step.number}
                  </div>
                  <div className="absolute left-[27px] top-12 hidden h-[calc(100%-2.75rem)] w-px bg-line md:block" />
                </div>

                <Reveal
                  className="pt-1 md:mt-20"
                  delay={index * 0.08}
                  distance={18}
                  amount={0.3}
                >
                  <p className="font-mono text-xs font-semibold text-brand">{step.number}</p>
                  <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-[280px] text-sm leading-6 text-ink-muted">
                    {step.description}
                  </p>
                  <p className="mt-5 inline-flex rounded-full border border-line bg-canvas px-3 py-1.5 text-xs font-medium text-ink-muted">
                    {step.detail}
                  </p>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
