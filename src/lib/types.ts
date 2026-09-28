import { FulfillmentKey, type OrderStatusKey, toFulfillmentKey, toStatusKey } from "./order-status";

export type Vendor = {
  id: string;
  phone?: string | null;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  accountNumber?: string | null;
  bankCode?: string | null;
  paystackRecipientCode?: string | null;
  isActive?: boolean;
  emailVerified?: boolean;
  onboardingCompleted?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type OrderItem = {
  description?: string | null;
  quantity?: number | null;
  unitPriceKobo?: number | null;
};

export type Order = {
  id: string;
  /**
   * Stable customer-facing number, `IS-XXXXXX`. The API guide is explicit that
   * this is the identifier to use everywhere a buyer sees an order — tracker,
   * WhatsApp, receipts — while `paystackReference` stays internal for payment
   * matching. Lookup endpoints accept the number, the reference or the id.
   */
  orderNumber?: string | null;
  vendorPhone?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  deliveryAddress?: string | null;
  buyerEmail?: string | null;
  items?: OrderItem[] | null;
  amountKobo?: number | null;
  currency?: string | null;
  status?: unknown;
  paystackReference?: string | null;
  paystackAuthUrl?: string | null;
  heldAt?: string | null;
  releasedAt?: string | null;
  transferReference?: string | null;
  refundReference?: string | null;
  fulfillment?: unknown;
  deliveryFeeKobo?: number | null;
  driverPhone?: string | null;
  driverTransferReference?: string | null;
  deliveredAt?: string | null;
  releaseDueAt?: string | null;
  disputeReason?: string | null;
  payVirtualAccountNumber?: string | null;
  payVirtualAccountBank?: string | null;
};

export type TimelineEvent = {
  key?: string | null;
  label?: string | null;
  at?: string | null;
};

/**
 * `PublicOrderDto` — what `GET /api/orders/by-reference/{ref}` and the guest
 * actions actually return.
 *
 * This is a separate type on purpose. The public track endpoints are anonymous
 * and the order number is the only credential, so the backend deliberately drops
 * buyer contact details, every Paystack/transfer/refund reference, the payment
 * auth URL and the escrow virtual account. Typing it as its own shape means the
 * track page *cannot* read a field the API no longer sends — it fails to compile
 * instead of silently rendering `undefined` or, worse, quietly showing nothing.
 */
export type PublicOrder = {
  id: string;
  orderNumber?: string | null;
  status?: unknown;
  fulfillment?: unknown;
  amountKobo?: number | null;
  deliveryFeeKobo?: number | null;
  currency?: string | null;
  customerName?: string | null;
  deliveryAddress?: string | null;
  items?: OrderItem[] | null;
  heldAt?: string | null;
  deliveredAt?: string | null;
  releaseDueAt?: string | null;
  releasedAt?: string | null;
  disputeReason?: string | null;
};

/**
 * `DispatchOrderDto` — the rider portal's view.
 *
 * Notably there is no `amountKobo`: a rider never handles the order value, and
 * `deliveryFeeKobo` is their own payout. So a rider screen must never quote the
 * buyer a total.
 */
export type DispatchOrder = {
  id: string;
  orderNumber?: string | null;
  status?: unknown;
  fulfillment?: unknown;
  customerName?: string | null;
  customerPhone?: string | null;
  deliveryAddress?: string | null;
  deliveryFeeKobo?: number | null;
  currency?: string | null;
  items?: OrderItem[] | null;
  driverPhone?: string | null;
  deliveredAt?: string | null;
  releaseDueAt?: string | null;
};

export type OrderTimeline = {
  orderId?: string | null;
  reference?: string | null;
  status?: string | null;
  amountKobo?: number | null;
  events?: TimelineEvent[] | null;
};

export type Bank = {
  name: string;
  slug: string;
  code: string;
};

/** An order with its enums already decoded for display. */
export type DecodedOrder = Order & {
  statusKey: OrderStatusKey;
  fulfillmentKey: FulfillmentKey;
  /** amount + delivery fee, in kobo. This is what the buyer pays. */
  totalKobo: number;
};

export function decodeOrder(order: Order): DecodedOrder {
  const amountKobo = order.amountKobo ?? 0;
  const deliveryFeeKobo = order.deliveryFeeKobo ?? 0;
  return {
    ...order,
    statusKey: toStatusKey(order.status),
    fulfillmentKey: toFulfillmentKey(order.fulfillment),
    totalKobo: amountKobo + deliveryFeeKobo,
  };
}

export function decodeOrders(orders: Order[] | null | undefined) {
  return (orders ?? []).map(decodeOrder);
}

export type DecodedPublicOrder = PublicOrder & {
  statusKey: OrderStatusKey;
  fulfillmentKey: FulfillmentKey;
  /** amount + delivery fee, in kobo. This is what the buyer pays. */
  totalKobo: number;
};

export function decodePublicOrder(order: PublicOrder): DecodedPublicOrder {
  const amountKobo = order.amountKobo ?? 0;
  const deliveryFeeKobo = order.deliveryFeeKobo ?? 0;
  return {
    ...order,
    statusKey: toStatusKey(order.status),
    fulfillmentKey: toFulfillmentKey(order.fulfillment),
    totalKobo: amountKobo + deliveryFeeKobo,
  };
}

export type DecodedDispatchOrder = DispatchOrder & {
  statusKey: OrderStatusKey;
  fulfillmentKey: FulfillmentKey;
};

export function decodeDispatchOrder(order: DispatchOrder): DecodedDispatchOrder {
  return {
    ...order,
    statusKey: toStatusKey(order.status),
    fulfillmentKey: toFulfillmentKey(order.fulfillment),
  };
}

export function decodeDispatchOrders(orders: DispatchOrder[] | null | undefined) {
  return (orders ?? []).map(decodeDispatchOrder);
}

/**
 * The identifier to show a person.
 *
 * Prefers the customer-facing `IS-XXXXXX` order number, falls back to the
 * Paystack reference and finally the raw id, so an order created before
 * `orderNumber` existed still renders something sensible.
 */
export function orderNumber(
  order: Pick<Order, "orderNumber" | "paystackReference" | "id">,
) {
  return order.orderNumber?.trim() || order.paystackReference?.trim() || order.id;
}

/**
 * Public-side variant. `PublicOrderDto` carries no Paystack reference, so this is
 * the order number or the id — nothing to fall back through.
 */
export function publicOrderNumber(order: Pick<PublicOrder, "orderNumber" | "id">) {
  return order.orderNumber?.trim() || order.id;
}

/** Short form for dense lists. */
export function shortOrderNumber(
  order: Pick<Order, "orderNumber" | "paystackReference" | "id">,
) {
  const value = orderNumber(order);
  return value.length > 14 ? value.slice(0, 14) : value;
}
