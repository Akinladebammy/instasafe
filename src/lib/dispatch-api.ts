import "server-only";

import { cookies } from "next/headers";

import {
  DISPATCH_COOKIE,
  getApiError,
  isSuccessful,
  requestToInstaSafe,
  type ApiEnvelope,
} from "./instasafe-server";
import type { Order } from "./types";

export type Dispatcher = {
  id: string;
  phone?: string | null;
  isActive?: boolean;
  createdAt?: string | null;
};

export type DispatcherAuth = {
  token?: string | null;
  dispatcher?: Dispatcher | null;
  expiresInHours?: number | null;
};

export class DispatchApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "DispatchApiError";
    this.status = status;
  }
}

/** The rider token lives in its own cookie, separate from the vendor session. */
export async function getDispatchToken() {
  const store = await cookies();
  return store.get(DISPATCH_COOKIE)?.value ?? null;
}

function messageFor(status: number, fallback?: string | null) {
  switch (status) {
    case 401:
      return "Your rider session has expired. Request a new code to sign in again.";
    case 403:
      return "That delivery is assigned to another rider.";
    case 404:
      return "We could not find that delivery.";
    case 409:
      return fallback?.trim() || "This delivery is no longer waiting on you.";
    default:
      return (
        fallback?.trim() || "The InstaSafe service could not complete that request."
      );
  }
}

async function call<T>(
  path: string,
  options: {
    token?: string | null;
    method?: "GET" | "POST";
    body?: unknown;
    /**
     * 401 is overloaded here: the API uses it both for an invalid bearer token
     * and for a wrong login code, so the caller decides which to report.
     */
    unauthorized?: string;
  } = {},
): Promise<T | null> {
  let result: { status: number; payload: ApiEnvelope<T> };

  try {
    result = await requestToInstaSafe<T>(path, {
      method: options.method ?? "GET",
      body: options.body,
      token: options.token,
    });
  } catch (error) {
    throw new DispatchApiError(
      error instanceof Error
        ? error.message
        : "The InstaSafe service could not be reached.",
      503,
    );
  }

  if (isSuccessful(result)) return result.payload.data ?? null;

  if (result.status === 401 && options.unauthorized) {
    throw new DispatchApiError(options.unauthorized, 401);
  }

  throw new DispatchApiError(
    messageFor(result.status, getApiError(result)),
    result.status,
  );
}

/**
 * Public. Works for any phone number — the backend creates the rider row on
 * first use — so there is no "account not found" path to handle.
 */
export async function requestDispatchCode(phone: string) {
  return call<boolean>("/api/dispatch/request-code", {
    method: "POST",
    body: { phone },
  });
}

export async function verifyDispatchCode(phone: string, code: string) {
  return call<DispatcherAuth>("/api/dispatch/verify-code", {
    method: "POST",
    body: { phone, code },
    // A 401 here means the code was wrong or expired, not that a session lapsed.
    unauthorized: "That code is wrong or has expired. Request a new one.",
  });
}

export type AssignedPage = {
  orders: Order[];
  totalCount: number | null;
  page: number;
  pageSize: number;
};

/**
 * The API returns only the rider's own Held and Delivered deliveries, newest
 * first, as a bare array with no total — same shape as the vendor order list.
 */
export async function listAssigned(
  token: string | null | undefined,
  options: { page?: number; pageSize?: number } = {},
) {
  if (!token) throw new DispatchApiError("Sign in to see your deliveries.", 401);

  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, options.pageSize ?? 20));
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  const data = await call<Order[]>(`/api/dispatch/assigned?${query.toString()}`, {
    token,
  });
  const orders = data ?? [];

  if (orders.length > pageSize) {
    const start = (page - 1) * pageSize;
    return {
      orders: orders.slice(start, start + pageSize),
      totalCount: orders.length,
      page,
      pageSize,
    } satisfies AssignedPage;
  }

  return { orders, totalCount: null, page, pageSize } satisfies AssignedPage;
}

/**
 * Confirms delivery with the buyer's OTP. This marks the order Delivered, starts
 * the 24-hour inspection window and pays the rider fee.
 */
export async function confirmDelivery(
  token: string | null | undefined,
  orderId: string,
  otp: string,
) {
  if (!token) throw new DispatchApiError("Sign in to confirm a delivery.", 401);

  return call<Order>(
    `/api/dispatch/orders/${encodeURIComponent(orderId)}/confirm`,
    {
      token,
      method: "POST",
      body: { otp },
      // The API answers 400 for a wrong buyer code; 401 is a lapsed session.
    },
  );
}
