import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { vehicles, deals, customers } from "@/db/schema";
import { usd } from "@/lib/format";
import { Badge } from "./badge";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Overview() {
  const [vehCount] = await db
    .select({ n: sql<number>`count(*)::int`, avail: sql<number>`count(*) filter (where status = 'available')::int` })
    .from(vehicles);
  const [custCount] = await db.select({ n: sql<number>`count(*)::int` }).from(customers);
  const [dealAgg] = await db
    .select({
      n: sql<number>`count(*)::int`,
      front: sql<number>`coalesce(sum(front_gross),0)::float`,
      back: sql<number>`coalesce(sum(back_gross),0)::float`,
    })
    .from(deals);

  const byStatus = await db
    .select({ status: deals.status, n: sql<number>`count(*)::int` })
    .from(deals)
    .groupBy(deals.status);

  const cards = [
    { label: "Vehicles available", value: `${vehCount.avail} / ${vehCount.n}` },
    { label: "Customers", value: custCount.n },
    { label: "Open deals", value: dealAgg.n },
    { label: "Total gross", value: usd(dealAgg.front + dealAgg.back) },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-zinc-500">
          Live view of the same data the MCP persona tools read and write.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="text-xs uppercase tracking-wide text-zinc-400">{c.label}</p>
            <p className="mt-1 text-2xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Deals by status
        </h2>
        <div className="flex flex-wrap gap-2">
          {byStatus.map((s) => (
            <div
              key={s.status}
              className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <Badge status={s.status} />
              <span className="text-sm font-semibold">{s.n}</span>
            </div>
          ))}
        </div>
        <Link href="/deals" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
          View all deals →
        </Link>
      </div>
    </div>
  );
}
