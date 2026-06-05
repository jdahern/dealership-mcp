import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db/client";
import { deals, customers, vehicles, salespeople } from "@/db/schema";
import { usd } from "@/lib/format";
import { Badge } from "../badge";

export const dynamic = "force-dynamic";

export default async function DealsPage() {
  const rows = await db
    .select({
      id: deals.id,
      status: deals.status,
      type: deals.type,
      monthlyPayment: deals.monthlyPayment,
      frontGross: deals.frontGross,
      backGross: deals.backGross,
      customer: customers,
      vehicle: vehicles,
      sp: salespeople,
    })
    .from(deals)
    .innerJoin(customers, eq(deals.customerId, customers.id))
    .innerJoin(vehicles, eq(deals.vehicleId, vehicles.id))
    .innerJoin(salespeople, eq(deals.salespersonId, salespeople.id))
    .orderBy(desc(deals.updatedAt));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Deals</h1>
      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100 text-left text-xs uppercase text-zinc-500 dark:bg-zinc-800">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Vehicle</th>
              <th className="px-3 py-2">Salesperson</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Payment</th>
              <th className="px-3 py-2 text-right">Front</th>
              <th className="px-3 py-2 text-right">Back</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-zinc-900">
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                <td className="px-3 py-2 text-zinc-400">
                  <Link href={`/deals/${r.id}`} className="hover:underline">
                    #{r.id}
                  </Link>
                </td>
                <td className="px-3 py-2 font-medium">
                  <Link href={`/deals/${r.id}`} className="hover:underline">
                    {r.customer.firstName} {r.customer.lastName}
                  </Link>
                </td>
                <td className="px-3 py-2 text-zinc-500">
                  {r.vehicle.year} {r.vehicle.make} {r.vehicle.model}
                </td>
                <td className="px-3 py-2 text-zinc-500">{r.sp.name}</td>
                <td className="px-3 py-2">
                  <Badge status={r.status} />
                </td>
                <td className="px-3 py-2 text-right">
                  {r.monthlyPayment ? `${usd(r.monthlyPayment)}/mo` : "—"}
                </td>
                <td className="px-3 py-2 text-right text-green-600 dark:text-green-400">
                  {usd(r.frontGross)}
                </td>
                <td className="px-3 py-2 text-right text-green-600 dark:text-green-400">
                  {usd(r.backGross)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
