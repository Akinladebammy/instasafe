// The API reports money in kobo and expects naira on create. Always convert at
// the boundary and format with Intl so the display never depends on a hand
// rolled string.

const nairaFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  notation: "compact",
  maximumFractionDigits: 1,
});

/** 4500000 kobo -> "₦45,000.00" */
export function koboToNaira(kobo: number | null | undefined) {
  return nairaFormatter.format((kobo ?? 0) / 100);
}

/** 4500000 kobo -> "₦45K" for tight stat tiles. */
export function koboToCompactNaira(kobo: number | null | undefined) {
  const value = (kobo ?? 0) / 100;
  if (value === 0) return nairaFormatter.format(0);
  return compactFormatter.format(value);
}

/** "45000.50" (naira, from a form) -> 4500050 kobo */
export function nairaToKobo(naira: number) {
  return Math.round(naira * 100);
}

export function formatPhone(phone: string | null | undefined) {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  // Canonical API form is 234XXXXXXXXXX; display it the way Nigeria reads it.
  if (digits.length === 13 && digits.startsWith("234")) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return phone;
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Lagos",
});

const dateFormatter = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium",
  timeZone: "Africa/Lagos",
});

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateTimeFormatter.format(date);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateFormatter.format(date);
}

/** Whole hours until a deadline, negative once it has passed. */
export function hoursUntil(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return (date.getTime() - Date.now()) / 3_600_000;
}

export function formatCountdown(value: string | null | undefined) {
  const hours = hoursUntil(value);
  if (hours === null) return "—";
  if (hours < 0) return "Window closed";
  const whole = Math.floor(hours);
  if (whole < 1) return "Under 1 hour left";
  if (whole < 24) return `${whole}h left`;
  const days = Math.floor(whole / 24);
  return `${days}d ${whole % 24}h left`;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}
