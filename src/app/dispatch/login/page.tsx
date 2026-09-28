import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SignInScreen } from "@/components/auth/sign-in-screen";
import { getDispatchToken } from "@/lib/dispatch-api";

export const metadata: Metadata = {
  title: "Rider sign in — InstaSafe",
  description: "Sign in to see the deliveries assigned to you.",
  robots: { index: false, follow: false },
};

/**
 * Deep link for riders arriving from a dispatch text. It renders the same
 * screen as `/login` with the rider tab already selected, so there is one
 * sign-in implementation rather than two that can drift apart.
 */
export default async function DispatchLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string | string[] }>;
}) {
  const token = await getDispatchToken();
  if (token) redirect("/dispatch");

  const params = await searchParams;
  const phone = Array.isArray(params.phone) ? params.phone[0] : params.phone;

  return <SignInScreen initialRole="rider" initialPhone={phone ?? ""} />;
}
