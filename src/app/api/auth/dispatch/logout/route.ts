import { NextResponse } from "next/server";
import { clearSessionCookie, DISPATCH_COOKIE } from "@/lib/instasafe-server";

export const dynamic = "force-dynamic";

/** Ends the rider session locally. The backend JWT stays valid until expiry. */
export async function POST(request: Request) {
  const response = NextResponse.redirect(
    new URL("/dispatch/login", request.url),
    303,
  );
  clearSessionCookie(response, DISPATCH_COOKIE);
  return response;
}
