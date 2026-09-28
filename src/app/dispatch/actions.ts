"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  confirmDelivery,
  DispatchApiError,
  getDispatchToken,
  requestDispatchCode,
  verifyDispatchCode,
} from "@/lib/dispatch-api";
import { DISPATCH_COOKIE } from "@/lib/instasafe-server";
import { validateNigerianPhone } from "@/lib/phone";

export type DispatchResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

function failure(error: unknown): DispatchResult {
  if (error instanceof DispatchApiError) return { ok: false, message: error.message };
  return { ok: false, message: "Something went wrong. Try again in a moment." };
}

/** Step 1: ask the backend to text a login code. Any phone number works. */
export async function requestDispatchCodeAction(
  _prev: DispatchResult | null,
  formData: FormData,
): Promise<DispatchResult> {
  const phone = String(formData.get("phone") ?? "").trim();
  const phoneError = validateNigerianPhone(phone);
  if (phoneError) return { ok: false, message: phoneError };

  try {
    await requestDispatchCode(phone);
  } catch (error) {
    return failure(error);
  }

  return {
    ok: true,
    message: `We sent a login code to ${phone} on WhatsApp. It expires in 10 minutes.`,
  };
}

/**
 * Step 2: exchange the code for a rider JWT and open the session. Kept separate
 * from step 1 so the phone survives a failed code entry.
 */
export async function verifyDispatchCodeAction(
  _prev: DispatchResult | null,
  formData: FormData,
): Promise<DispatchResult> {
  const phone = String(formData.get("phone") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();

  const phoneError = validateNigerianPhone(phone);
  if (phoneError) return { ok: false, message: phoneError };
  if (!/^\d{4,8}$/.test(code)) {
    return { ok: false, message: "Enter the numeric code from WhatsApp." };
  }

  let token: string | null = null;
  let expiresInHours: number | null | undefined;
  try {
    const auth = await verifyDispatchCode(phone, code);
    token = auth?.token ?? null;
    expiresInHours = auth?.expiresInHours;
  } catch (error) {
    return failure(error);
  }

  if (!token) {
    return { ok: false, message: "That code was accepted but no session came back. Try again." };
  }

  const store = await cookies();
  store.set({
    name: DISPATCH_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(60, Math.floor((expiresInHours ?? 24) * 60 * 60)),
  });

  revalidatePath("/dispatch", "layout");
  // redirect() signals by throwing, so it must not sit inside a try/catch.
  redirect("/dispatch");
}

/** Confirm a delivery with the buyer's one-time code. */
export async function confirmDeliveryAction(
  _prev: DispatchResult | null,
  formData: FormData,
): Promise<DispatchResult> {
  const orderId = String(formData.get("orderId") ?? "").trim();
  const otp = String(formData.get("otp") ?? "").trim();

  if (!orderId) return { ok: false, message: "Missing delivery reference." };
  if (!/^\d{4,8}$/.test(otp)) {
    return { ok: false, message: "Enter the code the buyer read out to you." };
  }

  const token = await getDispatchToken();
  if (!token) redirect("/dispatch/login");

  try {
    await confirmDelivery(token, orderId, otp);
  } catch (error) {
    return failure(error);
  }

  revalidatePath("/dispatch", "layout");
  return {
    ok: true,
    message: "Delivery confirmed. The 24-hour inspection window has started.",
  };
}
