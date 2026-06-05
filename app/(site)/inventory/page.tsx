import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { vehicles } from "@/db/schema";
import { usd } from "@/lib/format";
import { Badge } from "../badge";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const rows = await db.select().from(vehicles).orderBy(desc(vehicles.year));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100 text-left text-xs uppercase text-zinc-500 dark:bg-zinc-800">
            <tr>
              <th className="px-3 py-2">Stock</th>
              <th className="px-3 py-2">Vehicle</th>
              <th className="px-3 py-2">Mileage</th>
              <th className="px-3 py-2 text-right">Price</th>
              <th className="px-3 py-2 text-right">Cost</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-zinc-900">
            {rows.map((v) => (
              <tr key={v.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-3 py-2 font-mono text-xs text-zinc-400">{v.stockNumber}</td>
                <td className="px-3 py-2">
                  {v.year} {v.make} {v.model}{" "}
                  <span className="text-zinc-400">{v.trim}</span>
                  {v.certified && (
                    <span className="ml-1 rounded bg-green-100 px-1 text-[10px] font-bold text-green-700 dark:bg-green-950 dark:text-green-300">
                      CPO
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-zinc-500">{v.mileage.toLocaleString()} mi</td>
                <td className="px-3 py-2 text-right font-semibold">{usd(v.sellingPrice)}</td>
                <td className="px-3 py-2 text-right text-zinc-400">{usd(v.cost)}</td>
                <td className="px-3 py-2">
                  <Badge status={v.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
