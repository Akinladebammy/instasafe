import { NextResponse } from "next/server";
import {
  getApiError,
  getVendorToken,
  isConfigurationError,
  isNetworkError,
  isSuccessful,
  putToInstaSafe,
} from "@/lib/instasafe-server";

export const dynamic = "force-dynamic";

type PayoutPayload = { accountNumber?: string | null; bankCode?: string | null };
type VendorData = {
  id?: string;
  accountNumber?: string | null;
  bankCode?: string | null;
  onboardingCompleted?: boolean;
};

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const token = getVendorToken(request);
  if (!token) {
    return NextResponse.json(
      { success: false, message: "Log in again before saving payout details." },
      { status: 401 },
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as PayoutPayload;
    const { id } = await context.params;
    const result = await putToInstaSafe<VendorData>(
      `/api/vendors/${encodeURIComponent(id)}/payout`,
      { accountNumber: body.accountNumber ?? null, bankCode: body.bankCode ?? null },
      token,
    );

    if (!isSuccessful(result)) {
      return NextResponse.json(
        {
          success: false,
          message:
            result.status === 403
              ? "You can only update your own payout details."
              : getApiError(result),
          errors: result.payload.errors ?? null,
        },
        { status: result.status >= 400 ? result.status : 400 },
      );
    }

    return NextResponse.json(result.payload, { status: result.status });
  } catch (error) {
    if (isConfigurationError(error)) {
      return NextResponse.json(
        { success: false, message: "The InstaSafe API is not configured on this server yet." },
        { status: 503 },
      );
    }
    if (isNetworkError(error)) {
      return NextResponse.json(
        { success: false, message: "The InstaSafe API could not be reached." },
        { status: 502 },
      );
    }
    return NextResponse.json(
      { success: false, message: "Unexpected payout setup error." },
      { status: 500 },
    );
  }
}
