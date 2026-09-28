import { NextResponse } from "next/server";
import {
  getApiError,
  isConfigurationError,
  isNetworkError,
  isSuccessful,
  postToInstaSafe,
} from "@/lib/instasafe-server";

export const dynamic = "force-dynamic";

type RequestEmailCodePayload = { email?: string | null };

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as RequestEmailCodePayload;
    const result = await postToInstaSafe<boolean>(
      "/api/auth/vendor/request-email-code",
      { email: body.email ?? null },
    );

    if (!isSuccessful(result)) {
      return NextResponse.json(
        { success: false, message: getApiError(result), errors: result.payload.errors ?? null },
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
      { success: false, message: "Unexpected email verification service error." },
      { status: 500 },
    );
  }
}
