"use client";

import {
  useWidgetData,
  usd,
  WidgetShell,
  Waiting,
  SendMessageButton,
  useCanMessage,
} from "../widget-kit";

interface Vehicle {
  id: number;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  color: string | null;
  mileage: number;
  sellingPrice: number;
  certified: boolean;
  imageUrl: string | null;
}
interface InventoryData {
  kind: "inventory";
  count: number;
  vehicles: Vehicle[];
}

export default function InventoryWidget() {
  const { data, connected } = useWidgetData<InventoryData>("inventory");
  const canMessage = useCanMessage();

  if (!data) return <Waiting label="Inventory" />;

  return (
    <WidgetShell title="Inventory" subtitle={`${data.count} available`}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {data.vehicles.map((v) => (
          <div
            key={v.id}
            className="flex gap-3 rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900"
          >
            {v.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={v.imageUrl}
                alt={`${v.make} ${v.model}`}
                className="h-16 w-24 flex-none rounded-md object-cover"
              />
            ) : (
              <div className="h-16 w-24 flex-none rounded-md bg-zinc-100 dark:bg-zinc-800" />
            )}
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center gap-1">
                <p className="truncate text-sm font-semibold">
                  {v.year} {v.make} {v.model}
                </p>
                {v.certified && (
                  <span className="rounded bg-green-100 px-1 text-[10px] font-bold text-green-700 dark:bg-green-950 dark:text-green-300">
                    CPO
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {v.trim ? `${v.trim} · ` : ""}
                {v.color ? `${v.color} · ` : ""}
                {v.mileage.toLocaleString()} mi
              </p>
              <div className="mt-auto flex items-center justify-between pt-1">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {usd(v.sellingPrice)}
                  <span className="ml-1 text-[10px] font-normal text-zinc-400">
                    #{v.id}
                  </span>
                </p>
                <SendMessageButton
                  label="Get a quote →"
                  className="rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                  text={`I'd like a quote on the ${v.year} ${v.make} ${v.model}${
                    v.trim ? " " + v.trim : ""
                  } (vehicle #${v.id}).`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      {connected && !canMessage && (
        <p className="mt-3 text-center text-xs text-zinc-400">
          (This host doesn&apos;t support in-widget messaging — ask for a quote in chat.)
        </p>
      )}
    </WidgetShell>
  );
}
