"use client";

import { useEffect, useState } from "react";
import {
  useWidgetData,
  usd,
  WidgetShell,
  Waiting,
  SendMessageButton,
} from "../widget-kit";
import { buildQuote, type DealKind } from "@/lib/mcp/payment-math";

interface DeskingData {
  kind: "desking";
  dealId: number | null;
  vehicle: {
    id: number;
    year: number;
    make: string;
    model: string;
    trim: string | null;
    sellingPrice: number;
    imageUrl: string | null;
  };
  type: DealKind;
  tradeEquity: number;
  selected: { down: number; term: number; apr: number };
}

const TYPES: DealKind[] = ["finance", "cash", "lease"];
const TERMS: Record<DealKind, number[]> = {
  finance: [36, 48, 60, 72, 84],
  lease: [24, 36, 48],
  cash: [],
};
const DOWN_CHIPS = [0, 1000, 3000, 5000, 10000];

export default function DeskingWidget() {
  const { data, app } = useWidgetData<DeskingData>("desking");

  // Live, client-side quote state — initialized from the server's baseline,
  // then recomputed instantly on every change (no round-trip).
  const [type, setType] = useState<DealKind>("finance");
  const [down, setDown] = useState(0);
  const [term, setTerm] = useState(72);
  const [apr, setApr] = useState(6.9);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Re-sync when a new quote arrives (e.g. a different vehicle from chat).
  const vehicleId = data?.vehicle.id;
  useEffect(() => {
    if (!data) return;
    setType(data.type);
    setDown(data.selected.down);
    setTerm(data.selected.term || 72);
    setApr(data.selected.apr || 6.9);
    setSaved(false);
  }, [data, vehicleId]);

  if (!data) return <Waiting label="Desking" />;
  const { vehicle, tradeEquity, dealId } = data;
  const price = vehicle.sellingPrice;

  // ---- live computation (instant, no server) ----
  const q = buildQuote(type, { price, down, term, apr, tradeEquity });
  const terms = TERMS[type];

  function change<T>(setter: (v: T) => void, v: T) {
    setter(v);
    setSaved(false);
  }

  async function saveToDeal() {
    if (!app || dealId == null) return;
    setSaving(true);
    try {
      await app.callServerTool({
        name: "build_quote",
        arguments: { vehicleId: vehicle.id, type, down, term, apr, dealId },
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <WidgetShell
      title="Desking"
      subtitle={`${vehicle.year} ${vehicle.make} ${vehicle.model} · ${usd(price)}`}
    >
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        {/* type toggle */}
        <div className="mb-4 flex gap-1">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => change(setType, t)}
              className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
                type === t
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* big live payment */}
        <div className="mb-4 rounded-md bg-zinc-50 p-3 dark:bg-zinc-800/50">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-400">{q.label}</p>
              {type !== "cash" ? (
                <p className="text-4xl font-bold tabular-nums">
                  {usd(q.monthlyPayment)}
                  <span className="text-sm font-normal text-zinc-400">/mo</span>
                </p>
              ) : (
                <p className="text-4xl font-bold tabular-nums">
                  {usd(q.down)}
                  <span className="text-sm font-normal text-zinc-400"> due</span>
                </p>
              )}
            </div>
            <dl className="text-right text-xs text-zinc-500">
              {type !== "cash" && (
                <>
                  <div>Financed {usd(q.amountFinanced)}</div>
                  <div>APR {apr.toFixed(1)}%</div>
                </>
              )}
              <div>
                Tax {usd(q.taxes)} · Doc {usd(q.docFee)}
              </div>
              {tradeEquity !== 0 && <div>Trade {usd(tradeEquity)}</div>}
            </dl>
          </div>
        </div>

        {/* live controls */}
        <div className="space-y-4">
          {/* down payment slider */}
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-600 dark:text-zinc-300">
                Cash down
              </span>
              <span className="font-semibold tabular-nums">{usd(down)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.ceil(price)}
              step={250}
              value={down}
              onChange={(e) => change(setDown, Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="mt-1 flex gap-1">
              {DOWN_CHIPS.map((d) => (
                <button
                  key={d}
                  onClick={() => change(setDown, d)}
                  className={`rounded px-2 py-0.5 text-[11px] ${
                    down === d
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {d === 0 ? "$0" : `$${d / 1000}k`}
                </button>
              ))}
            </div>
          </div>

          {/* APR slider (finance/lease only) */}
          {type !== "cash" && (
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-600 dark:text-zinc-300">APR</span>
                <span className="font-semibold tabular-nums">{apr.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={18}
                step={0.1}
                value={apr}
                onChange={(e) => change(setApr, Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
          )}

          {/* term chips with live per-term payment */}
          {type !== "cash" && (
            <div>
              <div className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                Term
              </div>
              <div className="flex flex-wrap gap-2">
                {terms.map((t) => {
                  const tq = buildQuote(type, { price, down, term: t, apr, tradeEquity });
                  return (
                    <button
                      key={t}
                      onClick={() => change(setTerm, t)}
                      className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                        t === term
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
                          : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700"
                      }`}
                    >
                      <div className="font-semibold">{t} mo</div>
                      <div className="tabular-nums text-zinc-500">
                        {usd(tq.monthlyPayment)}/mo
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* save to the deal (the only server call) */}
        {dealId != null && (
          <div className="mt-4 flex items-center gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <button
              onClick={saveToDeal}
              disabled={saving}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Saving…" : saved ? "Saved ✓" : `Save to deal #${dealId}`}
            </button>
            <span className="text-xs text-zinc-400">
              {saved ? "Quote written to the deal." : "Adjust freely — saves only when you click."}
            </span>
          </div>
        )}

        {/* move the conversation forward (sends a chat message to the host) */}
        <div className="mt-3 flex justify-end">
          {dealId != null ? (
            <SendMessageButton
              label="Apply for financing →"
              text={`Apply for financing on deal #${dealId}.`}
            />
          ) : (
            <SendMessageButton
              label="Create this deal →"
              text={`Create a ${type} deal on the ${vehicle.year} ${vehicle.make} ${vehicle.model} (vehicle #${vehicle.id}) with ${usd(
                down,
              )} down${type !== "cash" ? ` over ${term} months at ${apr.toFixed(1)}% APR` : ""}.`}
            />
          )}
        </div>
      </div>
    </WidgetShell>
  );
}
