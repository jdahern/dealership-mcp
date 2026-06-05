"use client";

import { useState } from "react";
import { useMcpApp } from "../hooks/use-mcp-app";

/**
 * A button that injects a user message into the host conversation
 * (app.sendMessage) — i.e. the widget "talks to the chat" to move the flow
 * forward. Renders nothing if the host doesn't advertise the `message`
 * capability. Purely client-side (no server involvement).
 */
export function SendMessageButton({
  text,
  label,
  sentLabel = "Sent ✓",
  className,
}: {
  /** The message text injected into the chat as a user turn. */
  text: string;
  label: string;
  sentLabel?: string;
  className?: string;
}) {
  const { app, connected } = useMcpApp();
  const [sent, setSent] = useState(false);

  const canMessage = connected && !!app?.getHostCapabilities?.()?.message;
  if (!canMessage) return null;

  async function go() {
    if (!app) return;
    setSent(true);
    try {
      const res = await app.sendMessage({
        role: "user",
        content: [{ type: "text", text }],
      });
      if (res?.isError) setSent(false);
    } catch {
      setSent(false);
    }
  }

  return (
    <button
      onClick={go}
      disabled={sent}
      className={
        className ??
        "rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
      }
    >
      {sent ? sentLabel : label}
    </button>
  );
}

/** Whether the connected host accepts in-widget messages (ui/message). */
export function useCanMessage(): boolean {
  const { app, connected } = useMcpApp();
  return connected && !!app?.getHostCapabilities?.()?.message;
}

export function usd(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

/**
 * Read the current tool result and shape-guard it by `kind`. The MCP App
 * singleton keeps the last tool result across widget pages in one iframe, so a
 * widget must ignore payloads that aren't its shape.
 */
export function useWidgetData<T extends { kind: string }>(kind: T["kind"]) {
  const { toolResult, connected, app } = useMcpApp();
  const data = toolResult as T | null;
  const matches = !!data && data.kind === kind;
  return { data: matches ? data : null, connected, app, raw: toolResult };
}

export function WidgetShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto max-w-3xl px-4 py-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h1 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {title}
          </h1>
          {subtitle && (
            <span className="text-xs text-zinc-400 dark:text-zinc-500">{subtitle}</span>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

export function Waiting({ label }: { label: string }) {
  return (
    <WidgetShell title={label}>
      <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-400 dark:border-zinc-700">
        Waiting for tool data…
      </div>
    </WidgetShell>
  );
}

const STATUS_COLORS: Record<string, string> = {
  quoted: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  deal: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  credit_submitted: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  lender_decision: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  ready: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  approved: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  conditional: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  declined: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  submitted: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
};

export function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? STATUS_COLORS.quoted;
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium uppercase ${cls}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
