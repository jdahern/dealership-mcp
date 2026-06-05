"use client";

import { useMcpApp } from "../../hooks/use-mcp-app";
import {
  usd,
  WidgetShell,
  Waiting,
  StatusBadge,
  SendMessageButton,
} from "../widget-kit";

// Scope-aware "move it forward" call to action (injects a chat message).
function dealCta(scope: string, deal: { id: number; status: string }) {
  if (scope === "buyer")
    return {
      label: "Apply for financing →",
      text: `I'd like to apply for financing on my deal (#${deal.id}).`,
    };
  if (scope === "manager")
    return deal.status === "ready"
      ? null
      : { label: "Approve this deal →", text: `Approve deal #${deal.id}.` };
  // salesperson (and any other writer scope)
  return {
    label: "Send to financing →",
    text: `Move deal #${deal.id} into financing — submit the customer's credit application.`,
  };
}

interface DealView {
  kind: "deal";
  scope: string;
  deal: {
    id: number;
    type: string;
    status: string;
    downPayment: number;
    termMonths: number | null;
    apr: number | null;
    monthlyPayment: number | null;
    frontGross?: number;
    backGross?: number;
    notes: string | null;
  };
  customer: { id: number; name: string } | null;
  vehicle: {
    year: number;
    make: string;
    model: string;
    trim: string | null;
    color: string | null;
    sellingPrice: number;
    cost?: number;
    imageUrl: string | null;
  } | null;
  trade: { year: number | null; make: string | null; model: string | null; acv: number; payoff: number; equity: number } | null;
  products: { id: number; name: string; type: string; soldPrice: number }[];
  reserve?: number;
  insights?: string[];
}

interface DealListItem {
  id: number;
  status: string;
  type: string;
  monthlyPayment: number | null;
  frontGross: number;
  backGross: number;
  customerName: string;
  vehicle: string;
}
interface DealListData {
  kind: "dealList";
  scope: string;
  deals: DealListItem[];
}

export default function DealWidget() {
  const { toolResult } = useMcpApp();
  const result = toolResult as (DealView | DealListData) | null;

  if (result?.kind === "dealList") return <DealList data={result} />;
  if (result?.kind === "deal") return <DealDetail data={result} />;
  return <Waiting label="Deal" />;
}

function DealDetail({ data }: { data: DealView }) {
  const { deal, vehicle, customer, trade, products } = data;
  const showMoney = data.scope !== "buyer";
  return (
    <WidgetShell title={`Deal #${deal.id}`} subtitle={customer?.name ?? ""}>
      <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex gap-3 border-b border-zinc-100 p-4 dark:border-zinc-800">
          {vehicle?.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={vehicle.imageUrl} alt="" className="h-20 w-32 flex-none rounded-md object-cover" />
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="font-semibold">
                {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "—"}
              </p>
              <StatusBadge status={deal.status} />
            </div>
            <p className="text-xs text-zinc-500">
              {vehicle?.trim} {vehicle?.color}
            </p>
            <p className="mt-1 text-sm">
              {vehicle ? usd(vehicle.sellingPrice) : ""}
              {deal.monthlyPayment != null && (
                <span className="ml-2 font-semibold">
                  {usd(deal.monthlyPayment)}/mo · {deal.termMonths}mo @ {deal.apr}%
                </span>
              )}
            </p>
          </div>
        </div>

        <Row label="Type" value={<span className="capitalize">{deal.type}</span>} />
        <Row label="Down" value={usd(deal.downPayment)} />
        {trade && (
          <Row
            label="Trade-in"
            value={
              <span>
                {trade.year} {trade.make} {trade.model} · ACV {usd(trade.acv)} − payoff{" "}
                {usd(trade.payoff)} ={" "}
                <span className="font-semibold">{usd(trade.equity)}</span>
              </span>
            }
          />
        )}
        <Row
          label="Products"
          value={
            products.length ? (
              <ul className="space-y-0.5">
                {products.map((p) => (
                  <li key={p.id}>
                    {p.name} — {usd(p.soldPrice)}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-zinc-400">none</span>
            )
          }
        />
        {showMoney && (
          <div className="flex gap-4 border-t border-zinc-100 p-4 text-sm dark:border-zinc-800">
            <span>
              Front gross{" "}
              <b className="text-green-600 dark:text-green-400">{usd(deal.frontGross)}</b>
            </span>
            <span>
              Back gross{" "}
              <b className="text-green-600 dark:text-green-400">{usd(deal.backGross)}</b>
            </span>
            {data.reserve != null && data.reserve > 0 && (
              <span>
                Reserve{" "}
                <b className="text-green-600 dark:text-green-400">~{usd(data.reserve)}</b>
              </span>
            )}
          </div>
        )}
        {data.insights && data.insights.length > 0 && (
          <div className="border-t border-zinc-100 p-4 dark:border-zinc-800">
            {data.insights.map((t, i) => (
              <p key={i} className="text-sm text-amber-600 dark:text-amber-400">
                💡 {t}
              </p>
            ))}
          </div>
        )}
        {(() => {
          const cta = dealCta(data.scope, deal);
          return cta ? (
            <div className="flex justify-end border-t border-zinc-100 p-3 dark:border-zinc-800">
              <SendMessageButton label={cta.label} text={cta.text} />
            </div>
          ) : null;
        })()}
      </div>
    </WidgetShell>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-4 px-4 py-2 text-sm">
      <span className="w-20 flex-none text-zinc-400">{label}</span>
      <div className="flex-1">{value}</div>
    </div>
  );
}

function DealList({ data }: { data: DealListData }) {
  return (
    <WidgetShell title="Deals" subtitle={`${data.deals.length} total`}>
      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <tbody>
            {data.deals.map((d) => (
              <tr
                key={d.id}
                className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
              >
                <td className="px-3 py-2 text-zinc-400">#{d.id}</td>
                <td className="px-3 py-2 font-medium">{d.customerName}</td>
                <td className="px-3 py-2 text-zinc-500">{d.vehicle}</td>
                <td className="px-3 py-2">
                  <StatusBadge status={d.status} />
                </td>
                <td className="px-3 py-2 text-right">
                  {d.monthlyPayment ? `${usd(d.monthlyPayment)}/mo` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WidgetShell>
  );
}
