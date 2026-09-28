"use client";

import {
  Eye,
  EyeSlash,
  LockKey,
} from "@phosphor-icons/react";
import {
  type ChangeEvent,
  type ReactNode,
  useState,
} from "react";
import { cn } from "@/lib/cn";
import { validateNigerianPhone } from "@/lib/phone";

export { validateNigerianPhone };

export type AuthFieldName =
  | "loginId"
  | "phone"
  | "code"
  | "emailCode"
  | "firstName"
  | "lastName"
  | "displayName"
  | "email"
  | "accountNumber"
  | "bankCode"
  | "password"
  | "confirmPassword";

export type AuthFieldErrors = Partial<Record<AuthFieldName, string>>;

// Codes, phone numbers and account numbers should never be spell-corrected.
const NO_SPELLCHECK_FIELDS = new Set<AuthFieldName>([
  "loginId",
  "phone",
  "code",
  "emailCode",
  "email",
  "bankCode",
  "accountNumber",
]);

const NUMERIC_FIELDS = new Set<AuthFieldName>([
  "phone",
  "code",
  "emailCode",
  "bankCode",
  "accountNumber",
]);

type TextFieldProps = {
  label: string;
  name: AuthFieldName;
  type?: "text" | "email" | "tel";
  autoComplete: string;
  placeholder?: string;
  icon: ReactNode;
  error?: string;
  helper?: string;
  inputMode?: "email" | "tel" | "text" | "numeric";
  maxLength?: number;
  value?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function TextField({
  label,
  name,
  type = "text",
  autoComplete,
  placeholder,
  icon,
  error,
  helper,
  inputMode,
  maxLength,
  value,
  onChange,
}: TextFieldProps) {
  const inputId = `auth-${name}`;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;
  const describedBy = [helper ? helperId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <label htmlFor={inputId} className="text-sm font-semibold text-ink">
        {label}
      </label>
      <div className="relative mt-2">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
        >
          {icon}
        </span>
        <input
          id={inputId}
          name={name}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          inputMode={inputMode}
          maxLength={maxLength}
          value={value}
          onChange={onChange}
          spellCheck={NO_SPELLCHECK_FIELDS.has(name) ? false : undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy || undefined}
          className={cn(
            "h-12 w-full rounded-xl border bg-canvas pl-11 pr-4 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/80 focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-focus/25",
            NUMERIC_FIELDS.has(name) && "tabular-nums",
            error ? "border-cinnamon-wood-500" : "border-line",
          )}
        />
      </div>
      {helper && !error ? (
        <p id={helperId} className="mt-2 text-xs leading-5 text-ink-muted">
          {helper}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          className="mt-2 text-sm text-cinnamon-wood-700 dark:text-cinnamon-wood-300"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

type PasswordFieldProps = {
  label: string;
  name: "password" | "confirmPassword";
  autoComplete: string;
  placeholder: string;
  error?: string;
  helper?: string;
};

export function PasswordField({
  label,
  name,
  autoComplete,
  placeholder,
  error,
  helper,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const inputId = `auth-${name}`;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;
  const describedBy = [helper ? helperId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <label htmlFor={inputId} className="text-sm font-semibold text-ink">
        {label}
      </label>
      <div className="relative mt-2">
        <LockKey
          size={19}
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
        />
        <input
          id={inputId}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy || undefined}
          className={cn(
            "h-12 w-full rounded-xl border bg-canvas pl-11 pr-12 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/80 focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-focus/25",
            error ? "border-cinnamon-wood-500" : "border-line",
          )}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus"
        >
          {visible ? (
            <EyeSlash size={19} aria-hidden="true" />
          ) : (
            <Eye size={19} aria-hidden="true" />
          )}
        </button>
      </div>
      {helper && !error ? (
        <p id={helperId} className="mt-2 text-xs leading-5 text-ink-muted">
          {helper}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          className="mt-2 text-sm text-cinnamon-wood-700 dark:text-cinnamon-wood-300"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

