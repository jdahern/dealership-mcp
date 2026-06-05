import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { paymentCalculations, creditApps, lenderSubmissions, loanDecisions, lenders } from "@/db/schema";
import { buildDealView } from "@/lib/mcp/tools/deal-view";
import { usd } from "@/lib/format";
import { Badge } from "../../badge";

export const dynamic = "force-dynamic";

export default async function DealDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dealId = Number(id);
  const view = await buildDealView(dealId, "manager");
  if (!view) notFound();

  const calcs = await db
    .select()
    .from(paymentCalculations)
    .where(eq(paymentCalculations.dealId, dealId));

  // credit app + lender decisions for this deal
  const apps = await db.select().from(creditApps).where(eq(creditApps.dealId, dealId));
  const decisions = apps.length
    ? await db
        .select({
          lender: lenders.name,
          status: loanDecisions.status,
          rate: loanDecisions.approvedRate,
          term: loanDecisions.approvedTermMonths,
          maxAmount: loanDecisions.maxAmount,
          stipulations: loanDecisions.stipulations,
        })
        .from(loanDecisions)
        .innerJoin(lenderSubmissions, eq(loanDecisions.lenderSubmissionId, lenderSubmissions.id))
        .innerJoin(lenders, eq(lenderSubmissions.lenderId, lenders.id))
        .where(eq(lenderSubmissions.creditAppId, apps[0].id))
    : [];

  const d = view.deal;
  const v = view.vehicle;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Deal #{d.id}</h1>
        <Badge status={d.status} />
        <span className="text-sm text-zinc-500">{view.customer?.name}</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Panel title="Vehicle">
          {v ? (
            <div className="flex gap-3">
              {v.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.imageUrl} alt="" className="h-20 w-32 rounded object-cover" />
              )}
              <div className="text-sm">
                <p className="font-semibold">{v.year} {v.make} {v.model}</p>
                <p className="text-zinc-500">{v.trim} {v.color}</p>
                <p className="mt-1">Sell {usd(v.sellingPrice)} · Cost {usd(v.cost)}</p>
              </div>
            </div>
          ) : "—"}
        </Panel>

        <Panel title="Terms">
          <dl className="space-y-1 text-sm">
            <Line k="Type" v={<span className="capitalize">{d.type}</span>} />
            <Line k="Payment" v={d.monthlyPayment ? `${usd(d.monthlyPayment)}/mo · ${d.termMonths}mo @ ${d.apr}%` : "—"} />
            <Line k="Down" v={usd(d.downPayment)} />
            <Line k="Front gross" v={usd(d.frontGross)} />
            <Line k="Back gross" v={usd(d.backGross)} />
          </dl>
        </Panel>

        {view.trade && (
          <Panel title="Trade-in">
            <p className="text-sm">
              {view.trade.year} {view.trade.make} {view.trade.model}
            </p>
            <p className="text-sm text-zinc-500">
              ACV {usd(view.trade.acv)} − payoff {usd(view.trade.payoff)} ={" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{usd(view.trade.equity)}</span>
            </p>
          </Panel>
        )}

        <Panel title="F&I Products">
          {view.products.length ? (
            <ul className="space-y-1 text-sm">
              {view.products.map((p) => (
                <li key={p.id} className="flex justify-between">
                  <span>{p.name}</span>
                  <span className="font-medium">{usd(p.soldPrice)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-400">None attached</p>
          )}
        </Panel>
      </div>

      {decisions.length > 0 && (
        <Panel title="Lender decisions">
          <ul className="space-y-1 text-sm">
            {decisions.map((dec, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="w-40 font-medium">{dec.lender}</span>
                <Badge status={dec.status} />
                <span className="text-zinc-500">
                  {dec.rate ? `${dec.rate}% · ${dec.term}mo · max ${usd(dec.maxAmount)}` : ""}
                  {dec.stipulations ? ` · ${dec.stipulations}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {calcs.length > 0 && (
        <Panel title="Quote history">
          <ul className="space-y-1 text-sm text-zinc-500">
            {calcs.map((c) => (
              <li key={c.id}>
                {c.scenarioLabel} — {usd(c.monthlyPayment)}/mo
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">{title}</h2>
      {children}
    </div>
  );
}

function Line({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-zinc-400">{k}</dt>
      <dd className="text-right">{v}</dd>
    </div>
  );
}
