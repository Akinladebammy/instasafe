import { NextResponse } from "next/server";
import {
  getApiError,
  isConfigurationError,
  isNetworkError,
  isSuccessful,
  postToInstaSafe,
  setVendorSessionCookie,
} from "@/lib/instasafe-server";

export const dynamic = "force-dynamic";

type VerifyCodePayload = {
  phone?: string | null;
  code?: string | null;
};

type VendorAuthData = {
  token?: string | null;
  expiresInHours?: number | null;
  vendor?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as VerifyCodePayload;
    const result = await postToInstaSafe<VendorAuthData>(
      "/api/auth/vendor/verify-code",
      { phone: body.phone ?? null, code: body.code ?? null },
    );

    if (!isSuccessful(result)) {
      return NextResponse.json(
        { success: false, message: getApiError(result), errors: result.payload.errors ?? null },
        { status: result.status >= 400 ? result.status : 400 },
      );
    }

    const token = result.payload.data?.token;
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "The API verified the code but did not return a session token.",
        },
        { status: 502 },
      );
    }

    const safePayload = {
      ...result.payload,
      data: result.payload.data
        ? { ...result.payload.data, token: undefined }
        : result.payload.data,
    };
    const response = NextResponse.json(safePayload, { status: result.status });
    setVendorSessionCookie(
      response,
      token,
      result.payload.data?.expiresInHours,
    );

    return response;
  } catch (error) {
    if (isConfigurationError(error)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The InstaSafe API is not configured on this server yet. Add INSTASAFE_API_URL to enable vendor authentication.",
        },
        { status: 503 },
      );
    }

    if (isNetworkError(error)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The InstaSafe API could not be reached. Check the backend deployment and try again.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { success: false, message: "Unexpected authentication service error." },
      { status: 500 },
    );
  }
}
