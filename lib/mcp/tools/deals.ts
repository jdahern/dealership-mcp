import { z } from "zod";
import { desc, eq, ilike, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import {
  deals,
  vehicles,
  customers,
  tradeIns,
  dealProducts,
  products,
} from "@/db/schema";
import type { AppToolDef } from "../register";
import { WIDGETS } from "../widgets";
import { buildQuote } from "../payment-math";
import { money, getActingSalesperson, getActingBuyer, text } from "./helpers";
import { buildDealView } from "./deal-view";

export const createDeal: AppToolDef = {
  name: "create_deal",
  title: "Create Deal",
  description:
    "Create a deal pairing a customer with a vehicle. Computes an initial payment and marks the vehicle pending.",
  inputSchema: {
    customerId: z.number().describe("Customer for this deal"),
    vehicleId: z.number().describe("Vehicle being sold"),
    type: z.enum(["cash", "finance", "lease"]).optional(),
    down: z.number().optional(),
    term: z.number().optional(),
    apr: z.number().optional(),
  },
  widget: WIDGETS.deal,
  annotations: { readOnlyHint: false },
  handler: async ({ customerId, vehicleId, type, down, term, apr }) => {
    const sp = await getActingSalesperson();
    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, Number(vehicleId)))
      .limit(1);
    if (!vehicle) return { content: text(`No vehicle #${vehicleId}.`), isError: true };

    const kind = (type as "cash" | "finance" | "lease") ?? "finance";
    const price = money(vehicle.sellingPrice);
    const q = buildQuote(kind, {
      price,
      down: down != null ? Number(down) : undefined,
      term: term != null ? Number(term) : undefined,
      apr: apr != null ? Number(apr) : undefined,
    });
    const frontGross = Math.round((price - money(vehicle.cost)) * 100) / 100;

    const [deal] = await db
      .insert(deals)
      .values({
        customerId: Number(customerId),
        vehicleId: Number(vehicleId),
        salespersonId: sp.id,
        type: kind,
        status: "deal",
        downPayment: String(q.down),
        termMonths: q.term || null,
        apr: String(q.apr),
        monthlyPayment: String(q.monthlyPayment),
        frontGross: String(frontGross),
      })
      .returning();

    await db
      .update(vehicles)
      .set({ status: "pending" })
      .where(eq(vehicles.id, Number(vehicleId)));

    const view = await buildDealView(deal.id, "salesperson");
    return {
      content: text(
        `Created deal #${deal.id} — ${vehicle.year} ${vehicle.make} ${vehicle.model}, ${q.label}, $${q.monthlyPayment.toLocaleString()}/mo.`,
      ),
      structuredContent: view ?? undefined,
    };
  },
};

export const addTradeIn: AppToolDef = {
  name: "add_trade_in",
  title: "Add Trade-In",
  description: "Attach a trade-in vehicle to a deal (actual cash value and loan payoff).",
  inputSchema: {
    dealId: z.number(),
    year: z.number().optional(),
    make: z.string().optional(),
    model: z.string().optional(),
    mileage: z.number().optional(),
    acv: z.number().describe("Actual cash value of the trade"),
    payoff: z.number().optional().describe("Remaining loan payoff"),
  },
  widget: WIDGETS.deal,
  annotations: { readOnlyHint: false },
  handler: async ({ dealId, year, make, model, mileage, acv, payoff }) => {
    await db.insert(tradeIns).values({
      dealId: Number(dealId),
      year: year != null ? Number(year) : null,
      make: make ? String(make) : null,
      model: model ? String(model) : null,
      mileage: mileage != null ? Number(mileage) : null,
      acv: String(Number(acv)),
      payoff: String(payoff != null ? Number(payoff) : 0),
    });

    const view = await buildDealView(Number(dealId), "salesperson");
    const equity = view?.trade?.equity ?? 0;
    return {
      content: text(
        `Added trade to deal #${dealId}: ${make ?? "vehicle"} — net equity $${equity.toLocaleString()}.`,
      ),
      structuredContent: view ?? undefined,
    };
  },
};

export const addProducts: AppToolDef = {
  name: "add_products",
  title: "Add F&I Products",
  description:
    "Add one or more F&I products (warranty, GAP, etc.) to a deal at their retail price. Identify products by productIds OR by productNames (case-insensitive, partial match) — call list_products first to see the menu. Updates back-end gross.",
  inputSchema: {
    dealId: z.number(),
    productIds: z.array(z.number()).optional().describe("Product IDs to add"),
    productNames: z
      .array(z.string())
      .optional()
      .describe('Product names to add, e.g. ["GAP", "Vehicle Service Contract"] (matched case-insensitively)'),
  },
  widget: WIDGETS.deal,
  annotations: { readOnlyHint: false },
  handler: async ({ dealId, productIds, productNames }) => {
    const ids = ((productIds as number[] | undefined) ?? []).map(Number);
    const names = (productNames as string[] | undefined) ?? [];

    // resolve by id and/or by name match
    const byId = ids.length ? await db.select().from(products).where(inArray(products.id, ids)) : [];
    const byName: (typeof products.$inferSelect)[] = [];
    for (const n of names) {
      const [match] = await db
        .select()
        .from(products)
        .where(ilike(products.name, `%${n}%`))
        .limit(1);
      if (match) byName.push(match);
    }
    // dedupe
    const rows = Array.from(
      new Map([...byId, ...byName].map((p) => [p.id, p])).values(),
    );
    if (!rows.length)
      return {
        content: text(
          "No matching products. Call list_products to see the menu, then pass productIds or productNames.",
        ),
        isError: true,
      };

    for (const p of rows) {
      await db.insert(dealProducts).values({
        dealId: Number(dealId),
        productId: p.id,
        soldPrice: p.retailPrice,
      });
    }

    // recompute back gross on the deal
    const view = await buildDealView(Number(dealId), "salesperson");
    const backGross = view?.deal?.backGross ?? 0;
    await db
      .update(deals)
      .set({ backGross: String(backGross), updatedAt: new Date() })
      .where(eq(deals.id, Number(dealId)));

    return {
      content: text(
        `Added ${rows.length} product(s) to deal #${dealId}: ${rows.map((r) => r.name).join(", ")}. Back gross now $${backGross.toLocaleString()}.`,
      ),
      structuredContent: view ?? undefined,
    };
  },
};

export const viewDeal: AppToolDef = {
  name: "view_deal",
  title: "View Deal",
  description: "Show the full detail of a deal — vehicle, trade, products, payment, and gross.",
  inputSchema: { dealId: z.number() },
  widget: WIDGETS.deal,
  annotations: { readOnlyHint: true },
  handler: async ({ dealId }) => {
    const view = await buildDealView(Number(dealId), "salesperson");
    if (!view) return { content: text(`No deal #${dealId}.`), isError: true };
    return {
      content: text(
        `Deal #${dealId}: ${view.vehicle?.year} ${view.vehicle?.make} ${view.vehicle?.model} for ${view.customer?.name} — status ${view.deal.status}.`,
      ),
      structuredContent: view,
    };
  },
};

export const listMyDeals: AppToolDef = {
  name: "list_my_deals",
  title: "List My Deals",
  description: "List the deals belonging to the current salesperson.",
  inputSchema: {},
  widget: WIDGETS.deal,
  annotations: { readOnlyHint: true },
  handler: async () => {
    const sp = await getActingSalesperson();
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
      })
      .from(deals)
      .innerJoin(customers, eq(deals.customerId, customers.id))
      .innerJoin(vehicles, eq(deals.vehicleId, vehicles.id))
      .where(eq(deals.salespersonId, sp.id))
      .orderBy(desc(deals.updatedAt));

    const list = rows.map((r) => ({
      id: r.id,
      status: r.status,
      type: r.type,
      monthlyPayment: r.monthlyPayment ? money(r.monthlyPayment) : null,
      frontGross: money(r.frontGross),
      backGross: money(r.backGross),
      customerName: `${r.customer.firstName} ${r.customer.lastName}`,
      vehicle: `${r.vehicle.year} ${r.vehicle.make} ${r.vehicle.model}`,
    }));

    return {
      content: text(
        `${sp.name} has ${list.length} deal(s):\n${list.map((d) => `#${d.id} ${d.customerName} · ${d.vehicle} · ${d.status}`).join("\n")}`,
      ),
      structuredContent: { kind: "dealList", scope: "salesperson", deals: list },
    };
  },
};

export const viewMyDeal: AppToolDef = {
  name: "view_my_deal",
  title: "View My Deal",
  description: "Show your current deal — vehicle, payment, trade credit, and status (buyer view).",
  inputSchema: {},
  widget: WIDGETS.deal,
  annotations: { readOnlyHint: true },
  handler: async () => {
    const buyer = await getActingBuyer();
    const [deal] = await db
      .select({ id: deals.id })
      .from(deals)
      .where(eq(deals.customerId, buyer.id))
      .orderBy(desc(deals.updatedAt))
      .limit(1);
    if (!deal)
      return { content: text("You don't have a deal yet."), isError: false };
    const view = await buildDealView(deal.id, "buyer");
    return {
      content: text(
        `Your deal #${deal.id}: ${view?.vehicle?.year} ${view?.vehicle?.make} ${view?.vehicle?.model} — ${view?.deal.monthlyPayment ? `$${view.deal.monthlyPayment}/mo` : "pending"}.`,
      ),
      structuredContent: view ?? undefined,
    };
  },
};

