export type AuthMode = "login" | "signup";

export type ApiErrors = string[] | Record<string, string[]>;

export type ApiEnvelope<T> = {
  success?: boolean;
  message?: string | null;
  data?: T;
  errors?: ApiErrors | null;
};

type AuthFailure = {
  code: string;
  message: string;
};

export type AuthResult<T> =
  | { ok: true; data: T | null; message: string | null }
  | { ok: false; error: AuthFailure };

export type Vendor = {
  id?: string;
  phone?: string | null;
  displayName?: string | null;
  accountNumber?: string | null;
  bankCode?: string | null;
  paystackRecipientCode?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  isActive?: boolean;
  emailVerified?: boolean;
  onboardingCompleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type VendorAuth = {
  vendor?: Vendor | null;
  expiresInHours?: number | null;
  /**
   * `"vendor"` normally, `"admin"` for the super-admin. An admin login returns
   * `vendor: null`, so callers must branch on this rather than on the vendor
   * flags, or an admin gets treated as an un-onboarded vendor.
   */
  role?: string | null;
};

export type Bank = {
  name: string;
  slug: string;
  code: string;
};

export type ResolvedBankAccount = {
  accountNumber?: string;
  bankCode?: string;
  accountName?: string;
};

export type RegisterVendorInput = {
  phone: string;
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export type PasswordLoginInput = { loginId: string; password: string };
export type RequestVendorCodeInput = { phone: string };
export type VerifyVendorCodeInput = { phone: string; code: string };
export type VerifyVendorEmailInput = { email: string; code: string };
export type PayoutSetupInput = { accountNumber: string; bankCode: string };

export const AUTH_SUCCESS_REDIRECT =
  process.env.NEXT_PUBLIC_AUTH_SUCCESS_REDIRECT || "/dashboard";

// The browser calls same-origin Next.js proxy routes. The server-side proxy
// forwards to the Azure-hosted InstaSafe API, avoiding browser CORS limits.
const AUTH_PROXY_ENDPOINTS = {
  login: "/api/auth/vendor/login",
  requestCode: "/api/auth/vendor/request-code",
  verifyCode: "/api/auth/vendor/verify-code",
  requestEmailCode: "/api/auth/vendor/request-email-code",
  verifyEmail: "/api/auth/vendor/verify-email",
  register: "/api/vendors",
  banks: "/api/payments/banks",
  resolveBank: "/api/payments/banks/resolve",
} as const;

async function apiRequest<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT",
  body?: unknown,
): Promise<AuthResult<T>> {
  try {
    const response = await fetch(endpoint, {
      method,
      credentials: "include",
      cache: "no-store",
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        Accept: "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const text = await response.text();
    let payload: ApiEnvelope<T> = {};
    try {
      payload = text ? (JSON.parse(text) as ApiEnvelope<T>) : {};
    } catch {
      payload = { success: false, message: text || null };
    }

    if (!response.ok || payload.success === false) {
      const errors = payload.errors;
      const firstError = Array.isArray(errors)
        ? errors[0]
        : errors
          ? Object.values(errors).flat()[0]
          : undefined;

      return {
        ok: false,
        error: {
          code: `HTTP_${response.status}`,
          message:
            firstError ??
            payload.message ??
            "The InstaSafe service could not complete that request.",
        },
      };
    }

    return {
      ok: true,
      data: payload.data ?? null,
      message: payload.message ?? null,
    };
  } catch {
    return {
      ok: false,
      error: {
        code: "AUTH_API_NETWORK_ERROR",
        message:
          "The authentication service could not be reached. Check your connection and try again.",
      },
    };
  }
}

export function passwordLogin(input: PasswordLoginInput) {
  return apiRequest<VendorAuth>(AUTH_PROXY_ENDPOINTS.login, "POST", input);
}

export function requestVendorCode(input: RequestVendorCodeInput) {
  return apiRequest<boolean>(AUTH_PROXY_ENDPOINTS.requestCode, "POST", input);
}

export function verifyVendorCode(input: VerifyVendorCodeInput) {
  return apiRequest<VendorAuth>(AUTH_PROXY_ENDPOINTS.verifyCode, "POST", input);
}

export function requestVendorEmailCode(email: string) {
  return apiRequest<boolean>(AUTH_PROXY_ENDPOINTS.requestEmailCode, "POST", { email });
}

export function verifyVendorEmail(input: VerifyVendorEmailInput) {
  return apiRequest<Vendor>(AUTH_PROXY_ENDPOINTS.verifyEmail, "POST", input);
}

export function registerVendor(input: RegisterVendorInput) {
  return apiRequest<Vendor>(AUTH_PROXY_ENDPOINTS.register, "POST", input);
}

export function fetchBanks() {
  return apiRequest<Bank[]>(AUTH_PROXY_ENDPOINTS.banks, "GET");
}

export function resolveBankAccount(input: PayoutSetupInput) {
  const query = new URLSearchParams({
    accountNumber: input.accountNumber,
    bankCode: input.bankCode,
  });
  return apiRequest<ResolvedBankAccount>(
    `${AUTH_PROXY_ENDPOINTS.resolveBank}?${query.toString()}`,
    "GET",
  );
}

export function getVendor(vendorId: string) {
  return apiRequest<Vendor>(`/api/vendors/${encodeURIComponent(vendorId)}`, "GET");
}

export function setupVendorPayout(vendorId: string, input: PayoutSetupInput) {
  return apiRequest<Vendor>(
    `/api/vendors/${encodeURIComponent(vendorId)}/payout`,
    "PUT",
    input,
  );
}
