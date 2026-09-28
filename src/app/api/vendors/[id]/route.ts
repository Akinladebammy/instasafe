import { NextResponse } from "next/server";
import {
  getApiError,
  getToInstaSafe,
  getVendorToken,
  isConfigurationError,
  isNetworkError,
  isSuccessful,
} from "@/lib/instasafe-server";

export const dynamic = "force-dynamic";

type VendorData = {
  id?: string;
  phone?: string | null;
  displayName?: string | null;
  email?: string | null;
  emailVerified?: boolean;
  onboardingCompleted?: boolean;
};

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const token = getVendorToken(request);
  if (!token) {
    return NextResponse.json(
      { success: false, message: "Log in again before continuing vendor setup." },
      { status: 401 },
    );
  }

  try {
    const { id } = await context.params;
    const result = await getToInstaSafe<VendorData>(`/api/vendors/${encodeURIComponent(id)}`, token);
    if (!isSuccessful(result)) {
      return NextResponse.json(
        {
          success: false,
          message:
            result.status === 403
              ? "You can only access your own vendor profile."
              : getApiError(result),
        },
        { status: result.status >= 400 ? result.status : 400 },
      );
    }
    return NextResponse.json(result.payload);
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
      { success: false, message: "Unexpected vendor profile error." },
      { status: 500 },
    );
  }
}
