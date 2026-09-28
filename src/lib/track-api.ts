import "server-only";

import {
  getApiError,
  isSuccessful,
  requestToInstaSafe,
  type ApiEnvelope,
} from "./instasafe-server";
import type { Order, OrderTimeline } from "./types";

/**
 * Buyer-facing endpoints. These are public by design: the order reference is the
 * credential, which is why `confirm-satisfaction`, `dispute` and `verify-otp`
 * take no bearer token. Nothing here should ever be called with a session.
 */
export class TrackApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "TrackApiError";
    this.status = status;
  }
}

function messageFor(status: number, fallback?: string | null) {
  // The three guest POST endpoints currently answer
  // {"Success":false,"Message":"Validation failed.","Errors":["'Order Id' must not be empty."]}
  // even when the path carries a well-formed id, so the route parameter is not
  // being bound server-side. Say that plainly rather than show the raw text.
  if (fallback && /order id' must not be empty/i.test(fallback)) {
    return "The InstaSafe API did not accept this action because the order id did not reach it. That looks like a server-side issue on this endpoint — try again shortly or contact the vendor.";
  }

  switch (status) {
    case 404:
      return "We could not find an order with that reference. Check the link your vendor sent you.";
    case 400:
      return fallback?.trim() || "That did not work. Check the details and try again.";
    case 401:
    case 403:
      return fallback?.trim() || "This order cannot be changed from here.";
    case 409:
      return fallback?.trim() || "This order is not in a state that allows that.";
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
  return call<Order>(`/api/orders/by-reference/${encodeURIComponent(reference)}`);
}

export async function getTimelineByReference(reference: string) {
  return call<OrderTimeline>(
    `/api/orders/by-reference/${encodeURIComponent(reference)}/timeline`,
  );
}

/** Digital goods: the buyer releases their own funds immediately. */
export async function confirmSatisfaction(orderId: string) {
  return call<Order>(`/api/orders/${encodeURIComponent(orderId)}/confirm-satisfaction`, {
    method: "POST",
    body: {},
  });
}

/** Freezes the funds while it is sorted out. Allowed while Held or Delivered. */
export async function raiseDispute(orderId: string, reason: string) {
  return call<Order>(`/api/orders/${encodeURIComponent(orderId)}/dispute`, {
    method: "POST",
    body: { reason },
  });
}

/**
 * Legacy / rider-less path: releases digital orders and dispatch orders that have
 * no assigned driver. Orders with a driver must be confirmed by the rider in the
 * dispatch portal instead.
 */
export async function verifyOrderOtp(orderId: string, otp: string) {
  return call<Order>(`/api/orders/${encodeURIComponent(orderId)}/verify-otp`, {
    method: "POST",
    body: { otp },
  });
}
