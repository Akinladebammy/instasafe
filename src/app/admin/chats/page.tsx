import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageStepper } from "@/components/admin/filter-chips";
import { EmptyState, SectionCard, StatTile } from "@/components/dashboard/parts";
import { getAdminToken, listChats, type ChatMessage } from "@/lib/admin-api";
import { formatDateTime, formatPhone } from "@/lib/money";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Messages — InstaSafe console",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 50;

/** The API sends a `ChatDirection` enum; unknown values read as inbound. */
function isOutbound(direction: string | null | undefined) {
  return (direction ?? "").toLowerCase().startsWith("out");
}

export default async function AdminChatsPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string; from?: string; to?: string; page?: string }>;
}) {
  const params = await searchParams;
  const token = await getAdminToken();
  if (!token) redirect("/login");

  const phone = params.phone?.trim() ?? "";
  const from = params.from?.trim() ?? "";
  const to = params.to?.trim() ?? "";
  const page = Math.max(1, Number(params.page) || 1);

  const raw = await listChats(token, { phone, from, to, page, pageSize: PAGE_SIZE + 1 });
  const hasNext = raw.length > PAGE_SIZE;
  const messages: ChatMessage[] = raw.slice(0, PAGE_SIZE);

  const outbound = messages.filter((message) => isOutbound(message.direction)).length;
  const extra = { ...(phone ? { phone } : {}), ...(from ? { from } : {}), ...(to ? { to } : {}) };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
          Messages
        </h1>
        <p className="mt-2 max-w-2xl text-base leading-7 text-ink-muted">
          The WhatsApp transcript InstaSafe keeps for its own notifications.
          Buyers are not texted by the bot — they use the tracking link instead.
        </p>
      </div>

      <form
        action="/admin/chats"
        method="get"
        className="grid gap-3 sm:grid-cols-4 sm:items-end"
      >
        <div>
          <label htmlFor="phone" className="block text-sm font-semibold text-ink">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="search"
            inputMode="tel"
            defaultValue={phone}
            placeholder="0805… or 234805…"
            className="mt-2 w-full rounded-xl border border-line bg-surface px-3 py-2.5 font-mono text-sm text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          />
        </div>
        <div>
          <label htmlFor="from" className="block text-sm font-semibold text-ink">
            From
          </label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={from}
            className="mt-2 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          />
        </div>
        <div>
          <label htmlFor="to" className="block text-sm font-semibold text-ink">
            To
          </label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={to}
            className="mt-2 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-blue-spruce-800 px-4 text-sm font-semibold text-blue-spruce-50 transition-colors hover:bg-blue-spruce-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Filter
          </button>
          {phone || from || to ? (
            <Link
              href="/admin/chats"
              className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              Clear
            </Link>
          ) : null}
        </div>
      </form>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="On this page" value={messages.length} />
        <StatTile label="Sent by InstaSafe" value={outbound} />
        <StatTile
          label="Replies received"
          value={messages.length - outbound}
          tone="info"
        />
      </div>

      <SectionCard title="Transcript">
        {messages.length === 0 ? (
          <EmptyState
            title="No messages"
            description={
              phone
                ? `Nothing was sent to or received from ${formatPhone(phone)} in that window.`
                : "InstaSafe has not sent or received any WhatsApp messages yet."
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {messages.map((message, index) => {
              const out = isOutbound(message.direction);
              return (
                <li
                  key={message.id ?? `${message.createdAt}-${index}`}
                  className={cn(
                    "flex flex-col gap-1 px-5 py-3",
                    out ? "items-end text-right" : "items-start",
                  )}
                >
                  <p className="text-xs text-ink-muted">
                    <span className="font-mono">{formatPhone(message.phone)}</span>{" "}
                    · {out ? "sent" : "received"} ·{" "}
                    {formatDateTime(message.createdAt)}
                  </p>
                  <p
                    className={cn(
                      "max-w-prose rounded-2xl px-4 py-2.5 text-sm leading-6",
                      out
                        ? "bg-blue-spruce-800 text-blue-spruce-50"
                        : "border border-line bg-canvas text-ink",
                    )}
                  >
                    {message.body ?? ""}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
        <PageStepper
          basePath="/admin/chats"
          page={page}
          hasNext={hasNext}
          extraParams={extra}
        />
      </SectionCard>
    </div>
  );
}
