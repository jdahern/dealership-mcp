"use client";

import { useWidgetData, usd, WidgetShell, Waiting, StatusBadge } from "../widget-kit";

interface DashDeal {
  id: number;
  status: string;
  type: string;
  monthlyPayment: number | null;
  frontGross: number;
  backGross: number;
  customerName: string;
  vehicle: string;
  salesperson: string;
}
interface DashboardData {
  kind: "dashboard";
  deals: DashDeal[];
  totals: { count: number; front: number; back: number; avg: number };
}

export default function DashboardWidget() {
  const { data } = useWidgetData<DashboardData>("dashboard");
  if (!data) return <Waiting label="Deal Board" />;

  return (
    <WidgetShell title="Deal Board" subtitle={`${data.totals.count} deals`}>
      <div className="mb-3 grid grid-cols-3 gap-2">
        <Stat label="Front" value={usd(data.totals.front)} />
        <Stat label="Back" value={usd(data.totals.back)} />
        <Stat label="Avg/deal" value={usd(data.totals.avg)} />
      </div>
      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100 text-left text-xs uppercase text-zinc-500 dark:bg-zinc-800">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Vehicle</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Front</th>
              <th className="px-3 py-2 text-right">Back</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-zinc-900">
            {data.deals.map((d) => (
              <tr key={d.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-3 py-2 text-zinc-400">#{d.id}</td>
                <td className="px-3 py-2 font-medium">{d.customerName}</td>
                <td className="px-3 py-2 text-zinc-500">{d.vehicle}</td>
                <td className="px-3 py-2">
                  <StatusBadge status={d.status} />
                </td>
                <td className="px-3 py-2 text-right text-green-600 dark:text-green-400">
                  {usd(d.frontGross)}
                </td>
                <td className="px-3 py-2 text-right text-green-600 dark:text-green-400">
                  {usd(d.backGross)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WidgetShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-0.5 text-lg font-bold">{value}</p>
    </div>
  );
}
