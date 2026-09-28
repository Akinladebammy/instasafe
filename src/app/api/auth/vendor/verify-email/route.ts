import { NextResponse } from "next/server";
import {
  getApiError,
  isConfigurationError,
  isNetworkError,
  isSuccessful,
  postToInstaSafe,
} from "@/lib/instasafe-server";

export const dynamic = "force-dynamic";

type VerifyEmailPayload = { email?: string | null; code?: string | null };
type VendorData = {
  id?: string;
  email?: string | null;
  emailVerified?: boolean;
  onboardingCompleted?: boolean;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as VerifyEmailPayload;
    const result = await postToInstaSafe<VendorData>(
      "/api/auth/vendor/verify-email",
      { email: body.email ?? null, code: body.code ?? null },
    );

    if (!isSuccessful(result)) {
      return NextResponse.json(
        { success: false, message: getApiError(result), errors: result.payload.errors ?? null },
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
      { success: false, message: "Unexpected email verification service error." },
      { status: 500 },
    );
  }
}
