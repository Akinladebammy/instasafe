import type { Bank } from "./types";

/**
 * `GET /api/payments/banks` currently returns every bank five times over
 * (1440 rows for 282 real banks) because of a join duplicate upstream.
 * Collapse by code so dropdowns stay unique and React keys stay stable.
 */
export function dedupeBanks(banks: Bank[] | null | undefined) {
  const unique = new Map<string, Bank>();
  for (const bank of banks ?? []) {
    const code = bank?.code?.trim();
    if (!code || unique.has(code)) continue;
    unique.set(code, {
      name: bank.name?.trim() || code,
      slug: bank.slug?.trim() || code,
      code,
    });
  }
  return [...unique.values()].sort((a, b) => a.name.localeCompare(b.name));
}
