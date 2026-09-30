import { ArrowRight, ChatCircleDots, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { botChatUrl } from "@/lib/whatsapp";
import { Reveal } from "@/components/reveal";

// Adapted from the 21st.dev CTA Section by shadcndesign.
// Reoriented from a generic centered block into an asymmetric product close.
export function CtaSection() {
  const liveUrl = botChatUrl();
  return (
    <section id="start" className="bg-blue-spruce-800 py-20 text-blue-spruce-50 sm:py-24">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:items-center lg:gap-16 lg:px-10">
        <Reveal className="lg:col-span-8">
          <h2 className="max-w-[880px] text-4xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-5xl lg:text-7xl">
            Protect the sale you already have.
          </h2>
          <p className="mt-6 max-w-[620px] text-lg leading-8 text-blue-spruce-100">
            See how a WhatsApp order becomes a protected payment and a delivery-confirmed
            vendor payout.
          </p>
          <a
            href="#demo"
            className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-spruce-50 px-5 py-3 text-sm font-semibold text-blue-spruce-950 transition-[transform,background-color] hover:bg-blue-spruce-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-spruce-200 active:translate-y-px"
          >
            Try the flow
            <ArrowRight size={18} weight="bold" aria-hidden="true" />
          </a>
          {liveUrl ? (
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener"
              className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-blue-spruce-600 px-5 py-3 text-sm font-semibold text-blue-spruce-50 transition-colors hover:bg-blue-spruce-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-spruce-200 sm:ml-3"
            >
              Continue on WhatsApp
              <ArrowRight size={18} weight="bold" aria-hidden="true" />
            </a>
          ) : null}
        </Reveal>

        <Reveal className="lg:col-span-4" delay={0.12} distance={28}>
          <div className="rounded-[24px] border border-blue-spruce-600/70 bg-blue-spruce-900 p-6 shadow-[inset_0_1px_0_rgba(233,251,249,0.12)]">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-shamrock-300 text-blue-spruce-950">
              <ChatCircleDots size={25} weight="duotone" aria-hidden="true" />
            </span>
            <p className="mt-6 text-xl font-semibold tracking-[-0.03em]">
              Keep the conversation.
            </p>
            <ul className="mt-5 space-y-3 border-t border-blue-spruce-600 pt-5 text-sm text-blue-spruce-100">
              {[
                "Order created in WhatsApp",
                "Buyer pays through Paystack",
                "Delivery confirms release",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <CheckCircle
                    size={18}
                    weight="fill"
                    className="shrink-0 text-shamrock-300"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
