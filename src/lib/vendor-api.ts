import "server-only";

import { cookies } from "next/headers";

import { dedupeBanks } from "./banks";
import {
  getApiError,
  isSuccessful,
  requestToInstaSafe,
  type ApiEnvelope,
} from "./instasafe-server";
import type { Bank, Order, OrderTimeline, Vendor } from "./types";

export const VENDOR_COOKIE = "instasafe_vendor_token";

/**
 * A failed backend call, carrying the HTTP status so callers can tell an
 * expired session (401) from a permission problem (403) or a state conflict (409).
 */
export class VendorApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "VendorApiError";
    this.status = status;
  }
}

/** Reads the httpOnly cookie so the JWT never has to reach client JavaScript. */
export async function getVendorToken() {
  const store = await cookies();
  return store.get(VENDOR_COOKIE)?.value ?? null;
}

function statusMessage(status: number, fallback?: string | null) {
  switch (status) {
    case 401:
      return "Your vendor session has expired. Log in again to continue.";
    case 403:
      return "That record belongs to another vendor.";
    case 404:
      return fallback?.trim() || "We could not find that record.";
    case 409:
      return fallback?.trim() || "This order is not in a state that allows that action.";
    default:
      return fallback?.trim() || "The InstaSafe service could not complete that request.";
  }
}

async function call<T>(
  path: string,
  options: {
    token?: string | null;
    method?: "GET" | "POST" | "PUT";
    body?: unknown;
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
    throw new VendorApiError(
      error instanceof Error
        ? error.message
        : "The InstaSafe service could not be reached.",
      503,
    );
  }

  if (isSuccessful(result)) return result.payload.data ?? null;

  throw new VendorApiError(
    statusMessage(result.status, getApiError(result)),
    result.status,
  );
}

function requireToken(token: string | null | undefined) {
  if (!token) {
    throw new VendorApiError("Log in to continue.", 401);
  }
  return token;
}

/* ------------------------------------------------------------------ vendor */

export async function getSelfVendor(token: string | null | undefined) {
  const auth = requireToken(token);
  // Swagger types this as a single VendorDto; the guide describes `[self]`.
  // Accept both so the dashboard does not break on either shape.
  const data = await call<Vendor | Vendor[]>(`/api/vendors`, { token: auth });
  if (Array.isArray(data)) return data[0] ?? null;
  return data ?? null;
}

export async function getVendor(token: string | null | undefined, id: string) {
  return call<Vendor>(`/api/vendors/${encodeURIComponent(id)}`, {
    token: requireToken(token),
  });
}

export async function updateVendorProfile(
  token: string | null | undefined,
  id: string,
  displayName: string,
) {
  return call<Vendor>(`/api/vendors/${encodeURIComponent(id)}`, {
    token: requireToken(token),
    method: "PUT",
    body: { displayName },
  });
}

export async function updateVendorPhone(
  token: string | null | undefined,
  id: string,
  phone: string,
) {
  return call<Vendor>(`/api/vendors/${encodeURIComponent(id)}/phone`, {
    token: requireToken(token),
    method: "PUT",
    body: { phone },
  });
}

export async function setVendorActive(
  token: string | null | undefined,
  id: string,
  active: boolean,
) {
  return call<Vendor>(
    `/api/vendors/${encodeURIComponent(id)}/${active ? "reactivate" : "deactivate"}`,
    { token: requireToken(token), method: "POST" },
  );
}

/* ------------------------------------------------------------------ orders */

export type OrderPage = {
  orders: Order[];
  /** Set when the backend ignored page/pageSize and returned everything. */
  totalCount: number | null;
  page: number;
  pageSize: number;
};

export async function listOrders(
  token: string | null | undefined,
  options: { page?: number; pageSize?: number } = {},
) {
  const auth = requireToken(token);
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, options.pageSize ?? 10));
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  const data = await call<Order[]>(`/api/orders?${query.toString()}`, {
    token: auth,
  });
  const orders = data ?? [];

  // The response is a bare array with no total. If we got more than one page
  // worth, the server ignored the query string, so paginate here instead.
  if (orders.length > pageSize) {
    const start = (page - 1) * pageSize;
    return {
      orders: orders.slice(start, start + pageSize),
      totalCount: orders.length,
      page,
      pageSize,
    } satisfies OrderPage;
  }

  return { orders, totalCount: null, page, pageSize } satisfies OrderPage;
}

export async function getOrder(token: string | null | undefined, id: string) {
  return call<Order>(`/api/orders/${encodeURIComponent(id)}`, {
    token: requireToken(token),
  });
}

export type CreateOrderInput = {
  vendorPhone: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  buyerEmail: string;
  /** 0 = Dispatch (rider), 2 = SelfDelivery. 1 (Digital) is disabled server-side. */
  fulfillment: 0 | 2;
  deliveryFeeNgn: number;
  driverPhone?: string | null;
  driverAccountNumber?: string | null;
  driverBankCode?: string | null;
  amountNgn: number;
  items: { description: string; quantity: number; unitPriceNgn: number }[];
};

/**
 * `POST /api/orders` takes Naira (not kobo) and requires `vendorPhone` to match
 * the phone inside the JWT. Returns the new order including `paystackAuthUrl`,
 * which is what the buyer pays.
 */
export async function createOrder(
  token: string | null | undefined,
  input: CreateOrderInput,
) {
  return call<Order>("/api/orders", {
    token: requireToken(token),
    method: "POST",
    body: {
      vendorPhone: input.vendorPhone,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      deliveryAddress: input.deliveryAddress,
      buyerEmail: input.buyerEmail,
      fulfillment: input.fulfillment,
      deliveryFeeNgn: input.deliveryFeeNgn,
      driverPhone: input.driverPhone ?? null,
      driverAccountNumber: input.driverAccountNumber ?? null,
      driverBankCode: input.driverBankCode ?? null,
      amountNgn: input.amountNgn,
      items: input.items,
    },
  });
}

/** Public endpoint — the OTP/reference is the credential, no bearer needed. */
export async function getOrderTimeline(reference: string) {  return call<OrderTimeline>(
    `/api/orders/by-reference/${encodeURIComponent(reference)}/timeline`,
  );
}

export async function refundOrder(token: string | null | undefined, id: string) {
  return call<Order>(`/api/orders/${encodeURIComponent(id)}/refund`, {
    token: requireToken(token),
    method: "POST",
  });
}

export async function resolveDispute(
  token: string | null | undefined,
  id: string,
  resolution: "release" | "refund",
) {
  return call<Order>(`/api/orders/${encodeURIComponent(id)}/resolve-dispute`, {
    token: requireToken(token),
    method: "POST",
    body: { resolution },
  });
}

export async function requestBankTransfer(
  token: string | null | undefined,
  id: string,
  preferredBank?: string,
) {
  return call<Order>(`/api/orders/${encodeURIComponent(id)}/request-bank-transfer`, {
    token: requireToken(token),
    method: "POST",
    body: preferredBank ? { preferredBank } : {},
  });
}

/* ------------------------------------------------------------------- banks */

export async function listBanks(options: { transferOnly?: boolean } = {}) {
  const query = options.transferOnly ? "?transferOnly=true" : "";
  const data = await call<Bank[]>(`/api/payments/banks${query}`);
  return dedupeBanks(data);
}

export async function resolveBankAccount(
  accountNumber: string,
  bankCode: string,
) {
  const query = new URLSearchParams({ accountNumber, bankCode });
  return call<{ accountNumber?: string; bankCode?: string; accountName?: string }>(
    `/api/payments/banks/resolve?${query.toString()}`,
  );
}
