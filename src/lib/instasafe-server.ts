import { NextResponse } from "next/server";

export type ApiErrors = string[] | Record<string, string[]>;

export type ApiEnvelope<T> = {
  success?: boolean;
  message?: string | null;
  title?: string | null;
  data?: T;
  errors?: ApiErrors | null;
};

export class InstaSafeConfigurationError extends Error {}
export class InstaSafeNetworkError extends Error {}

const instasafeApiUrl = process.env.INSTASAFE_API_URL?.replace(/\/$/, "");

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
};

export async function requestToInstaSafe<T>(
  path: string,
  options: RequestOptions = {},
): Promise<{ status: number; payload: ApiEnvelope<T> }> {
  if (!instasafeApiUrl) {
    throw new InstaSafeConfigurationError(
      "INSTASAFE_API_URL is not configured on the Next.js server.",
    );
  }

  const method = options.method ?? "GET";
  const headers: Record<string, string> = { Accept: "application/json" };

  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  let response: Response;

  try {
    response = await fetch(`${instasafeApiUrl}${path}`, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store",
    });
  } catch {
    throw new InstaSafeNetworkError("The InstaSafe API could not be reached.");
  }

  const rawBody = await response.text();
  let payload: ApiEnvelope<T>;

  try {
    payload = normalizeEnvelope<T>(rawBody ? JSON.parse(rawBody) : {});
  } catch {
    payload = {
      success: response.ok,
      message: rawBody || null,
    };
  }

  return { status: response.status, payload };
}

/**
 * The API mixes serialisers. Most endpoints answer with camelCase
 * (`success`/`message`/`data`/`errors`) or ASP.NET problem+json, but the guest
 * order endpoints (`verify-otp`, `dispute`) answer with PascalCase
 * (`Success`/`Message`/`Data`/`Errors`).
 *
 * Without this, a PascalCase `{"Success": false}` would parse to `success:
 * undefined` and `isSuccessful` would read it as a success on a 200 response.
 * Fold the PascalCase keys into the canonical shape at the parse boundary so no
 * caller has to think about it.
 */
function normalizeEnvelope<T>(raw: unknown): ApiEnvelope<T> {
  if (!raw || typeof raw !== "object") return (raw ?? {}) as ApiEnvelope<T>;

  const body = raw as Record<string, unknown>;
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      if (body[key] !== undefined && body[key] !== null) return body[key];
    }
    return undefined;
  };

  const success = pick("success", "Success");
  const message = pick("message", "Message");
  const data = pick("data", "Data");
  const errors = pick("errors", "Errors");
  const title = pick("title", "Title");

  // problem+json has neither success nor Success; leave it to the status code.
  if (success === undefined && data === undefined && errors === undefined) {
    return body as ApiEnvelope<T>;
  }

  return {
    success: success as boolean | undefined,
    message: (message as string | undefined) ?? null,
    title: (title as string | undefined) ?? null,
    data: data as T | undefined,
    errors: (errors as ApiErrors | undefined) ?? null,
  };
}

export function postToInstaSafe<T>(path: string, body: unknown) {
  return requestToInstaSafe<T>(path, { method: "POST", body });
}

export function getToInstaSafe<T>(path: string, token?: string | null) {
  return requestToInstaSafe<T>(path, { method: "GET", token });
}

export function putToInstaSafe<T>(
  path: string,
  body: unknown,
  token?: string | null,
) {
  return requestToInstaSafe<T>(path, { method: "PUT", body, token });
}

export const VENDOR_COOKIE = "instasafe_vendor_token";
export const DISPATCH_COOKIE = "instasafe_dispatch_token";
/** The super-admin signs in via the vendor login endpoint but is a different principal. */
export const ADMIN_COOKIE = "instasafe_admin_token";

export function getVendorToken(request: Request) {
  return readCookie(request, VENDOR_COOKIE);
}

export function readCookie(request: Request, name: string) {
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim().split("="))
    .find(([key]) => key === name)?.[1];
}

/**
 * Session cookies are httpOnly so the JWT never reaches client JavaScript. The
 * vendor and rider tokens are kept in separate cookies because they are
 * different principals and must not be interchangeable.
 */
export function setSessionCookie(
  response: NextResponse,
  name: string,
  token: string,
  expiresInHours?: number | null,
) {
  const maxAge = Math.max(60, Math.floor((expiresInHours ?? 24) * 60 * 60));
  response.cookies.set({
    name,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export function clearSessionCookie(response: NextResponse, name: string) {
  response.cookies.set({
    name,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function setVendorSessionCookie(
  response: NextResponse,
  token: string,
  expiresInHours?: number | null,
) {
  setSessionCookie(response, VENDOR_COOKIE, token, expiresInHours);
}

export function isSuccessful<T>(result: {
  status: number;
  payload: ApiEnvelope<T>;
}) {
  return result.status >= 200 && result.status < 300 && result.payload.success !== false;
}

export function getApiError<T>(result: {
  status: number;
  payload: ApiEnvelope<T>;
}) {
  const errors = result.payload.errors;
  const firstError = Array.isArray(errors)
    ? errors[0]
    : errors
      ? Object.values(errors).flat()[0]
      : undefined;

  return (
    firstError ??
    result.payload.message ??
    result.payload.title ??
    (result.status === 400
      ? "Check the information you entered and try again."
      : "The InstaSafe API could not complete that request.")
  );
}

export function isConfigurationError(error: unknown) {
  return error instanceof InstaSafeConfigurationError;
}

export function isNetworkError(error: unknown) {
  return error instanceof InstaSafeNetworkError;
}
