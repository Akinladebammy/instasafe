import type { Metadata } from "next";

import { SignInScreen } from "@/components/auth/sign-in-screen";

export const metadata: Metadata = {
  title: "Log in — InstaSafe",
  description: "Sign in to InstaSafe as a vendor or a delivery rider.",
  robots: {
    index: false,
    follow: false,
  },
};

type LoginSearchParams = {
  email?: string | string[];
  phone?: string | string[];
  as?: string | string[];
  method?: string | string[];
};

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<LoginSearchParams>;
}) {
  const params = await searchParams;
  const email = firstValue(params.email);
  const phone = firstValue(params.phone);
  // /login?as=rider deep-links the rider tab, which is what a dispatch text or
  // the footer link can point at.
  const initialRole = firstValue(params.as) === "rider" ? "rider" : "vendor";

  return (
    <SignInScreen
      initialRole={initialRole}
      initialLoginId={email ?? phone ?? ""}
      initialPhone={phone ?? ""}
    />
  );
}
