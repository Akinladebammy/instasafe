import Link from "next/link";

import { cn } from "@/lib/cn";

/**
 * Horizontal filter chips that navigate rather than submit, so every screen
 * stays a plain link — shareable, keyboard-navigable and no client state.
 */
export function FilterChips({
  basePath,
  param,
  options,
  active,
  extraParams = {},
}: {
  basePath: string;
  param: string;
  options: { key: string; label: string; count?: number }[];
  active: string;
  extraParams?: Record<string, string>;
}) {
  const hrefFor = (key: string) => {
    const query = new URLSearchParams(extraParams);
    if (key !== "all") query.set(param, key);
    const value = query.toString();
    return value ? `${basePath}?${value}` : basePath;
  };

  return (
    <nav aria-label="Filters">
      <ul className="flex flex-wrap items-center gap-1.5">
        {options.map((option) => {
          const isActive = option.key === active;
          return (
            <li key={option.key}>
              <Link
                href={hrefFor(option.key)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                  isActive
                    ? "border-blue-spruce-800 bg-blue-spruce-800 text-blue-spruce-50 dark:border-blue-spruce-400 dark:bg-blue-spruce-400 dark:text-blue-spruce-950"
                    : "border-line bg-canvas text-ink-muted hover:bg-surface-raised hover:text-ink",
                )}
              >
                {option.label}
                {option.count !== undefined ? (
                  <span
                    className={cn(
                      "tabular-nums",
                      isActive ? "opacity-80" : "text-ink-muted",
                    )}
                  >
                    {option.count}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Previous/next for endpoints that return a bare array with no total count. */
export function PageStepper({
  basePath,
  page,
  hasNext,
  param = "page",
  extraParams = {},
}: {
  basePath: string;
  page: number;
  hasNext: boolean;
  param?: string;
  extraParams?: Record<string, string>;
}) {
  const hrefFor = (next: number) => {
    const query = new URLSearchParams(extraParams);
    if (next > 1) query.set(param, String(next));
    const value = query.toString();
    return value ? `${basePath}?${value}` : basePath;
  };

  if (page === 1 && !hasNext) return null;

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-3 border-t border-line px-5 py-3"
    >
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          className="inline-flex min-h-11 items-center rounded-xl border border-line bg-canvas px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-ink-muted">Page {page}</span>
      {hasNext ? (
        <Link
          href={hrefFor(page + 1)}
          className="inline-flex min-h-11 items-center rounded-xl border border-line bg-canvas px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Next
        </Link>
      ) : null}
    </nav>
  );
}
