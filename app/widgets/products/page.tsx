"use client";

import { useWidgetData, usd, WidgetShell, Waiting } from "../widget-kit";

interface Product {
  id: number;
  name: string;
  type: string;
  cost: number;
  retail: number;
  markup: number;
  termMonths: number | null;
}
interface ProductsData {
  kind: "products";
  count: number;
  products: Product[];
}

const TYPE_LABELS: Record<string, string> = {
  warranty: "Warranty",
  gap: "GAP",
  maintenance: "Maintenance",
  tire_wheel: "Tire & Wheel",
  paint_protection: "Paint & Interior",
};

export default function ProductsWidget() {
  const { data } = useWidgetData<ProductsData>("products");
  if (!data) return <Waiting label="F&I Products" />;

  return (
    <WidgetShell title="F&I Product Menu" subtitle={`${data.count} products`}>
      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100 text-left text-xs uppercase text-zinc-500 dark:bg-zinc-800">
            <tr>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2 text-right">Retail</th>
              <th className="px-3 py-2 text-right">Markup</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-zinc-900">
            {data.products.map((p) => (
              <tr key={p.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-3 py-2 font-mono text-zinc-400">#{p.id}</td>
                <td className="px-3 py-2 font-medium">
                  {p.name}
                  {p.termMonths ? (
                    <span className="ml-1 text-xs text-zinc-400">{p.termMonths}mo</span>
                  ) : null}
                </td>
                <td className="px-3 py-2">
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {TYPE_LABELS[p.type] ?? p.type}
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-semibold">{usd(p.retail)}</td>
                <td className="px-3 py-2 text-right text-green-600 dark:text-green-400">
                  {usd(p.markup)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WidgetShell>
  );
}
