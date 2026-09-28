import "server-only";

import {
  getApiError,
  isSuccessful,
  requestToInstaSafe,
  type ApiEnvelope,
} from "./instasafe-server";
import type { OrderTimeline, PublicOrder } from "./types";

/**
 * Buyer-facing endpoints. These are public by design: the order number is the
 * credential, which is why `verify-otp` and `dispute` take no bearer token.
 * Nothing here should ever be called with a session.
 *
 * They return `PublicOrderDto`, not the full order — no buyer contact details, no
 * Paystack/transfer/refund reference, no payment URL, no escrow account.
 */
export class TrackApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "TrackApiError";
    this.status = status;
  }
}

/**
 * Buyer-facing copy.
 *
 * The API's `409`s ("Order is Delivered, OTP not expected.", "Cannot dispute
 * from status AwaitingPayment.") describe the internal state machine, and each
 * one means the gate in `order-status.ts` let a button through that should not
 * have been rendered. Passing that string to a buyer leaks the machine and
 * invites a support ticket, so `409` gets its own plain-English message and the
 * raw text is never surfaced. Same reasoning for a wrong OTP: `400` there is a
 * bad guess, not a bad order.
 */
function messageFor(status: number, fallback?: string | null) {
  switch (status) {
    case 404:
      return "We could not find an order with that number. Check the link your vendor sent you.";
    case 400:
      // A driver-assigned dispatch order reaching verify-otp is a real, expected
      // case, and the API's wording is already buyer-safe — keep it.
      if (fallback && /dispatcher|driver portal/i.test(fallback)) {
        return fallback.trim();
      }
      return fallback?.trim() || "That did not work. Check the details and try again.";
    case 401:
    case 403:
      return fallback?.trim() || "This order cannot be changed from here.";
    case 409:
      return "This order has already moved on, so that action is closed. Reload the page to see where it stands now.";
    default:
      return fallback?.trim() || "The InstaSafe service could not complete that request.";
  }
}

async function call<T>(
  path: string,
  options: { method?: "GET" | "POST"; body?: unknown } = {},
): Promise<T | null> {
  let result: { status: number; payload: ApiEnvelope<T> };

  try {
    result = await requestToInstaSafe<T>(path, {
      method: options.method ?? "GET",
      body: options.body,
    });
  } catch (error) {
    throw new TrackApiError(
      error instanceof Error
        ? error.message
        : "The InstaSafe service could not be reached.",
      503,
    );
  }

  if (isSuccessful(result)) return result.payload.data ?? null;

  throw new TrackApiError(
    messageFor(result.status, getApiError(result)),
    result.status,
  );
}

export async function getOrderByReference(reference: string) {
  return call<PublicOrder>(`/api/orders/by-reference/${encodeURIComponent(reference)}`);
}

export async function getTimelineByReference(reference: string) {
  return call<OrderTimeline>(
    `/api/orders/by-reference/${encodeURIComponent(reference)}/timeline`,
  );
}

/** Freezes the funds while it is sorted out. Allowed while Held or Delivered. */
export async function raiseDispute(orderId: string, reason: string) {
  return call<PublicOrder>(`/api/orders/${encodeURIComponent(orderId)}/dispute`, {
    method: "POST",
    body: { reason },
  });
}

/**
 * The buyer's release action, for a **self-delivery** order that is still `Held`.
 * A Dispatch order is released by its rider in the driver portal.
 */
export async function verifyOrderOtp(orderId: string, otp: string) {
  return call<PublicOrder>(`/api/orders/${encodeURIComponent(orderId)}/verify-otp`, {
    method: "POST",
    body: { otp },
  });
}
