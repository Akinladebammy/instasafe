import type { Bank } from "./types";

/**
 * Collapse by code so dropdowns stay unique and React keys stay stable.
 *
 * This was a workaround: the endpoint used to return every bank five times over
 * (1440 rows for 282 real banks) from a join duplicate upstream. It now returns
 * the complete list once — 98 rows, 98 unique codes, verified — so this is a
 * no-op on today's data. It is kept deliberately: it costs one pass over ~100
 * objects, and it means a regression upstream silently produces a working
 * dropdown instead of five duplicate options.
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
