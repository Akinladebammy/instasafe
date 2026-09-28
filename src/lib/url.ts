import "server-only";

import { headers } from "next/headers";

/**
 * Builds an absolute URL for the current request.
 *
 * The buyer tracking link has to be shareable in a WhatsApp message, so it must
 * carry the real host. Reading it from the request headers keeps it correct in
 * dev, on a preview deployment and in production without a build-time env var,
 * and it means the value can be rendered on the server instead of being patched
 * in from an effect on the client.
 */
export async function currentOrigin() {
  const store = await headers();
  const host =
    store.get("x-forwarded-host") ?? store.get("host") ?? "localhost:3000";
  const forwardedProto = store.get("x-forwarded-proto");
  const protocol = forwardedProto ?? (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  return `${protocol}://${host}`;
}

/** The link a vendor pastes into the message so the buyer can click through. */
export async function trackUrlFor(reference: string) {
  return `${await currentOrigin()}/track?ref=${encodeURIComponent(reference)}`;
}
