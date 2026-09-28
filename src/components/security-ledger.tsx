import {
  ArrowRight,
  Fingerprint,
  LockKey,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/reveal";

const safeguards = [
  {
    icon: LockKey,
    title: "Server-verified payment state",
    detail: "A browser redirect is never enough. Paystack confirmation is verified server-side.",
  },
  {
    icon: Fingerprint,
    title: "Single-use delivery code",
    detail: "The OTP expires, limits attempts and cannot release the same order twice.",
  },
  {
    icon: ShieldCheck,
    title: "Idempotent payout release",
    detail: "A repeated confirmation cannot trigger a duplicate vendor transfer.",
  },
];

export function SecurityLedger() {
  return (
    <section
      id="security"
      className="scroll-mt-[88px] bg-blue-spruce-950 py-24 text-blue-spruce-50 sm:py-28 lg:py-36"
    >
      <div className="mx-auto grid max-w-[1400px] gap-16 px-5 sm:px-8 lg:grid-cols-12 lg:items-start lg:gap-14 lg:px-10">
        <Reveal className="lg:col-span-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-spruce-300">
            Delivery release rules
          </p>
          <h2 className="mt-6 max-w-[700px] text-4xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            The release decision never trusts the browser.
          </h2>
          <p className="mt-7 max-w-[600px] text-lg leading-8 text-blue-spruce-200">
            InstaSafe treats payment confirmation, delivery verification and payout release
            as separate server-authoritative events.
          </p>

          <div className="mt-12 border-t border-blue-spruce-800">
            {safeguards.map((safeguard) => {
              const Icon = safeguard.icon;
              return (
                <div
                  key={safeguard.title}
                  className="grid gap-4 border-b border-blue-spruce-800 py-6 sm:grid-cols-[48px_1fr]"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl border border-blue-spruce-700 bg-blue-spruce-900 text-blue-spruce-300">
                    <Icon size={21} weight="duotone" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-semibold tracking-[-0.02em]">
                      {safeguard.title}
                    </h3>
                    <p className="mt-1.5 max-w-[520px] text-sm leading-6 text-blue-spruce-300">
                      {safeguard.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>

        <Reveal
          className="lg:col-span-5 lg:col-start-8 lg:pt-16"
          delay={0.12}
          distance={30}
        >
          <div className="rounded-[28px] border border-blue-spruce-700 bg-blue-spruce-900 p-5 shadow-[0_28px_80px_rgba(1,12,11,0.38)] sm:p-7">
            <div className="flex items-center justify-between gap-4 border-b border-blue-spruce-700 pb-5">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-blue-spruce-400">
                  Delivery handshake
                </p>
                <p className="mt-1 text-sm text-blue-spruce-200">Order IS-2407</p>
              </div>
              <span className="rounded-full bg-cinnamon-wood-400/15 px-3 py-1.5 text-xs font-semibold text-cinnamon-wood-200">
                OTP required
              </span>
            </div>

            <div className="py-8 text-center">
              <p className="text-sm text-blue-spruce-300">One-time delivery code</p>
              <div
                className="mt-4 flex justify-center gap-2 sm:gap-3"
                aria-label="Delivery code 4 8 2 9 1 3"
              >
                {[4, 8, 2, 9, 1, 3].map((digit) => (
                  <span
                    key={digit}
                    className="grid h-12 w-10 place-items-center rounded-xl border border-blue-spruce-600 bg-blue-spruce-950 font-mono text-xl font-semibold text-blue-spruce-100 sm:h-14 sm:w-12"
                  >
                    {digit}
                  </span>
                ))}
              </div>
              <p className="mt-4 font-mono text-xs text-blue-spruce-400">Expires in 09:42</p>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-t border-blue-spruce-700 pt-6">
              <div>
                <p className="text-xs text-blue-spruce-400">Buyer</p>
                <p className="mt-1 text-sm font-semibold">Shares code</p>
              </div>
              <ArrowRight size={20} className="text-blue-spruce-500" aria-hidden="true" />
              <div className="text-right">
                <p className="text-xs text-blue-spruce-400">Rider</p>
                <p className="mt-1 text-sm font-semibold">Verifies delivery</p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-shamrock-400/12 p-4 text-shamrock-100">
              <ShieldCheck
                size={22}
                weight="duotone"
                className="shrink-0"
                aria-hidden="true"
              />
              <p className="text-sm leading-6">
                Valid code received. Vendor transfer can now be initiated.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
