// Order status/fulfillment helpers.
//
// The deployed API serialises `OrderStatus` and `FulfillmentType` as integers
// (see swagger: OrderStatus enum [0..7], FulfillmentType enum [0,1]), while the
// API guide documents them by name. Every helper here accepts either form so the
// UI keeps working if the backend switches to a string enum converter.

export type OrderStatusKey =
  | "Draft"
  | "AwaitingPayment"
  | "Held"
  | "Delivered"
  | "Released"
  | "Refunded"
  | "Disputed"
  | "Cancelled";

export type FulfillmentKey = "Dispatch" | "SelfDelivery";

/**
 * `Delivered` was appended to the enum after the original set shipped, which is
 * why it sits at 7 rather than between Held and Released in lifecycle order.
 */
const STATUS_BY_NUMBER: Record<number, OrderStatusKey> = {
  0: "Draft",
  1: "AwaitingPayment",
  2: "Held",
  3: "Released",
  4: "Refunded",
  5: "Disputed",
  6: "Cancelled",
  7: "Delivered",
};

const STATUS_LABEL: Record<OrderStatusKey, string> = {
  Draft: "Draft",
  AwaitingPayment: "Awaiting payment",
  Held: "Funds held",
  Delivered: "Delivered",
  Released: "Released",
  Refunded: "Refunded",
  Disputed: "Disputed",
  Cancelled: "Cancelled",
};

const STATUS_TONE: Record<
  OrderStatusKey,
  "neutral" | "info" | "good" | "warn" | "bad" | "pending"
> = {
  Draft: "neutral",
  AwaitingPayment: "info",
  Held: "pending",
  Delivered: "warn",
  Released: "good",
  Refunded: "info",
  Disputed: "bad",
  Cancelled: "neutral",
};

/**
 * Fulfilment is a NUMBER the vendor picks, and the enum has a deliberate gap:
 * `1` (Digital) is disabled server-side and answers `400
 * fulfillment.unsupported`, so no new order can ever be Digital.
 */
const FULFILLMENT_BY_NUMBER: Record<number, FulfillmentKey> = {
  0: "Dispatch",
  2: "SelfDelivery",
};

const FALLBACK_STATUS = "Draft";

export function toStatusKey(value: unknown): OrderStatusKey {
  if (typeof value === "number") return STATUS_BY_NUMBER[value] ?? FALLBACK_STATUS;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed in STATUS_LABEL) return trimmed as OrderStatusKey;
    if (/^\d+$/.test(trimmed)) {
      return STATUS_BY_NUMBER[Number(trimmed)] ?? FALLBACK_STATUS;
    }
    // Case-insensitive fallback for camelCase JSON, e.g. "awaitingPayment".
    const match = Object.keys(STATUS_LABEL).find(
      (key) => key.toLowerCase() === trimmed.toLowerCase(),
    );
    return (match as OrderStatusKey) ?? FALLBACK_STATUS;
  }
  return FALLBACK_STATUS;
}

export function toFulfillmentKey(value: unknown): FulfillmentKey {
  if (typeof value === "number") return FULFILLMENT_BY_NUMBER[value] ?? "Dispatch";
  if (typeof value === "string") {
    const needle = value.trim().toLowerCase().replace(/[\s_-]/g, "");
    if (needle === "selfdelivery") return "SelfDelivery";
    if (needle === "dispatch") return "Dispatch";
    if (/^\d+$/.test(needle)) {
      return FULFILLMENT_BY_NUMBER[Number(needle)] ?? "Dispatch";
    }
  }
  // A `1` from a pre-migration row still means "no rider hands this over", which
  // is the self-delivery path today. Do not call it Digital — that flow is gone.
  return "Dispatch";
}

export function statusLabel(status: OrderStatusKey) {
  return STATUS_LABEL[status];
}

export function statusTone(status: OrderStatusKey) {
  return STATUS_TONE[status];
}

/** Statuses that still count as live activity for the dashboard headline. */
export const ACTIVE_STATUSES: OrderStatusKey[] = [
  "AwaitingPayment",
  "Held",
  "Delivered",
  "Disputed",
];

/** Can the vendor issue a refund? Held and Delivered are real Paystack refunds. */
export function canRefund(status: OrderStatusKey) {
  return status === "Held" || status === "Delivered";
}

/** Only disputed orders can be resolved. */
export function canResolveDispute(status: OrderStatusKey) {
  return status === "Disputed";
}

/**
 * Bank-transfer details can only be requested while payment is still pending.
 * Released orders answer 409.
 */
export function canRequestBankTransfer(status: OrderStatusKey) {
  return status === "AwaitingPayment" || status === "Draft";
}

/** The vendor hands it over in person; no rider is involved. */
export function isSelfDelivery(fulfillment: FulfillmentKey) {
  return fulfillment === "SelfDelivery";
}

export function fulfillmentLabel(fulfillment: FulfillmentKey) {
  return fulfillment === "SelfDelivery" ? "Vendor delivery" : "Rider delivery";
}

/* ------------------------------------------------- buyer-facing permissions */

/**
 * `confirm-satisfaction` was Digital-only and Digital is now disabled server-side
 * (`400 fulfillment.unsupported`), so the endpoint can never succeed on a new
 * order. It is deliberately not implemented: the buyer's one release action is
 * `verify-otp`.
 *
 * A dispute can only freeze money that is still in escrow.
 */
export function canRaiseDispute(status: OrderStatusKey) {
  return status === "Held" || status === "Delivered";
}

/**
 * `verify-otp` is the buyer's release action, and only for a self-delivery order
 * that is still `Held`:
 *
 * - `Held` only. `Delivered` is already inside the 24h inspection window, where
 *   the correct action is a dispute or nothing — the API answers `409 "Order is
 *   <Status>, OTP not expected."`.
 * - Self-delivery only. A Dispatch order is released by its rider in the driver
 *   portal, so asking the buyer for their own code on one always fails with
 *   `400 "This order has an assigned dispatcher…"`.
 *
 * `fulfillment` alone decides this. `driverPhone` is not on `PublicOrderDto`, and
 * no longer needs to be — that is precisely why fulfilment became explicit.
 */
export function canVerifyOtp(
  status: OrderStatusKey,
  fulfillment: FulfillmentKey,
) {
  return status === "Held" && isSelfDelivery(fulfillment);
}

/** A `Held` Dispatch order is waiting on its rider, not on the buyer. */
export function isAwaitingRider(
  status: OrderStatusKey,
  fulfillment: FulfillmentKey,
) {
  return status === "Held" && !isSelfDelivery(fulfillment);
}

/** Riders only ever see Held (to confirm) and Delivered (already handed over). */
export function isRiderActionable(status: OrderStatusKey) {
  return status === "Held";
}

export function isRiderCompleted(status: OrderStatusKey) {
  return status === "Delivered";
}
