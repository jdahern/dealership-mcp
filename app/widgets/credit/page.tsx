"use client";

import { useMcpApp } from "../../hooks/use-mcp-app";
import { usd, WidgetShell, Waiting, StatusBadge } from "../widget-kit";

interface Decision {
  lender: string;
  status: string;
  rate: number | null;
  term: number | null;
  maxAmount: number | null;
  stipulations: string | null;
}
interface StatusData {
  kind: "credit";
  view: "status";
  scope: string;
  app: { id: number; status: string; annualIncome: number | null };
  customer: { name: string } | null;
  deal: { id: number; vehicle: string; monthlyPayment: number | null; status: string } | null;
  steps: { label: string; done: boolean }[];
  decisions: Decision[];
}
interface QueueData {
  kind: "credit";
  view: "queue";
  apps: {
    id: number;
    status: string;
    dealId: number;
    income: number | null;
    customerName: string;
    vehicle: string;
  }[];
}

export default function CreditWidget() {
  const { toolResult } = useMcpApp();
  const r = toolResult as (StatusData | QueueData) | null;
  if (r?.kind !== "credit") return <Waiting label="Credit" />;
  if (r.view === "queue") return <Queue data={r} />;
  return <Status data={r} />;
}

function Status({ data }: { data: StatusData }) {
  return (
    <WidgetShell title={`Application #${data.app.id}`} subtitle={data.customer?.name ?? ""}>
      <div className="space-y-3">
        {data.deal && (
          <div className="rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <span className="font-medium">{data.deal.vehicle}</span>
            {data.deal.monthlyPayment != null && (
              <span className="ml-2 text-zinc-500">{usd(data.deal.monthlyPayment)}/mo</span>
            )}
          </div>
        )}

        <ol className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {data.steps.map((s, i) => (
            <li
              key={i}
              className="flex items-center gap-3 border-b border-zinc-100 px-4 py-2 text-sm last:border-0 dark:border-zinc-800"
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                  s.done
                    ? "bg-green-500 text-white"
                    : "bg-zinc-200 text-zinc-400 dark:bg-zinc-700"
                }`}
              >
                {s.done ? "✓" : i + 1}
              </span>
              <span className={s.done ? "" : "text-zinc-400"}>{s.label}</span>
            </li>
          ))}
        </ol>

        {data.decisions.length > 0 && (
          <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            {data.decisions.map((d, i) => (
              <div
                key={i}
                className="flex items-center gap-2 border-b border-zinc-100 px-4 py-2 text-sm last:border-0 dark:border-zinc-800"
              >
                <span className="w-40 font-medium">{d.lender}</span>
                <StatusBadge status={d.status} />
                <span className="text-xs text-zinc-500">
                  {d.rate != null ? `${d.rate}% · ${d.term}mo · max ${usd(d.maxAmount)}` : ""}
                  {d.stipulations ? ` · ${d.stipulations}` : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </WidgetShell>
  );
}

function Queue({ data }: { data: QueueData }) {
  return (
    <WidgetShell title="Credit Queue" subtitle={`${data.apps.length} apps`}>
      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <tbody>
            {data.apps.map((a) => (
              <tr key={a.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                <td className="px-3 py-2 text-zinc-400">#{a.id}</td>
                <td className="px-3 py-2 font-medium">{a.customerName}</td>
                <td className="px-3 py-2 text-zinc-500">{a.vehicle}</td>
                <td className="px-3 py-2 text-zinc-500">
                  {a.income != null ? `${usd(a.income)} inc` : ""}
                </td>
                <td className="px-3 py-2">
                  <StatusBadge status={a.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WidgetShell>
  );
}
