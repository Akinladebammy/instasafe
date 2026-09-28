import "server-only";

import { cookies } from "next/headers";

import {
  ADMIN_COOKIE,
  getApiError,
  isSuccessful,
  requestToInstaSafe,
  type ApiEnvelope,
} from "./instasafe-server";
import type { Dispatcher } from "./dispatch-api";
import type { Order, Vendor } from "./types";

export type AdminStats = {
  vendorTotal?: number | null;
  vendorActive?: number | null;
  ordersByStatus?: Record<string, number> | null;
  heldGmvKobo?: number | null;
  releasedTodayKobo?: number | null;
  openDisputes?: number | null;
  openDraftTickets?: number | null;
  failedWebhooks24h?: number | null;
  outboxBacklog?: number | null;
};

export type OutboxError = {
  id?: string | null;
  type?: string | null;
  attempts?: number | null;
  error?: string | null;
  createdAt?: string | null;
};

export type OutboxStatus = {
  backlog?: number | null;
  recentErrors?: OutboxError[] | null;
};

export type WebhookEvent = {
  id?: string | null;
  provider?: string | null;
  eventType?: string | null;
  signatureValid?: boolean | null;
  processed?: boolean | null;
  idempotencyKey?: string | null;
  createdAt?: string | null;
};

export type ChatMessage = {
  id?: string | null;
  phone?: string | null;
  direction?: string | null;
  body?: string | null;
  createdAt?: string | null;
};

export type AuditEntry = {
  id?: string | null;
  actor?: string | null;
  action?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  note?: string | null;
  createdAt?: string | null;
};

export class AdminApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
  }
}

export async function getAdminToken() {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value ?? null;
}

function messageFor(status: number, fallback?: string | null) {
  switch (status) {
    case 401:
      return "Your admin session has expired. Sign in again.";
    case 403:
      return "That action needs the super-admin role.";
    case 404:
      return "We could not find that record.";
    case 409:
      return fallback?.trim() || "That record is not in a state that allows this.";
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
    throw new AdminApiError(
      error instanceof Error
        ? error.message
        : "The InstaSafe service could not be reached.",
      503,
    );
  }

  if (isSuccessful(result)) return result.payload.data ?? null;

  throw new AdminApiError(
    messageFor(result.status, getApiError(result)),
    result.status,
  );
}

/**
 * List endpoints answer with a bare array. Treat a null body as an empty set
 * rather than making every page defend against it — a missing list is a normal
 * state, not an error to propagate.
 */
async function callList<T>(
  path: string,
  options: { token?: string | null; method?: "GET" | "POST"; body?: unknown } = {},
): Promise<T[]> {
  const data = await call<T[]>(path, options);
  return Array.isArray(data) ? data : [];
}

function requireToken(token: string | null | undefined) {
  if (!token) throw new AdminApiError("Sign in as an admin to continue.", 401);
  return token;
}

function query(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "" || value === false) continue;
    search.set(key, String(value));
  }
  const value = search.toString();
  return value ? `?${value}` : "";
}

/* ------------------------------------------------------------------ reads */

export async function getStats(token: string | null | undefined) {
  return call<AdminStats>("/api/admin/stats", { token: requireToken(token) });
}

export async function listVendors(
  token: string | null | undefined,
  options: { q?: string; page?: number; pageSize?: number } = {},
) {
  return callList<Vendor>(
    `/api/admin/vendors${query({ q: options.q, page: options.page ?? 1, pageSize: options.pageSize ?? 25 })}`,
    { token: requireToken(token) },
  );
}

export async function getVendor(token: string | null | undefined, id: string) {
  return call<Vendor>(`/api/admin/vendors/${encodeURIComponent(id)}`, {
    token: requireToken(token),
  });
}

export async function listAdminOrders(
  token: string | null | undefined,
  options: { status?: string; q?: string; page?: number; pageSize?: number } = {},
) {
  return callList<Order>(
    `/api/admin/orders${query({
      status: options.status,
      q: options.q,
      page: options.page ?? 1,
      pageSize: options.pageSize ?? 25,
    })}`,
    { token: requireToken(token) },
  );
}

export async function getAdminOrder(token: string | null | undefined, id: string) {
  return call<Order>(`/api/admin/orders/${encodeURIComponent(id)}`, {
    token: requireToken(token),
  });
}

export async function listDisputes(
  token: string | null | undefined,
  options: { page?: number; pageSize?: number } = {},
) {
  return callList<Order>(
    `/api/admin/disputes${query({ page: options.page ?? 1, pageSize: options.pageSize ?? 25 })}`,
    { token: requireToken(token) },
  );
}

export async function listDispatchers(
  token: string | null | undefined,
  options: { page?: number; pageSize?: number } = {},
) {
  return callList<Dispatcher>(
    `/api/admin/dispatchers${query({ page: options.page ?? 1, pageSize: options.pageSize ?? 50 })}`,
    { token: requireToken(token) },
  );
}

export async function getOutbox(token: string | null | undefined) {
  return call<OutboxStatus>("/api/admin/outbox", { token: requireToken(token) });
}

export async function listWebhooks(
  token: string | null | undefined,
  options: {
    provider?: string;
    event?: string;
    validOnly?: boolean;
    page?: number;
    pageSize?: number;
  } = {},
) {
  return callList<WebhookEvent>(
    `/api/admin/webhooks${query({
      provider: options.provider,
      event: options.event,
      validOnly: options.validOnly,
      page: options.page ?? 1,
      pageSize: options.pageSize ?? 25,
    })}`,
    { token: requireToken(token) },
  );
}

export async function listChats(
  token: string | null | undefined,
  options: {
    phone?: string;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  } = {},
) {
  return callList<ChatMessage>(
    `/api/admin/chats${query({
      phone: options.phone,
      from: options.from,
      to: options.to,
      page: options.page ?? 1,
      pageSize: options.pageSize ?? 50,
    })}`,
    { token: requireToken(token) },
  );
}

export async function listAudit(
  token: string | null | undefined,
  options: { action?: string; page?: number; pageSize?: number } = {},
) {
  return callList<AuditEntry>(
    `/api/admin/audit${query({
      action: options.action,
      page: options.page ?? 1,
      pageSize: options.pageSize ?? 50,
    })}`,
    { token: requireToken(token) },
  );
}

/* --------------------------------------------------------------- mutations */

export async function setVendorActive(
  token: string | null | undefined,
  id: string,
  active: boolean,
) {
  return call<Vendor>(
    `/api/admin/vendors/${encodeURIComponent(id)}/${active ? "reactivate" : "deactivate"}`,
    { token: requireToken(token), method: "POST" },
  );
}

export async function setVendorPhone(
  token: string | null | undefined,
  id: string,
  phone: string,
) {
  return call<Vendor>(`/api/admin/vendors/${encodeURIComponent(id)}/phone`, {
    token: requireToken(token),
    method: "PUT",
    body: { phone },
  });
}

export async function setDispatcherActive(
  token: string | null | undefined,
  id: string,
  active: boolean,
) {
  return call<Dispatcher>(
    `/api/admin/dispatchers/${encodeURIComponent(id)}/${active ? "reactivate" : "deactivate"}`,
    { token: requireToken(token), method: "POST" },
  );
}

export async function adminRefundOrder(
  token: string | null | undefined,
  id: string,
) {
  return call<Order>(`/api/admin/orders/${encodeURIComponent(id)}/refund`, {
    token: requireToken(token),
    method: "POST",
  });
}

export async function adminResolveDispute(
  token: string | null | undefined,
  id: string,
  resolution: "release" | "refund",
) {
  return call<Order>(`/api/admin/orders/${encodeURIComponent(id)}/resolve-dispute`, {
    token: requireToken(token),
    method: "POST",
    body: { resolution },
  });
}

/**
 * Re-runs the vendor payout for an order already marked `Released` whose transfer
 * never completed (no `transferReference`).
 *
 * The two failure messages are NOT interchangeable, so they are not collapsed
 * into one generic error:
 *   - "Paystack rejected the transfer" — nothing was sent, safe to retry once
 *     the balance or recipient is fixed.
 *   - "outcome is unknown" — the transfer may have gone through; check Paystack
 *     for `InstaSafe payout {orderId}` before retrying or risk a double payment.
 */
export async function adminRetryPayout(
  token: string | null | undefined,
  id: string,
) {
  return call<Order>(`/api/admin/orders/${encodeURIComponent(id)}/retry-payout`, {
    token: requireToken(token),
    method: "POST",
  });
}

/** Pays the vendor the remainder from Held/Delivered/Disputed. Anything else 409s. */
export async function adminForceRelease(
  token: string | null | undefined,
  id: string,
  note: string,
) {
  return call<Order>(`/api/admin/orders/${encodeURIComponent(id)}/force-release`, {
    token: requireToken(token),
    method: "POST",
    body: { note },
  });
}
