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

/** Short form for dense lists. */
export function shortOrderNumber(
  order: Pick<Order, "orderNumber" | "paystackReference" | "id">,
) {
  const value = orderNumber(order);
  return value.length > 14 ? value.slice(0, 14) : value;
}
