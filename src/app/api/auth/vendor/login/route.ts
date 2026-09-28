import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  getApiError,
  isConfigurationError,
  isNetworkError,
  isSuccessful,
  postToInstaSafe,
  setSessionCookie,
  setVendorSessionCookie,
} from "@/lib/instasafe-server";

export const dynamic = "force-dynamic";

type LoginPayload = { loginId?: string | null; password?: string | null };
type VendorAuthData = {
  token?: string | null;
  expiresInHours?: number | null;
  vendor?: unknown;
  /** "vendor" for a store, "admin" for the super-admin. */
  role?: string | null;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as LoginPayload;
    const result = await postToInstaSafe<VendorAuthData>(
      "/api/auth/vendor/login",
      { loginId: body.loginId ?? null, password: body.password ?? null },
    );

    if (!isSuccessful(result)) {
      return NextResponse.json(
        {
          success: false,
          message:
            result.status === 401
              ? "Incorrect email, phone number or password."
              : getApiError(result),
          errors: result.payload.errors ?? null,
        },
        { status: result.status >= 400 ? result.status : 400 },
      );
    }

    const token = result.payload.data?.token;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "The API did not return a vendor session token." },
        { status: 502 },
      );
    }

    const response = NextResponse.json(
      {
        ...result.payload,
        data: result.payload.data
          ? { ...result.payload.data, token: undefined }
          : result.payload.data,
      },
      { status: result.status },
    );
    // The super-admin signs in through this same endpoint. Keep its token in a
    // separate cookie so an admin session can never be mistaken for a vendor one —
    // `GET /api/vendors` answers 403 for an admin token.
    const role = result.payload.data?.role;
    if (role && role !== "vendor") {
      setSessionCookie(response, ADMIN_COOKIE, token, result.payload.data?.expiresInHours);
    } else {
      setVendorSessionCookie(response, token, result.payload.data?.expiresInHours);
    }
    return response;
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
      { success: false, message: "Unexpected vendor login service error." },
      { status: 500 },
    );
  }
}
