import { NextResponse } from "next/server";
import { dedupeBanks } from "@/lib/banks";
import {
  getApiError,
  getToInstaSafe,
  isConfigurationError,
  isNetworkError,
  isSuccessful,
} from "@/lib/instasafe-server";

export const dynamic = "force-dynamic";

type Bank = { name: string; slug: string; code: string };

export async function GET() {
  try {
    const result = await getToInstaSafe<Bank[]>("/api/payments/banks");
    if (!isSuccessful(result)) {
      return NextResponse.json(
        { success: false, message: getApiError(result) },
        { status: result.status >= 400 ? result.status : 400 },
      );
    }

    // The API currently returns each bank several times over (a join duplicate
    // upstream). Collapse by bank code so the dropdown stays unique and light.
    const data = dedupeBanks(result.payload.data);

    return NextResponse.json(
      { ...result.payload, data, message: result.payload.message ?? null },
      {
        status: result.status,
        headers: { "Cache-Control": "public, max-age=3600" },
      },
    );
  } catch (error) {
    if (isConfigurationError(error)) {
      return NextResponse.json(
        { success: false, message: "The InstaSafe API is not configured on this server yet." },
        { status: 503 },
      );
    }
    if (isNetworkError(error)) {
      return NextResponse.json(
        { success: false, message: "The bank list could not be loaded." },
        { status: 502 },
      );
    }
    return NextResponse.json(
      { success: false, message: "Unexpected bank service error." },
      { status: 500 },
    );
  }
}
