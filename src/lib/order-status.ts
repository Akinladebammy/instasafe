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

export type FulfillmentKey = "Dispatch" | "Digital";

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

const FULFILLMENT_BY_NUMBER: Record<number, FulfillmentKey> = {
  0: "Dispatch",
  1: "Digital",
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
    if (value.toLowerCase() === "digital") return "Digital";
    if (value.toLowerCase() === "dispatch") return "Dispatch";
  }
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

/** Digital goods can be released instantly by the buyer confirming. */
export function isDigitalFulfilment(fulfillment: FulfillmentKey) {
  return fulfillment === "Digital";
}

/* ------------------------------------------------- buyer-facing permissions */

/**
 * `confirm-satisfaction` is for digital goods. There is no parcel to deliver, so
 * the order sits in Held until the buyer releases it themselves.
 */
export function canConfirmSatisfaction(
  status: OrderStatusKey,
  fulfillment: FulfillmentKey,
) {
  return isDigitalFulfilment(fulfillment) && (status === "Held" || status === "Delivered");
}

/** A dispute can only freeze money that is still in escrow. */
export function canRaiseDispute(status: OrderStatusKey) {
  return status === "Held" || status === "Delivered";
}

/**
 * `verify-otp` is the legacy / rider-less path. The API guide is explicit that
 * orders with an assigned driver must be confirmed by the rider instead, so we
 * hide the box rather than letting the buyer hit a rejection.
 */
export function canVerifyOtp(
  status: OrderStatusKey,
  fulfillment: FulfillmentKey,
  driverPhone: string | null | undefined,
) {
  if (status !== "Held" && status !== "Delivered") return false;
  if (isDigitalFulfilment(fulfillment)) return true;
  return !driverPhone;
}

/** Riders only ever see Held (to confirm) and Delivered (already handed over). */
export function isRiderActionable(status: OrderStatusKey) {
  return status === "Held";
}

export function isRiderCompleted(status: OrderStatusKey) {
  return status === "Delivered";
}
