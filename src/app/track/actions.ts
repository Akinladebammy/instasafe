"use server";

import { revalidatePath } from "next/cache";

import {
  confirmSatisfaction,
  raiseDispute,
  TrackApiError,
  verifyOrderOtp,
} from "@/lib/track-api";

export type TrackResult = { ok: true; message: string } | { ok: false; message: string };

function failure(error: unknown): TrackResult {
  if (error instanceof TrackApiError) return { ok: false, message: error.message };
  return { ok: false, message: "Something went wrong. Try again in a moment." };
}

/**
 * One entry point for every buyer action, dispatched on a hidden `intent` field.
 *
 * A single action keeps the `useActionState` result in one stable place. An
 * earlier version had three separate actions, each inside a conditionally
 * rendered form — so the moment an action succeeded and the order's status
 * flipped, its form unmounted and the confirmation message was destroyed
 * exactly when the buyer needed to read it.
 */
export async function trackAction(
  _prev: TrackResult | null,
  formData: FormData,
): Promise<TrackResult> {
  const intent = String(formData.get("intent") ?? "");
  const orderId = String(formData.get("orderId") ?? "").trim();
  const reference = String(formData.get("reference") ?? "").trim();

  if (!orderId) return { ok: false, message: "Missing order reference." };

  const done = (message: string): TrackResult => {
    revalidatePath("/track");
    if (reference) revalidatePath(`/track?ref=${encodeURIComponent(reference)}`);
    return { ok: true, message };
  };

  if (intent === "satisfy") {
    // Digital goods: the buyer releases their own money. The guide notes these
    // guest endpoints take no OTP — the reference is the credential.
    try {
      await confirmSatisfaction(orderId);
    } catch (error) {
      return failure(error);
    }
    return done("Thanks — your funds have been released to the vendor.");
  }

  if (intent === "dispute") {
    const reason = String(formData.get("reason") ?? "").trim();
    if (reason.length < 10) {
      return {
        ok: false,
        message: "Tell the vendor what went wrong in at least 10 characters.",
      };
    }
    if (reason.length > 500) {
      return { ok: false, message: "Keep the reason under 500 characters." };
    }
    try {
      await raiseDispute(orderId, reason);
    } catch (error) {
      return failure(error);
    }
    return done("Dispute raised. Funds are frozen while the vendor responds.");
  }

  if (intent === "otp") {
    const otp = String(formData.get("otp") ?? "").trim();
    if (!/^\d{4,8}$/.test(otp)) {
      return { ok: false, message: "Enter the numeric code from your payment message." };
    }
    try {
      await verifyOrderOtp(orderId, otp);
    } catch (error) {
      return failure(error);
    }
    return done("Code accepted. Your funds have been released.");
  }

  return { ok: false, message: "Unknown action." };
}
