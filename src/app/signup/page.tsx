import type { Metadata } from "next";
import Link from "next/link";
import {
  SignupFlow,
  type SignupStepName,
} from "@/components/auth/signup-flow";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Create vendor account — InstaSafe",
  description: "Create an InstaSafe vendor account for protected social-commerce payments.",
  robots: {
    index: false,
    follow: false,
  },
};

type SignUpSearchParams = {
  step?: string | string[];
  vendorId?: string | string[];
  email?: string | string[];
};

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<SignUpSearchParams>;
}) {
  const params = await searchParams;
  const rawStep = firstValue(params.step);
  const step: SignupStepName =
    rawStep === "verify" || rawStep === "payout" ? rawStep : "register";

  return (
    <AuthShell
      title="Protect your next sale."
      description="Three short steps: create your profile, verify your email, then connect the bank account that receives your payouts."
      footer={
        <div className="space-y-2.5">
          <p>
            Already have an account?{" "}
            <Link
              href="/login"
              className="inline-block rounded py-1 font-semibold text-brand underline decoration-blue-spruce-300 underline-offset-4 hover:text-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              Log in
            </Link>
          </p>
          <p className="text-sm text-ink-muted">
            Delivering for a vendor instead?{" "}
            <Link
              href="/login?as=rider"
              className="inline-block rounded py-1 font-semibold text-brand underline decoration-blue-spruce-300 underline-offset-4 hover:text-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              Sign in as a rider
            </Link>
          </p>
        </div>
      }
    >
      <SignupFlow
        initialStep={step}
        initialVendorId={firstValue(params.vendorId) ?? ""}
        initialEmail={firstValue(params.email) ?? ""}
      />
    </AuthShell>
  );
}
