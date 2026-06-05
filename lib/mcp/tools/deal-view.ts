import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  deals,
  vehicles,
  customers,
  tradeIns,
  dealProducts,
  products,
} from "@/db/schema";
import { money } from "./helpers";

export type Scope = "buyer" | "salesperson" | "manager";

/**
 * Assemble the full "deal viewer" payload. `scope` controls field visibility:
 * buyers never see cost/gross/reserve; managers see everything.
 */
export async function buildDealView(dealId: number, scope: Scope) {
  const [deal] = await db.select().from(deals).where(eq(deals.id, dealId)).limit(1);
  if (!deal) return null;

  const [vehicle] = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.id, deal.vehicleId))
    .limit(1);
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, deal.customerId))
    .limit(1);
  const [trade] = await db
    .select()
    .from(tradeIns)
    .where(eq(tradeIns.dealId, dealId))
    .limit(1);
  const dp = await db
    .select({
      id: dealProducts.id,
      soldPrice: dealProducts.soldPrice,
      name: products.name,
      type: products.type,
      cost: products.cost,
    })
    .from(dealProducts)
    .innerJoin(products, eq(dealProducts.productId, products.id))
    .where(eq(dealProducts.dealId, dealId));

  const showMoney = scope !== "buyer";
  const tradeEquity = trade ? money(trade.acv) - money(trade.payoff) : 0;
  const backGross = dp.reduce((s, p) => s + (money(p.soldPrice) - money(p.cost)), 0);

  return {
    kind: "deal" as const,
    scope,
    deal: {
      id: deal.id,
      type: deal.type,
      status: deal.status,
      downPayment: money(deal.downPayment),
      termMonths: deal.termMonths,
      apr: deal.apr ? money(deal.apr) : null,
      monthlyPayment: deal.monthlyPayment ? money(deal.monthlyPayment) : null,
      notes: deal.notes,
      ...(showMoney
        ? { frontGross: money(deal.frontGross), backGross: Math.round(backGross * 100) / 100 }
        : {}),
    },
    customer: customer
      ? { id: customer.id, name: `${customer.firstName} ${customer.lastName}` }
      : null,
    vehicle: vehicle
      ? {
          id: vehicle.id,
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          trim: vehicle.trim,
          color: vehicle.color,
          sellingPrice: money(vehicle.sellingPrice),
          imageUrl: vehicle.imageUrl,
          ...(showMoney ? { cost: money(vehicle.cost) } : {}),
        }
      : null,
    trade: trade
      ? {
          year: trade.year,
          make: trade.make,
          model: trade.model,
          mileage: trade.mileage,
          acv: money(trade.acv),
          payoff: money(trade.payoff),
          equity: Math.round(tradeEquity * 100) / 100,
        }
      : null,
    products: dp.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      soldPrice: money(p.soldPrice),
      ...(showMoney ? { cost: money(p.cost) } : {}),
    })),
  };
}
