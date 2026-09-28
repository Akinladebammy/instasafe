import { NextResponse } from "next/server";

import {
  clearSessionCookie,
  DISPATCH_COOKIE,
  VENDOR_COOKIE,
  ADMIN_COOKIE,
} from "@/lib/instasafe-server";

export const dynamic = "force-dynamic";

/**
 * Clears every local session cookie — vendor, rider and admin all sign out from
 * the same control, and leaving a stray admin cookie behind would keep the
 * console reachable on a shared machine. This only touches the local session;
 * the backend JWT stays valid until it expires, so signing out does not revoke
 * the token server-side.
 */
export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  for (const name of [VENDOR_COOKIE, DISPATCH_COOKIE, ADMIN_COOKIE]) {
    clearSessionCookie(response, name);
  }
  return response;
}
