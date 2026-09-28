"use client";

import { ArrowLeft, ArrowRight, CheckCircle, Phone, SpinnerGap, WarningCircle } from "@phosphor-icons/react";
import { useActionState, useState } from "react";

import {
  requestDispatchCodeAction,
  verifyDispatchCodeAction,
  type DispatchResult,
} from "@/app/dispatch/actions";
import { SubmitButton } from "@/components/dashboard/submit-button";
import { validateNigerianPhone } from "@/lib/phone";
import { cn } from "@/lib/cn";

const inputClass =
  "h-12 w-full rounded-xl border border-line bg-canvas pl-11 pr-4 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/80 focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-focus/25";

/**
 * Rider sign-in. Drivers have no accounts: a phone number is enough, the backend
 * creates the rider row on first use and texts a code to WhatsApp.
 */
export function DispatchLoginForm({ initialPhone = "" }: { initialPhone?: string }) {
  const [phone, setPhone] = useState(initialPhone);
  const [code, setCode] = useState("");
  const [phoneError, setPhoneError] = useState<string>();
  // Set when the rider steps back to change their number, so a fresh successful
  // send can move them forward again.
  const [steppedBack, setSteppedBack] = useState(false);

  const [requestState, requestAction, requestPending] = useActionState<
    DispatchResult | null,
    FormData
  >(requestDispatchCodeAction, null);

  const [verifyState, verifyAction] = useActionState<
    DispatchResult | null,
    FormData
  >(verifyDispatchCodeAction, null);

  // Derived rather than set during render: a successful send unlocks the code
  // step until the rider explicitly steps back to their number.
  const sentOk = Boolean(requestState?.ok);
  const onCodeStep = (sentOk && !steppedBack) || (Boolean(initialPhone) && !requestState);

  return (
    <div className="space-y-6">
      {!onCodeStep ? (
        <form action={requestAction} className="space-y-5" noValidate>
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-ink">
              Enter your rider number
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-muted">
              We will text a one-time code to WhatsApp. No password, no account
              to remember.
            </p>
          </div>

          <div>
            <label htmlFor="phone" className="text-sm font-semibold text-ink">
              WhatsApp number
            </label>
            <div className="relative mt-2">
              <Phone
                size={19}
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
              />
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                spellCheck={false}
                maxLength={24}
                required
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value);
                  setPhoneError(undefined);
                }}
                placeholder="0805 555 6666…"
                className={cn(inputClass, "font-mono", phoneError && "border-cinnamon-wood-500")}
                aria-invalid={Boolean(phoneError)}
                aria-describedby={phoneError ? "phone-error" : "phone-hint"}
              />
            </div>
            {phoneError ? (
              <p id="phone-error" className="mt-2 text-sm text-cinnamon-wood-700 dark:text-cinnamon-wood-300">
                {phoneError}
              </p>
            ) : (
              <p id="phone-hint" className="mt-2 text-xs leading-5 text-ink-muted">
                The number your vendor booked you with.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={requestPending}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-spruce-800 px-5 py-3 text-sm font-semibold text-blue-spruce-50 transition-[transform,background-color] hover:bg-blue-spruce-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:translate-y-px disabled:opacity-70"
            onClick={() => {
              const error = validateNigerianPhone(phone);
              setPhoneError(error ?? undefined);
              if (!error) setSteppedBack(false);
            }}
          >
            {requestPending ? (
              <>
                <SpinnerGap size={18} className="animate-spin" aria-hidden="true" />
                Sending code…
              </>
            ) : (
              <>
                Send login code
                <ArrowRight size={18} weight="bold" aria-hidden="true" />
              </>
            )}
          </button>

          {requestState ? (
            <p
              role="status"
              aria-live="polite"
              className={cn(
                "flex items-start gap-2 text-sm leading-6",
                requestState.ok
                  ? "text-shamrock-800 dark:text-shamrock-200"
                  : "text-cinnamon-wood-800 dark:text-cinnamon-wood-200",
              )}
            >
              {requestState.ok ? (
                <CheckCircle size={18} weight="duotone" className="mt-0.5 shrink-0" aria-hidden="true" />
              ) : (
                <WarningCircle size={18} weight="duotone" className="mt-0.5 shrink-0" aria-hidden="true" />
              )}
              <span>{requestState.message}</span>
            </p>
          ) : null}
        </form>
      ) : (
        <form action={verifyAction} className="space-y-5" noValidate>
          <div className="rounded-2xl border border-blue-spruce-200 bg-blue-spruce-50 p-4 dark:border-blue-spruce-800 dark:bg-blue-spruce-900">
            <p className="text-sm font-semibold text-ink">Code sent</p>
            <p className="mt-1 text-sm leading-6 text-ink-muted">
              Enter the code WhatsApp sent to {phone}. It expires in 10 minutes.
            </p>
            <button
              type="button"
              onClick={() => setSteppedBack(true)}
              className="mt-2 inline-flex min-h-9 items-center gap-1 rounded-lg px-1 text-xs font-semibold text-brand hover:text-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <ArrowLeft size={14} weight="bold" aria-hidden="true" />
              Use a different number
            </button>
          </div>

          <input type="hidden" name="phone" value={phone} />

          <div>
            <label htmlFor="code" className="text-sm font-semibold text-ink">
              Login code
            </label>
            <input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              spellCheck={false}
              maxLength={8}
              required
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className={cn(inputClass, "mt-2 pl-4 font-mono tracking-[0.3em]")}
            />
          </div>

          <SubmitButton pendingLabel="Signing in…" className="w-full">
            Verify code
          </SubmitButton>

          {verifyState ? (
            <p
              role="status"
              aria-live="polite"
              className="flex items-start gap-2 text-sm leading-6 text-cinnamon-wood-800 dark:text-cinnamon-wood-200"
            >
              <WarningCircle size={18} weight="duotone" className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{verifyState.message}</span>
            </p>
          ) : null}
        </form>
      )}
    </div>
  );
}
