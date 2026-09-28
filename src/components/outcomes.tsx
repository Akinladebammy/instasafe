import {
  ArrowUpRight,
  Bicycle,
  Storefront,
  UserCircle,
} from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/reveal";

const outcomes = [
  {
    icon: Storefront,
    role: "For the vendor",
    title: "Keep the sale. Lose less risk.",
    description:
      "Create a protected payment link without rebuilding the customer conversation around a new app.",
  },
  {
    icon: UserCircle,
    role: "For the buyer",
    title: "Pay with a delivery condition.",
    description:
      "The buyer knows the vendor payout is tied to a clear delivery confirmation.",
  },
  {
    icon: Bicycle,
    role: "For the rider",
    title: "Finish with one code.",
    description:
      "The verification step is simple, private and separate from payment collection.",
  },
];

export function Outcomes() {
  return (
    <section
      id="outcomes"
      className="scroll-mt-[88px] border-b border-line bg-canvas py-24 sm:py-28 lg:py-36"
    >
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <Reveal className="lg:col-span-8">
            <h2 className="max-w-[820px] text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-ink sm:text-5xl lg:text-6xl">
              One protection layer. Three clearer outcomes.
            </h2>
          </Reveal>
          <Reveal className="lg:col-span-4 lg:pb-1" delay={0.08}>
            <p className="max-w-[440px] text-lg leading-8 text-ink-muted">
              InstaSafe coordinates the handoff without forcing every actor into the same
              interface.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-4 lg:grid-cols-12 lg:grid-rows-2">
          {outcomes.map((outcome, index) => {
            const Icon = outcome.icon;
            const surface = [
              "bg-surface-blue",
              "bg-surface-green",
              "bg-surface-attention",
            ][index];
            const iconColor = [
              "text-blue-spruce-700",
              "text-shamrock-700",
              "text-cinnamon-wood-700",
            ][index];

            return (
              <Reveal
                key={outcome.role}
                delay={index * 0.08}
                distance={26}
                className={
                  index === 0
                    ? "lg:col-span-7 lg:row-span-2"
                    : "lg:col-span-5"
                }
              >
                <article
                  className={`${surface} group relative h-full overflow-hidden rounded-[24px] border border-line p-6 transition-transform duration-300 hover:-translate-y-1 sm:p-8 ${
                    index === 0 ? "min-h-[520px]" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-6">
                    <span
                      className={`grid h-12 w-12 place-items-center rounded-xl border border-line bg-canvas/55 ${iconColor}`}
                    >
                      <Icon size={24} weight="duotone" aria-hidden="true" />
                    </span>
                    <ArrowUpRight
                      size={22}
                      aria-hidden="true"
                      className="text-ink-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </div>
                  <div className={index === 0 ? "mt-24 sm:mt-36" : "mt-16"}>
                    <p className="text-sm font-semibold text-brand">{outcome.role}</p>
                    <h3
                      className={`mt-3 max-w-[620px] font-semibold leading-[1.05] tracking-[-0.04em] text-ink ${
                        index === 0 ? "text-4xl sm:text-5xl" : "text-3xl"
                      }`}
                    >
                      {outcome.title}
                    </h3>
                    <p className="mt-5 max-w-[540px] leading-7 text-ink-muted">
                      {outcome.description}
                    </p>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
