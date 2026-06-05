import { statusLabel } from "@/lib/format";

const COLORS: Record<string, string> = {
  quoted: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  deal: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  credit_submitted: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  lender_decision: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  ready: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  approved: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  conditional: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  declined: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  submitted: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  available: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  sold: "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300",
};

export function Badge({ status }: { status: string }) {
  const cls = COLORS[status] ?? COLORS.quoted;
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium uppercase ${cls}`}>
      {statusLabel(status)}
    </span>
  );
}
