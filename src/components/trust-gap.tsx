import Image from "next/image";
import { ShieldWarning, Truck } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/reveal";

export function TrustGap() {
  return (
    <section className="border-b border-line bg-canvas py-24 sm:py-28 lg:py-36">
      <div className="mx-auto grid max-w-[1400px] gap-16 px-5 sm:px-8 lg:grid-cols-12 lg:items-center lg:gap-12 lg:px-10">
        <Reveal className="relative w-full max-w-[520px] lg:col-span-4 lg:max-w-[460px]">
          <figure>
            <div
              aria-hidden="true"
              className="absolute -bottom-5 -left-5 h-2/3 w-2/3 rounded-[28px] bg-blue-spruce-200"
            />
            <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] border border-blue-spruce-800 bg-blue-spruce-900 shadow-ledger">
              <Image
                src="/images/nigerian-shopkeeper.jpg"
                alt="A Nigerian shopkeeper standing inside a neighborhood store"
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 32vw"
                className="object-cover object-[center_38%]"
              />
              <div className="absolute inset-x-0 bottom-0 bg-blue-spruce-950/88 px-5 py-5 text-blue-spruce-50 backdrop-blur-[2px]">
                <p className="text-sm font-semibold">Built for the merchant next door.</p>
                <p className="mt-1 text-xs leading-5 text-blue-spruce-200">
                  Social commerce should not disappear when the sale becomes a transaction.
                </p>
              </div>
            </div>
            <figcaption className="mt-3 text-right text-xs text-ink-muted">
              Photo via Pexels
            </figcaption>
          </figure>
        </Reveal>

        <Reveal className="lg:col-span-7 lg:col-start-6" delay={0.1}>
          <h2 className="max-w-[680px] text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-ink sm:text-5xl lg:text-6xl">
            The sale is easy. The trust is missing.
          </h2>
          <p className="mt-7 max-w-[620px] text-lg leading-8 text-ink-muted">
            Buyers do not want to risk paying first. Vendors cannot absorb the losses that
            come with every rejected delivery.
          </p>

          <div className="mt-12 border-t border-line">
            <div className="grid gap-4 border-b border-line py-7 sm:grid-cols-[56px_1fr]">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-cinnamon-wood-100 text-cinnamon-wood-700">
                <ShieldWarning size={24} weight="duotone" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-lg font-semibold tracking-[-0.02em] text-ink">
                  Buyers need proof before paying
                </h3>
                <p className="mt-2 max-w-[520px] leading-7 text-ink-muted">
                  InstaSafe gives buyers a protected checkout instead of an unexplained bank
                  transfer.
                </p>
              </div>
            </div>
            <div className="grid gap-4 border-b border-line py-7 sm:grid-cols-[56px_1fr]">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-shamrock-100 text-shamrock-700">
                <Truck size={24} weight="duotone" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-lg font-semibold tracking-[-0.02em] text-ink">
                  Vendors need delivery before payout
                </h3>
                <p className="mt-2 max-w-[520px] leading-7 text-ink-muted">
                  A one-time code gives vendors a consistent release condition without
                  turning every sale into a manual process.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
