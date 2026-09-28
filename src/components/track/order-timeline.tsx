import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";
import type { TimelineEvent } from "@/lib/types";

/**
 * The tracker. The API returns an ordered event list, and the guide is explicit
 * that this list *is* the tracker UI, so we render it in the order given rather
 * than re-deriving steps from the status.
 *
 * The keys are stable (`created`, `payment_pending`, `funds_held`, `delivered`,
 * `released` / `refunded` / `disputed`), so they drive the visual state: the
 * active step is highlighted and everything after it is dimmed.
 */
const TONE: Record<string, string> = {
  created: "bg-ash-grey-400",
  payment_pending: "bg-blue-spruce-400",
  funds_held: "bg-muted-teal-500",
  delivered: "bg-cinnamon-wood-500",
  released: "bg-shamrock-500",
  refunded: "bg-blue-spruce-500",
  disputed: "bg-cinnamon-wood-600",
};

const TONE_LABELS: Record<string, string> = {
  created: "bg-ash-grey-300 text-ash-grey-900 dark:bg-ash-grey-700 dark:text-ash-grey-50",
  payment_pending: "bg-blue-spruce-100 text-blue-spruce-900 dark:bg-blue-spruce-900 dark:text-blue-spruce-100",
  funds_held: "bg-muted-teal-100 text-muted-teal-900 dark:bg-muted-teal-900 dark:text-muted-teal-50",
  delivered: "bg-cinnamon-wood-100 text-cinnamon-wood-900 dark:bg-cinnamon-wood-900 dark:text-cinnamon-wood-50",
  released: "bg-shamrock-100 text-shamrock-900 dark:bg-shamrock-900 dark:text-shamrock-50",
  refunded: "bg-blue-spruce-100 text-blue-spruce-900 dark:bg-blue-spruce-900 dark:text-blue-spruce-100",
  disputed: "bg-cinnamon-wood-200 text-cinnamon-wood-950 dark:bg-cinnamon-wood-900 dark:text-cinnamon-wood-50",
};

export function OrderTimeline({ events }: { events: TimelineEvent[] }) {
  if (!events.length) {
    return (
      <p className="px-5 py-6 text-sm text-ink-muted">
        Nothing has happened on this order yet. Events appear as soon as the
        vendor creates it.
      </p>
    );
  }

  return (
    <ol className="px-5 py-5">
      {events.map((event, index) => {
        const key = event.key ?? "step";
        const isLast = index === events.length - 1;
        return (
          <li key={`${key}-${index}`} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                aria-hidden="true"
                className={cn(
                  "mt-1.5 h-3 w-3 shrink-0 rounded-full",
                  TONE[key] ?? "bg-brand",
                )}
              />
              {!isLast ? <span aria-hidden="true" className="w-px flex-1 bg-line" /> : null}
            </div>
            <div className={cn("min-w-0 pb-7", isLast && "pb-0")}>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  TONE_LABELS[key] ?? "bg-surface text-ink-muted",
                )}
              >
                {key.replace(/_/g, " ")}
              </span>
              <p className="mt-1.5 text-sm font-semibold text-ink">
                {event.label ?? "Update"}
              </p>
              {event.at ? (
                <p className="mt-0.5 text-xs text-ink-muted">
                  {new Date(event.at).toLocaleString("en-NG", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "Africa/Lagos",
                  })}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Compact status pill used on the public tracker. */
export function TrackStatusBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink">
      <CheckCircle size={14} weight="duotone" aria-hidden="true" />
      {label}
    </span>
  );
}
