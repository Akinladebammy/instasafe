import { statusLabel, statusTone, type OrderStatusKey } from "@/lib/order-status";
import { cn } from "@/lib/cn";

const TONE_CLASSES = {
  neutral: "border-ash-grey-300 bg-ash-grey-100 text-ash-grey-800 dark:border-blue-spruce-700 dark:bg-blue-spruce-900 dark:text-blue-spruce-100",
  info: "border-blue-spruce-300 bg-blue-spruce-50 text-blue-spruce-900 dark:border-blue-spruce-700 dark:bg-blue-spruce-900 dark:text-blue-spruce-100",
  good: "border-shamrock-300 bg-shamrock-50 text-shamrock-900 dark:border-shamrock-700 dark:bg-shamrock-950 dark:text-shamrock-100",
  warn: "border-cinnamon-wood-300 bg-cinnamon-wood-50 text-cinnamon-wood-900 dark:border-cinnamon-wood-700 dark:bg-cinnamon-wood-950 dark:text-cinnamon-wood-100",
  bad: "border-cinnamon-wood-500 bg-cinnamon-wood-100 text-cinnamon-wood-950 dark:border-cinnamon-wood-500 dark:bg-cinnamon-wood-900 dark:text-cinnamon-wood-50",
  pending: "border-muted-teal-300 bg-muted-teal-50 text-muted-teal-900 dark:border-muted-teal-600 dark:bg-muted-teal-900 dark:text-muted-teal-50",
} as const;

export function StatusPill({
  status,
  className,
}: {
  status: OrderStatusKey;
  className?: string;
}) {
  const tone = statusTone(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        TONE_CLASSES[tone],
        className,
      )}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabel(status)}
    </span>
  );
}

export function Tag({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-semibold text-ink-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}
