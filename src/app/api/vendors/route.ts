import { NextResponse } from "next/server";
import {
  getApiError,
  isConfigurationError,
  isNetworkError,
  isSuccessful,
  postToInstaSafe,
} from "@/lib/instasafe-server";

export const dynamic = "force-dynamic";

type RegisterVendorPayload = {
  phone?: string | null;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  password?: string | null;
};

type VendorData = {
  id?: string;
  phone?: string | null;
  displayName?: string | null;
  email?: string | null;
  emailVerified?: boolean;
  onboardingCompleted?: boolean;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as RegisterVendorPayload;
    const result = await postToInstaSafe<VendorData>("/api/vendors", {
      phone: body.phone ?? null,
      displayName: body.displayName ?? null,
      firstName: body.firstName ?? null,
      lastName: body.lastName ?? null,
      email: body.email ?? null,
      password: body.password ?? null,
    });

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
        {
          success: false,
          message:
            "The InstaSafe API is not configured on this server yet. Add INSTASAFE_API_URL to enable vendor registration.",
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
      { success: false, message: "Unexpected vendor registration service error." },
      { status: 500 },
    );
  }
}
