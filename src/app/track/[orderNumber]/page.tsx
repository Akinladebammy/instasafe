import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TrackView, loadTrack } from "../_view";

/**
 * The route the backend links to.
 *
 * `Frontend:BaseUrl` points at this app, and the backend puts a link shaped
 * `/track/IS-8K4N2Q` into the buyer's payment-link WhatsApp, the bank-transfer
 * message, the status emails, and the dispatcher's assignment WhatsApp. So this
 * is not an optimisation or a nicety — it is the contract.
 *
 * `orderNumber` is a **bearer token**: these endpoints are anonymous and it is
 * the only credential. That is why
 *   - the page is `noindex`,
 *   - `referrerPolicy` is `no-referrer`, so the number can never leak through a
 *     `Referer` header to an external origin, and
 *   - nothing on the page is fetched from or links to a third party.
 *
 * The segment is not restricted to the `IS-XXXXXX` shape. `by-reference` also
 * accepts a Paystack reference or a GUID, and older links in the wild use those,
 * so any single non-empty segment is passed through as-is.
 */
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Track your order — InstaSafe",
    // Never index: the URL is a credential.
    robots: { index: false, follow: false, nocache: true },
  };
}

export const referrerPolicy = "no-referrer";

export default async function TrackByNumberPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const reference = decodeURIComponent(orderNumber ?? "").trim();

  // `notFound()` rather than a 200: an unknown number is a 404, but the
  // `not-found.tsx` alongside this route keeps it a readable buyer page rather
  // than a framework error screen.
  if (!reference) notFound();

  const data = await loadTrack(reference);
  if (!data) notFound();

  return <TrackView order={data.order} timeline={data.timeline} />;
}
