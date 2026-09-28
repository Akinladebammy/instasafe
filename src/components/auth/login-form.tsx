"use client";

import {
  ArrowLeft,
  ArrowRight,
  EnvelopeSimple,
  LockKey,
  Phone,
  SpinnerGap,
  WarningCircle,
} from "@phosphor-icons/react";
import { type FormEvent, useRef, useState } from "react";
import {
  AuthFieldErrors,
  PasswordField,
  TextField,
  validateNigerianPhone,
} from "@/components/auth/auth-fields";
import {
  AUTH_SUCCESS_REDIRECT,
  passwordLogin,
  requestVendorCode,
  verifyVendorCode,
} from "@/lib/auth-api";
import { cn } from "@/lib/cn";

type FormMessage = { tone: "error" | "notice"; text: string };
type LoginMethod = "password" | "otp";

/**
 * Where to send someone after a successful sign-in.
 *
 * The API returns `role` alongside the token, and an admin login comes back with
 * `vendor: null`. Without branching on the role first, an admin would be treated
 * as a vendor with no profile and land on the onboarding gates.
 */
function nextRouteForAuth(auth: {
  role?: string | null;
  vendor?: {
    id?: string;
    email?: string | null;
    emailVerified?: boolean;
    onboardingCompleted?: boolean;
  } | null;
}) {
  if (auth.role && auth.role !== "vendor") return `/${auth.role}`;

  const vendor = auth.vendor;
  if (!vendor?.id) return AUTH_SUCCESS_REDIRECT;
  if (vendor.emailVerified === false) {
    return `/signup?step=verify&vendorId=${encodeURIComponent(vendor.id)}&email=${encodeURIComponent(vendor.email ?? "")}`;
  }
  if (vendor.onboardingCompleted === false) {
    return `/signup?step=payout&vendorId=${encodeURIComponent(vendor.id)}`;
  }
  return AUTH_SUCCESS_REDIRECT;
}

type LoginFormProps = {
  initialLoginId?: string;
  initialPhone?: string;
  initialMethod?: LoginMethod;
};

export function LoginForm({
  initialLoginId = "",
  initialPhone = "",
  initialMethod = "password",
}: LoginFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [method, setMethod] = useState<LoginMethod>(initialMethod);
  const [otpStep, setOtpStep] = useState<"phone" | "code">("phone");
  const [loginId, setLoginId] = useState(initialLoginId);
  const [phone, setPhone] = useState(initialPhone);
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [formMessage, setFormMessage] = useState<FormMessage | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // No `beforeunload` guard here on purpose. A sign-in form holds nothing worth
  // protecting, and the browser's generic "Leave site?" dialog fires the moment
  // anyone types — including when they just want to switch to the rider tab.

  // Keep the chosen method in the URL so recovery links stay shareable.
  function selectMethod(next: LoginMethod) {
    setMethod(next);
    setFormMessage(null);
    setErrors({});
    const params = new URLSearchParams(window.location.search);
    if (next === "otp") params.set("method", "otp");
    else params.delete("method");
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      query ? `${window.location.pathname}?${query}` : window.location.pathname,
    );
  }

  function focusField(name: keyof AuthFieldErrors) {
    window.requestAnimationFrame(() => {
      formRef.current
        ?.querySelector<HTMLElement>(`[name="${name}"]`)
        ?.focus();
    });
  }

  async function handlePasswordLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage(null);
    const data = new FormData(event.currentTarget);
    const identifier = String(data.get("loginId") ?? "").trim();
    const password = String(data.get("password") ?? "");

    if (!identifier) {
      setErrors({ loginId: "Enter your email address or phone number." });
      focusField("loginId");
      return;
    }
    if (!password) {
      setErrors({ password: "Enter your password." });
      focusField("password");
      return;
    }

    setSubmitting(true);
    const response = await passwordLogin({ loginId: identifier, password });
    setSubmitting(false);

    if (!response.ok) {
      setFormMessage({ tone: "error", text: response.error.message });
      return;
    }

    window.location.assign(nextRouteForAuth(response.data ?? {}));
  }

  async function handleOtpLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage(null);

    if (otpStep === "phone") {
      const phoneError = validateNigerianPhone(phone);
      if (phoneError) {
        setErrors({ phone: phoneError });
        focusField("phone");
        return;
      }

      setSubmitting(true);
      const response = await requestVendorCode({ phone: phone.trim() });
      setSubmitting(false);
      if (!response.ok) {
        setFormMessage({ tone: "error", text: response.error.message });
        return;
      }
      setErrors({});
      setOtpStep("code");
      setFormMessage({
        tone: "notice",
        text: response.message ?? `A recovery code was sent to ${phone.trim()} through WhatsApp.`,
      });
      return;
    }

    if (!/^\d{4,8}$/.test(code)) {
      setErrors({ code: "Enter the numeric code from WhatsApp." });
      focusField("code");
      return;
    }

    setSubmitting(true);
    const response = await verifyVendorCode({ phone: phone.trim(), code: code.trim() });
    setSubmitting(false);
    if (!response.ok) {
      setFormMessage({ tone: "error", text: response.error.message });
      return;
    }

    window.location.assign(nextRouteForAuth(response.data ?? {}));
  }

  return (
    <div>
      <div
        className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-surface p-1"
        role="group"
        aria-label="Choose how to sign in"
      >
        <button
          type="button"
          aria-pressed={method === "password"}
          onClick={() => selectMethod("password")}
          className={cn(
            "min-h-11 rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
            method === "password"
              ? "bg-canvas text-ink shadow-sm"
              : "text-ink-muted hover:text-ink",
          )}
        >
          Password
        </button>
        <button
          type="button"
          aria-pressed={method === "otp"}
          onClick={() => selectMethod("otp")}
          className={cn(
            "min-h-11 rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
            method === "otp"
              ? "bg-canvas text-ink shadow-sm"
              : "text-ink-muted hover:text-ink",
          )}
        >
          WhatsApp recovery
        </button>
      </div>

      {method === "password" ? (
        <form
          ref={formRef}
          onSubmit={handlePasswordLogin}
          noValidate
          aria-busy={submitting}
          className="space-y-5"
        >
          <TextField
            label="Email or phone number"
            name="loginId"
            autoComplete="username"
            placeholder="Email address or phone number…"
            icon={<EnvelopeSimple size={19} aria-hidden="true" />}
            error={errors.loginId}
            value={loginId}
            onChange={(event) => {
              setLoginId(event.target.value);
              setErrors({});
            }}
            maxLength={120}
          />
          <PasswordField
            label="Password"
            name="password"
            autoComplete="current-password"
            placeholder="Enter your password…"
            error={errors.password}
          />

          {formMessage ? (
            <div role="status" aria-live="polite" className="flex items-start gap-3 rounded-xl border border-cinnamon-wood-400 bg-cinnamon-wood-50 p-4 text-sm leading-6 text-cinnamon-wood-900 dark:border-cinnamon-wood-700 dark:bg-cinnamon-wood-950 dark:text-cinnamon-wood-100">
              <WarningCircle size={20} weight="duotone" className="mt-0.5 shrink-0" aria-hidden="true" />
              <p>{formMessage.text}</p>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-spruce-800 px-5 py-3 text-sm font-semibold text-blue-spruce-50 transition-[transform,background-color] hover:bg-blue-spruce-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? (
              <>
                <SpinnerGap size={18} className="animate-spin" aria-hidden="true" />
                Logging in…
              </>
            ) : (
              <>
                Log in
                <ArrowRight size={18} weight="bold" aria-hidden="true" />
              </>
            )}
          </button>
        </form>
      ) : (
        <form
          ref={formRef}
          onSubmit={handleOtpLogin}
          noValidate
          aria-busy={submitting}
          className="space-y-5"
        >
          {otpStep === "phone" ? (
            <TextField
              label="WhatsApp number"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="0801 234 5678…"
              icon={<Phone size={19} aria-hidden="true" />}
              error={errors.phone}
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value);
                setErrors({});
              }}
              maxLength={24}
            />
          ) : (
            <>
              <div className="flex items-start justify-between gap-4 rounded-2xl border border-blue-spruce-200 bg-blue-spruce-50 p-4 dark:border-blue-spruce-800 dark:bg-blue-spruce-900">
                <div>
                  <p className="text-sm font-semibold text-ink">Recovery code sent</p>
                  <p className="mt-1 text-sm leading-6 text-ink-muted">Enter the code sent to {phone}.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOtpStep("phone");
                    setCode("");
                    setFormMessage(null);
                  }}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-brand hover:bg-blue-spruce-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus dark:hover:bg-blue-spruce-800"
                >
                  <ArrowLeft size={14} weight="bold" aria-hidden="true" />
                  Edit
                </button>
              </div>
              <TextField
                label="Verification code"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Enter 4–8 digit code…"
                icon={<LockKey size={19} aria-hidden="true" />}
                error={errors.code}
                value={code}
                onChange={(event) => {
                  setCode(event.target.value.replace(/\D/g, ""));
                  setErrors({});
                }}
                maxLength={8}
              />
            </>
          )}

          {formMessage ? (
            <div
              role="status"
              aria-live="polite"
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4 text-sm leading-6",
                formMessage.tone === "notice"
                  ? "border-blue-spruce-300 bg-blue-spruce-50 text-blue-spruce-900 dark:border-blue-spruce-800 dark:bg-blue-spruce-900 dark:text-blue-spruce-100"
                  : "border-cinnamon-wood-400 bg-cinnamon-wood-50 text-cinnamon-wood-900 dark:border-cinnamon-wood-700 dark:bg-cinnamon-wood-950 dark:text-cinnamon-wood-100",
              )}
            >
              <WarningCircle size={20} weight="duotone" className="mt-0.5 shrink-0" aria-hidden="true" />
              <p>{formMessage.text}</p>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-spruce-800 px-5 py-3 text-sm font-semibold text-blue-spruce-50 transition-[transform,background-color] hover:bg-blue-spruce-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? (
              <>
                <SpinnerGap size={18} className="animate-spin" aria-hidden="true" />
                {otpStep === "phone" ? "Sending code…" : "Verifying code…"}
              </>
            ) : (
              <>
                {otpStep === "phone" ? "Send recovery code" : "Verify code"}
                <ArrowRight size={18} weight="bold" aria-hidden="true" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
