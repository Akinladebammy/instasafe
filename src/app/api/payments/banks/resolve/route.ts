import { NextResponse } from "next/server";
import {
  getApiError,
  getToInstaSafe,
  isConfigurationError,
  isNetworkError,
  isSuccessful,
} from "@/lib/instasafe-server";

export const dynamic = "force-dynamic";

type ResolvedAccount = {
  accountNumber?: string;
  bankCode?: string;
  accountName?: string;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const accountNumber = url.searchParams.get("accountNumber")?.trim() ?? "";
  const bankCode = url.searchParams.get("bankCode")?.trim() ?? "";

  if (!accountNumber || !bankCode) {
    return NextResponse.json(
      { success: false, message: "Choose a bank and enter an account number." },
      { status: 400 },
    );
  }

  try {
    const result = await getToInstaSafe<ResolvedAccount>(
      `/api/payments/banks/resolve?accountNumber=${encodeURIComponent(accountNumber)}&bankCode=${encodeURIComponent(bankCode)}`,
    );
    if (!isSuccessful(result)) {
      return NextResponse.json(
        { success: false, message: getApiError(result) },
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
        { success: false, message: "The bank verification service could not be reached." },
        { status: 502 },
      );
    }
    return NextResponse.json(
      { success: false, message: "Unexpected bank verification error." },
      { status: 500 },
    );
  }
}
