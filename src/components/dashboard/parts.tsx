import Link from "next/link";
import { cn } from "@/lib/cn";
import { koboToCompactNaira, koboToNaira } from "@/lib/money";

/**
 * Renders an amount from kobo. Kept as a component (rather than a bare string)
 * so the `.money` font stack that carries a correct naira sign is applied
 * everywhere currency appears.
 */
export function Money({
  kobo,
  compact = false,
  className,
}: {
  kobo: number | null | undefined;
  compact?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("money", className)}>
      {compact ? koboToCompactNaira(kobo) : koboToNaira(kobo)}
    </span>
  );
}

export function StatTile({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad" | "info";
}) {
  const toneClass = {
    neutral: "text-ink",
    good: "text-shamrock-700 dark:text-shamrock-300",
    warn: "text-cinnamon-wood-800 dark:text-cinnamon-wood-200",
    bad: "text-cinnamon-wood-800 dark:text-cinnamon-wood-200",
    info: "text-blue-spruce-800 dark:text-blue-spruce-200",
  }[tone];

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-3 text-2xl font-semibold tabular-nums tracking-[-0.02em]",
          toneClass,
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-2 text-sm leading-5 text-ink-muted">{hint}</p> : null}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("rounded-2xl border border-line bg-surface", className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="text-base font-semibold tracking-[-0.02em] text-ink">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-ink-muted">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function DataRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-line px-5 py-3 last:border-b-0 sm:grid-cols-[minmax(0,180px)_1fr] sm:gap-4">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="min-w-0 text-sm font-medium break-words text-ink">
        {children}
      </dd>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="px-5 py-14 text-center">
      <p className="text-base font-semibold text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-muted">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function ErrorNote({
  title = "Something went wrong",
  message,
  action,
}: {
  title?: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-cinnamon-wood-400 bg-cinnamon-wood-50 p-5 dark:border-cinnamon-wood-700 dark:bg-cinnamon-wood-950">
      <p className="text-sm font-semibold text-cinnamon-wood-950 dark:text-cinnamon-wood-100">
        {title}
      </p>
      <p className="mt-1.5 text-sm leading-6 text-cinnamon-wood-900 dark:text-cinnamon-wood-200">
        {message}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function PrimaryLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-spruce-800 px-4 py-2.5 text-sm font-semibold text-blue-spruce-50 transition-colors hover:bg-blue-spruce-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        className,
      )}
    >
      {children}
    </Link>
  );
}
