"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bank,
  Check,
  CheckCircle,
  EnvelopeSimple,
  Phone,
  SpinnerGap,
  Storefront,
  User,
  WarningCircle,
} from "@phosphor-icons/react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import {
  AuthFieldErrors,
  PasswordField,
  TextField,
  validateNigerianPhone,
} from "@/components/auth/auth-fields";
import {
  AUTH_SUCCESS_REDIRECT,
  fetchBanks,
  getVendor,
  type Bank as BankOption,
  registerVendor,
  requestVendorEmailCode,
  resolveBankAccount,
  setupVendorPayout,
  type Vendor,
  verifyVendorEmail,
} from "@/lib/auth-api";
import { cn } from "@/lib/cn";

type SignupStep = "register" | "verify" | "payout";
type FormMessage = { tone: "error" | "notice" | "success"; text: string };

const stepOrder: SignupStep[] = ["register", "verify", "payout"];

export type SignupStepName = SignupStep;

function Progress({ step }: { step: SignupStep }) {
  const current = stepOrder.indexOf(step);
  return (
    <ol className="mb-8 grid grid-cols-3 gap-2" aria-label="Vendor onboarding progress">
      {[
        ["register", "Profile"],
        ["verify", "Email"],
        ["payout", "Payout"],
      ].map(([key, label], index) => {
        const item = key as SignupStep;
        const complete = index < current;
        const active = index === current;
        return (
          <li key={item} className="min-w-0">
            <div
              className={cn(
                "h-1.5 rounded-full transition-colors",
                index <= current ? "bg-brand" : "bg-line",
              )}
            />
            <p
              className={cn(
                "mt-2 truncate text-[11px] font-semibold uppercase tracking-[0.12em]",
                active ? "text-brand" : complete ? "text-ink-muted" : "text-ink-muted/60",
              )}
            >
              {index + 1}. {label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function Notice({ message }: { message: FormMessage | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4 text-sm leading-6",
        message.tone === "error"
          ? "border-cinnamon-wood-400 bg-cinnamon-wood-50 text-cinnamon-wood-900 dark:border-cinnamon-wood-700 dark:bg-cinnamon-wood-950 dark:text-cinnamon-wood-100"
          : message.tone === "success"
            ? "border-shamrock-300 bg-shamrock-50 text-shamrock-950 dark:border-shamrock-800 dark:bg-shamrock-950 dark:text-shamrock-100"
            : "border-blue-spruce-300 bg-blue-spruce-50 text-blue-spruce-900 dark:border-blue-spruce-800 dark:bg-blue-spruce-900 dark:text-blue-spruce-100",
      )}
    >
      {message.tone === "error" ? (
        <WarningCircle size={20} weight="duotone" className="mt-0.5 shrink-0" aria-hidden="true" />
      ) : (
        <CheckCircle size={20} weight="duotone" className="mt-0.5 shrink-0" aria-hidden="true" />
      )}
      <p>{message.text}</p>
    </div>
  );
}

function RegisterStep({ onRegistered }: { onRegistered: (vendor: Vendor) => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [message, setMessage] = useState<FormMessage | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function focusFirstError(nextErrors: AuthFieldErrors) {
    const first = Object.keys(nextErrors)[0];
    if (!first) return;
    window.requestAnimationFrame(() => {
      formRef.current
        ?.querySelector<HTMLElement>(`[name="${first}"]`)
        ?.focus();
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const data = new FormData(event.currentTarget);
    const values = {
      firstName: String(data.get("firstName") ?? "").trim(),
      lastName: String(data.get("lastName") ?? "").trim(),
      displayName: String(data.get("displayName") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim(),
      password: String(data.get("password") ?? ""),
      confirmPassword: String(data.get("confirmPassword") ?? ""),
    };
    const nextErrors: AuthFieldErrors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneError = validateNigerianPhone(values.phone);

    if (!values.firstName) nextErrors.firstName = "Enter your first name.";
    if (!values.lastName) nextErrors.lastName = "Enter your last name.";
    if (!values.displayName) nextErrors.displayName = "Enter your business or store name.";
    if (!values.email) nextErrors.email = "Enter your business email address.";
    else if (!emailPattern.test(values.email)) nextErrors.email = "Enter a valid email address.";
    if (phoneError) nextErrors.phone = phoneError;
    if (!values.password) nextErrors.password = "Create a password.";
    else if (
      values.password.length < 8 ||
      !/[a-z]/.test(values.password) ||
      !/[A-Z]/.test(values.password) ||
      !/\d/.test(values.password)
    ) {
      nextErrors.password = "Use 8+ characters with uppercase, lowercase and a number.";
    }
    if (values.confirmPassword !== values.password) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      focusFirstError(nextErrors);
      return;
    }

    setSubmitting(true);
    const response = await registerVendor({
      firstName: values.firstName,
      lastName: values.lastName,
      displayName: values.displayName,
      email: values.email,
      phone: values.phone,
      password: values.password,
    });
    setSubmitting(false);

    if (!response.ok || !response.data?.id) {
      setMessage({
        tone: "error",
        text: response.ok
          ? "The API did not return a vendor profile. Try again."
          : response.error.message,
      });
      return;
    }

    onRegistered(response.data);
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate aria-busy={submitting} className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold tracking-[-0.03em] text-ink">Create your vendor profile</h2>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          We will email you a 6-digit code to verify this account.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="First name" name="firstName" autoComplete="given-name" icon={<User size={19} aria-hidden="true" />} error={errors.firstName} maxLength={80} />
        <TextField label="Last name" name="lastName" autoComplete="family-name" icon={<User size={19} aria-hidden="true" />} error={errors.lastName} maxLength={80} />
      </div>
      <TextField label="Business or store name" name="displayName" autoComplete="organization" icon={<Storefront size={19} aria-hidden="true" />} error={errors.displayName} maxLength={120} />
      <TextField label="Business email" name="email" type="email" inputMode="email" autoComplete="email" placeholder="name@business.com…" icon={<EnvelopeSimple size={19} aria-hidden="true" />} error={errors.email} maxLength={160} />
      <TextField label="WhatsApp number" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0801 234 5678…" icon={<Phone size={19} aria-hidden="true" />} error={errors.phone} maxLength={24} />
      <PasswordField label="Password" name="password" autoComplete="new-password" placeholder="Create a secure password…" helper="Use 8+ characters with uppercase, lowercase and a number." error={errors.password} />
      <PasswordField label="Confirm password" name="confirmPassword" autoComplete="new-password" placeholder="Repeat your password…" error={errors.confirmPassword} />
      <Notice message={message} />
      <button type="submit" disabled={submitting} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-spruce-800 px-5 py-3 text-sm font-semibold text-blue-spruce-50 transition-[transform,background-color] hover:bg-blue-spruce-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70">
        {submitting ? (
          <><SpinnerGap size={18} className="animate-spin" aria-hidden="true" />Creating profile…</>
        ) : (
          <>Continue to email verification<ArrowRight size={18} weight="bold" aria-hidden="true" /></>
        )}
      </button>
    </form>
  );
}

function VerifyStep({ email, vendorId, onVerified }: { email: string; vendorId?: string; onVerified: (vendor: Vendor) => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<FormMessage | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setMessage(null);
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit email code.");
      return;
    }
    setSubmitting(true);
    const response = await verifyVendorEmail({ email, code });
    setSubmitting(false);
    if (!response.ok || !response.data) {
      setMessage({ tone: "error", text: response.ok ? "The API did not return the verified profile." : response.error.message });
      return;
    }
    onVerified({ ...response.data, id: response.data.id ?? vendorId });
  }

  async function handleResend() {
    setResending(true);
    setMessage(null);
    const response = await requestVendorEmailCode(email);
    setResending(false);
    setMessage(
      response.ok
        ? { tone: "notice", text: response.message ?? "A new verification code was sent." }
        : { tone: "error", text: response.error.message },
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-busy={submitting} className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold tracking-[-0.03em] text-ink">Verify your email</h2>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          Enter the 6-digit code sent to <span className="font-semibold text-ink">{email}</span>. The code expires in 10 minutes.
        </p>
      </div>
      <TextField
        label="Email verification code"
        name="emailCode"
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="123456"
        icon={<Check size={19} aria-hidden="true" />}
        error={error}
        value={code}
        onChange={(event) => {
          setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
          setError(undefined);
        }}
        maxLength={6}
      />
      <Notice message={message} />
      <button type="submit" disabled={submitting} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-spruce-800 px-5 py-3 text-sm font-semibold text-blue-spruce-50 transition-[transform,background-color] hover:bg-blue-spruce-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70">
        {submitting ? (
          <><SpinnerGap size={18} className="animate-spin" aria-hidden="true" />Verifying email…</>
        ) : (
          <>Verify email<ArrowRight size={18} weight="bold" aria-hidden="true" /></>
        )}
      </button>
      <button type="button" onClick={handleResend} disabled={resending} className="w-full min-h-11 rounded-lg py-2 text-center text-sm font-semibold text-brand underline decoration-blue-spruce-300 underline-offset-4 hover:text-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60">
        {resending ? "Resending code…" : "Resend verification code"}
      </button>
    </form>
  );
}

function PayoutStep({ vendorId }: { vendorId: string }) {
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState<string>();
  const [resolvedInput, setResolvedInput] = useState<string>();
  const [verified, setVerified] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<FormMessage | null>(null);
  const [error, setError] = useState<string>();
  const [vendor, setVendor] = useState<Vendor | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const [banksResult, vendorResult] = await Promise.all([fetchBanks(), getVendor(vendorId)]);
      if (!active) return;
      if (banksResult.ok && banksResult.data) setBanks(banksResult.data);
      if (!banksResult.ok) {
        setMessage({ tone: "error", text: banksResult.error.message });
      }
      if (vendorResult.ok && vendorResult.data) {
        setVendor(vendorResult.data);
        setBankCode(vendorResult.data.bankCode ?? "");
        setAccountNumber(vendorResult.data.accountNumber ?? "");
      } else if (!vendorResult.ok) {
        setMessage({ tone: "error", text: vendorResult.error.message });
      }
      setLoading(false);
    }
    void load();
    return () => {
      active = false;
    };
  }, [vendorId]);

  async function handleResolve() {
    setError(undefined);
    setMessage(null);
    setVerified(false);
    setUnverified(false);
    setAcknowledged(false);
    if (!bankCode || !accountNumber) {
      setError("Choose a bank and enter the payout account number.");
      return;
    }
    setResolving(true);
    const response = await resolveBankAccount({ bankCode, accountNumber });
    setResolving(false);

    if (response.ok && response.data?.accountName) {
      setAccountName(response.data.accountName);
      setResolvedInput(`${bankCode}:${accountNumber}`);
      setVerified(true);
      setMessage({ tone: "success", text: "Account resolved. Confirm the name matches before saving." });
      return;
    }

    // 503 means the verifier itself is down. The API guide says to let the
    // vendor continue carefully rather than block or invent a wrong name.
    if (!response.ok && response.error.code === "HTTP_503") {
      setResolvedInput(`${bankCode}:${accountNumber}`);
      setUnverified(true);
      setMessage({
        tone: "notice",
        text: "Our bank verification service is unavailable, so the account name could not be confirmed. Double-check the bank and account number before saving.",
      });
      return;
    }

    setAccountName(undefined);
    setMessage({ tone: "error", text: response.ok ? "The bank did not return an account name." : response.error.message });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const matches = resolvedInput === `${bankCode}:${accountNumber}`;
    if (!matches || (!verified && !acknowledged)) {
      setError("Verify the account name before saving payout details.");
      return;
    }
    setSubmitting(true);
    const response = await setupVendorPayout(vendorId, { bankCode, accountNumber });
    setSubmitting(false);
    if (!response.ok) {
      setMessage({ tone: "error", text: response.error.message });
      return;
    }
    window.location.assign(AUTH_SUCCESS_REDIRECT);
  }

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center text-sm text-ink-muted" role="status">
        <SpinnerGap size={20} className="mr-2 animate-spin" aria-hidden="true" />
        Loading payout setup…
      </div>
    );
  }

  const selectedBank = banks.find((bank) => bank.code === bankCode);
  const currentInput = `${bankCode}:${accountNumber}`;
  const canSubmit =
    resolvedInput === currentInput && (verified || (unverified && acknowledged));

  return (
    <form onSubmit={handleSubmit} noValidate aria-busy={submitting} className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold tracking-[-0.03em] text-ink">Set up your payout account</h2>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          Vendor payouts are released to this account after delivery verification.
        </p>
        {vendor?.displayName ? <p className="mt-1 text-xs text-ink-muted">Profile: {vendor.displayName}</p> : null}
      </div>
      <div>
        <label htmlFor="payout-bank" className="text-sm font-semibold text-ink">Bank</label>
        <select
          id="payout-bank"
          name="bankCode"
          value={bankCode}
          onChange={(event) => {
            setBankCode(event.target.value);
            setVerified(false);
            setUnverified(false);
            setAcknowledged(false);
            setAccountName(undefined);
            setError(undefined);
          }}
          className="mt-2 h-12 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none transition-[border-color,box-shadow] focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-focus/25"
        >
          <option value="">Select your bank…</option>
          {banks.map((bank) => (
            <option key={bank.code} value={bank.code}>
              {bank.name} ({bank.code})
            </option>
          ))}
        </select>
      </div>
      <TextField
        label="Account number"
        name="accountNumber"
        inputMode="numeric"
        autoComplete="off"
        placeholder="0123456789"
        icon={<Bank size={19} aria-hidden="true" />}
        error={error}
        value={accountNumber}
        onChange={(event) => {
          setAccountNumber(event.target.value.replace(/\D/g, "").slice(0, 20));
          setVerified(false);
          setUnverified(false);
          setAcknowledged(false);
          setAccountName(undefined);
          setError(undefined);
        }}
        maxLength={20}
      />
      {accountName ? (
        <div className="rounded-2xl border border-shamrock-300 bg-shamrock-50 p-4 dark:border-shamrock-800 dark:bg-shamrock-950">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-shamrock-800 dark:text-shamrock-200">Account name</p>
          <p className="mt-1 text-lg font-semibold text-shamrock-950 dark:text-shamrock-100">{accountName}</p>
          <p className="mt-2 text-sm text-shamrock-900 dark:text-shamrock-200">Confirm this name matches the account holder before saving.</p>
        </div>
      ) : null}
      {unverified && resolvedInput === currentInput ? (
        <label
          htmlFor="payout-acknowledge"
          className="flex cursor-pointer items-start gap-3 rounded-xl border border-ash-grey-200 bg-ash-grey-50 p-4 text-sm leading-6 text-ink dark:border-blue-spruce-800 dark:bg-blue-spruce-900"
        >
          <input
            id="payout-acknowledge"
            name="acknowledge"
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 accent-blue-spruce-700"
          />
          <span>
            I have double-checked this bank and account number myself and want to save it unverified.
          </span>
        </label>
      ) : null}
      <Notice message={message} />
      <button
        type="button"
        onClick={handleResolve}
        disabled={resolving}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70"
      >
        {resolving ? (
          <><SpinnerGap size={18} className="animate-spin" aria-hidden="true" />Verifying account…</>
        ) : (
          <>Verify account name</>
        )}
      </button>
      <button
        type="submit"
        disabled={submitting || !canSubmit}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-spruce-800 px-5 py-3 text-sm font-semibold text-blue-spruce-50 transition-[transform,background-color] hover:bg-blue-spruce-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? (
          <><SpinnerGap size={18} className="animate-spin" aria-hidden="true" />Saving payout…</>
        ) : (
          <>Finish onboarding<ArrowRight size={18} weight="bold" aria-hidden="true" /></>
        )}
      </button>
      <p className="text-xs leading-5 text-ink-muted">
        {selectedBank ? `${selectedBank.name} selected. ` : ""}Payout setup is protected by your vendor session.
      </p>
    </form>
  );
}

type SignupFlowProps = {
  initialStep?: SignupStepName;
  initialVendorId?: string;
  initialEmail?: string;
};

export function SignupFlow({
  initialStep = "register",
  initialVendorId = "",
  initialEmail = "",
}: SignupFlowProps) {
  const [step, setStep] = useState<SignupStep>(initialStep);
  const [vendorId, setVendorId] = useState(initialVendorId);
  const [email, setEmail] = useState(initialEmail);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (initialStep !== "verify" || !initialVendorId) return;
    let active = true;
    void getVendor(initialVendorId).then((result) => {
      if (!active || !result.ok || !result.data) return;
      setEmail(result.data.email ?? initialEmail);
      if (result.data.emailVerified) setVerified(true);
    });
    return () => {
      active = false;
    };
  }, [initialStep, initialVendorId, initialEmail]);

  function updateUrl(nextStep: SignupStep, nextVendorId: string, nextEmail: string) {
    setStep(nextStep);
    const params = new URLSearchParams();
    params.set("step", nextStep);
    if (nextVendorId) params.set("vendorId", nextVendorId);
    if (nextEmail) params.set("email", nextEmail);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleRegistered(nextVendor: Vendor) {
    const nextId = nextVendor.id ?? "";
    setVendorId(nextId);
    setEmail(nextVendor.email ?? "");
    setVerified(Boolean(nextVendor.emailVerified));
    updateUrl("verify", nextId, nextVendor.email ?? "");
  }

  return (
    <div>
      <Progress step={step} />
      {step === "register" ? <RegisterStep onRegistered={handleRegistered} /> : null}
      {step === "verify" ? (
        verified ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-shamrock-300 bg-shamrock-50 p-5 dark:border-shamrock-800 dark:bg-shamrock-950">
              <div className="flex gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-shamrock-600 text-shamrock-50">
                  <CheckCircle size={23} weight="fill" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold tracking-[-0.02em] text-shamrock-950 dark:text-shamrock-100">Email verified</h2>
                  <p className="mt-1.5 text-sm leading-6 text-shamrock-900 dark:text-shamrock-200">
                    Log in to get your vendor session, then finish payout setup. Your workspace unlocks once onboarding is complete.
                  </p>
                </div>
              </div>
            </div>
            <Link
              href={`/login?email=${encodeURIComponent(email)}`}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-spruce-800 px-5 text-sm font-semibold text-blue-spruce-50 transition-colors hover:bg-blue-spruce-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              Continue to login
              <ArrowRight size={18} weight="bold" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={() => setVerified(false)}
              className="inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-lg py-2 text-sm font-semibold text-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <ArrowLeft size={15} aria-hidden="true" />
              Enter a different code
            </button>
          </div>
        ) : (
          <VerifyStep
            email={email}
            vendorId={vendorId}
            onVerified={(nextVendor) => {
              if (nextVendor.id) setVendorId(nextVendor.id);
              setEmail(nextVendor.email ?? email);
              setVerified(true);
            }}
          />
        )
      ) : null}
      {step === "payout" && vendorId ? <PayoutStep vendorId={vendorId} /> : null}
      {step === "payout" && !vendorId ? (
        <div className="space-y-5">
          <div className="rounded-2xl border border-cinnamon-wood-300 bg-cinnamon-wood-50 p-5 dark:border-cinnamon-wood-800 dark:bg-cinnamon-wood-950">
            <h2 className="text-lg font-semibold text-cinnamon-wood-950 dark:text-cinnamon-wood-100">Log in required</h2>
            <p className="mt-2 text-sm leading-6 text-cinnamon-wood-900 dark:text-cinnamon-wood-200">
              Your vendor session is required before payout details can be saved.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-spruce-800 px-5 text-sm font-semibold text-blue-spruce-50 transition-colors hover:bg-blue-spruce-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Log in
            <ArrowRight size={18} weight="bold" aria-hidden="true" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
