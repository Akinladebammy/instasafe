"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  adminForceRelease,
  adminRefundOrder,
  adminResolveDispute,
  AdminApiError,
  getAdminToken,
  setDispatcherActive,
  setVendorActive,
  setVendorPhone,
} from "@/lib/admin-api";
import { validateNigerianPhone } from "@/lib/phone";

export type AdminResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

function failure(error: unknown): AdminResult {
  if (error instanceof AdminApiError) return { ok: false, message: error.message };
  return { ok: false, message: "Something went wrong. Try again in a moment." };
}

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

async function withAdmin<T>(fn: (token: string) => Promise<T>): Promise<T> {
  const token = await getAdminToken();
  if (!token) redirect("/login");
  return fn(token);
}

export async function adminToggleVendorAction(
  _prev: AdminResult | null,
  formData: FormData,
): Promise<AdminResult> {
  const id = field(formData, "vendorId");
  const active = field(formData, "active") === "true";
  if (!id) return { ok: false, message: "Missing vendor reference." };

  try {
    await withAdmin((token) => setVendorActive(token, id, active));
  } catch (error) {
    return failure(error);
  }

  revalidatePath("/admin/vendors");
  revalidatePath("/admin", "layout");
  return {
    ok: true,
    message: active ? "Vendor reactivated." : "Vendor deactivated.",
  };
}

export async function adminVendorPhoneAction(
  _prev: AdminResult | null,
  formData: FormData,
): Promise<AdminResult> {
  const id = field(formData, "vendorId");
  const phone = field(formData, "phone");
  if (!id) return { ok: false, message: "Missing vendor reference." };

  const error = validateNigerianPhone(phone);
  if (error) return { ok: false, message: error };

  try {
    await withAdmin((token) => setVendorPhone(token, id, phone));
  } catch (err) {
    return failure(err);
  }

  revalidatePath("/admin/vendors");
  return { ok: true, message: "Vendor number updated. They must sign in again." };
}

export async function adminToggleDispatcherAction(
  _prev: AdminResult | null,
  formData: FormData,
): Promise<AdminResult> {
  const id = field(formData, "dispatcherId");
  const active = field(formData, "active") === "true";
  if (!id) return { ok: false, message: "Missing rider reference." };

  try {
    await withAdmin((token) => setDispatcherActive(token, id, active));
  } catch (error) {
    return failure(error);
  }

  revalidatePath("/admin/dispatchers");
  return {
    ok: true,
    message: active ? "Rider reactivated." : "Rider deactivated.",
  };
}

export async function adminRefundAction(
  _prev: AdminResult | null,
  formData: FormData,
): Promise<AdminResult> {
  const id = field(formData, "orderId");
  if (!id) return { ok: false, message: "Missing order reference." };

  try {
    await withAdmin((token) => adminRefundOrder(token, id));
  } catch (error) {
    return failure(error);
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/admin/orders", "layout");
  return { ok: true, message: "Refund issued." };
}

export async function adminResolveDisputeAction(
  _prev: AdminResult | null,
  formData: FormData,
): Promise<AdminResult> {
  const id = field(formData, "orderId");
  const resolution = field(formData, "resolution");
  if (!id) return { ok: false, message: "Missing order reference." };
  if (resolution !== "release" && resolution !== "refund") {
    return { ok: false, message: "Choose release or refund." };
  }

  try {
    await withAdmin((token) => adminResolveDispute(token, id, resolution));
  } catch (error) {
    return failure(error);
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/admin/orders", "layout");
  revalidatePath("/admin/disputes");
  return { ok: true, message: resolution === "release" ? "Funds released." : "Buyer refunded." };
}

export async function adminForceReleaseAction(
  _prev: AdminResult | null,
  formData: FormData,
): Promise<AdminResult> {
  const id = field(formData, "orderId");
  const note = field(formData, "note");
  if (!id) return { ok: false, message: "Missing order reference." };
  if (note.length < 5) {
    return {
      ok: false,
      message: "Record why you are releasing early (at least 5 characters).",
    };
  }

  try {
    await withAdmin((token) => adminForceRelease(token, id, note));
  } catch (error) {
    return failure(error);
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/admin/orders", "layout");
  return { ok: true, message: "Funds force-released to the vendor." };
}
