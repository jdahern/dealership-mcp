import { z } from "zod";
import { desc, eq, ne } from "drizzle-orm";
import { db } from "@/db/client";
import { deals, customers, vehicles, salespeople } from "@/db/schema";
import type { AppToolDef } from "../register";
import { WIDGETS } from "../widgets";
import { money, text } from "./helpers";
import { buildDealView } from "./deal-view";

export const listAllDeals: AppToolDef = {
  name: "list_all_deals",
  title: "List All Deals",
  description: "Show every open deal in the store with status and gross — the manager's deal board.",
  inputSchema: {
    openOnly: z.boolean().optional().describe("Exclude delivered/ready deals (default false)"),
  },
  widget: WIDGETS.dashboard,
  annotations: { readOnlyHint: true },
  handler: async ({ openOnly }) => {
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
      .where(openOnly ? ne(deals.status, "ready") : undefined)
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
      salesperson: r.sp.name,
    }));

    const front = list.reduce((s, d) => s + d.frontGross, 0);
    const back = list.reduce((s, d) => s + d.backGross, 0);
    const totals = {
      count: list.length,
      front: Math.round(front),
      back: Math.round(back),
      avg: list.length ? Math.round((front + back) / list.length) : 0,
    };

    return {
      content: text(
        `${list.length} deal(s). Total front $${totals.front.toLocaleString()}, back $${totals.back.toLocaleString()}, avg $${totals.avg.toLocaleString()}/deal.`,
      ),
      structuredContent: { kind: "dashboard", deals: list, totals },
    };
  },
};

export const dealProfitability: AppToolDef = {
  name: "deal_profitability",
  title: "Deal Profitability",
  description: "Break down a single deal's profitability (front gross, back gross, reserve) with insights.",
  inputSchema: { dealId: z.number() },
  widget: WIDGETS.deal,
  annotations: { readOnlyHint: true },
  handler: async ({ dealId }) => {
    const view = await buildDealView(Number(dealId), "manager");
    if (!view) return { content: text(`No deal #${dealId}.`), isError: true };

    const insights: string[] = [];
    const back = view.deal.backGross ?? 0;
    if (back === 0) insights.push("No F&I products sold — back-end gross left on the table.");
    const hasGap = view.products.some((p) => p.type === "gap");
    if (!hasGap && view.deal.type !== "cash")
      insights.push("No GAP product attached on a financed deal.");
    // crude reserve estimate: 0.5pt spread over the term
    const reserve =
      view.deal.apr && view.deal.termMonths
        ? Math.round((view.vehicle?.sellingPrice ?? 0) * 0.004)
        : 0;

    return {
      content: text(
        `Deal #${dealId}: front ${money(view.deal.frontGross).toLocaleString()}, back ${back.toLocaleString()}, est. reserve ~$${reserve.toLocaleString()}.` +
          (insights.length ? " " + insights.join(" ") : ""),
      ),
      structuredContent: { ...view, reserve, insights },
    };
  },
};

export const approveDeal: AppToolDef = {
  name: "approve_deal",
  title: "Approve Deal",
  description: "Approve a deal and mark it ready for delivery.",
  inputSchema: { dealId: z.number() },
  widget: WIDGETS.deal,
  annotations: { readOnlyHint: false },
  handler: async ({ dealId }) => {
    await db
      .update(deals)
      .set({ status: "ready", updatedAt: new Date() })
      .where(eq(deals.id, Number(dealId)));
    const view = await buildDealView(Number(dealId), "manager");
    return {
      content: text(`Approved deal #${dealId} — marked ready.`),
      structuredContent: view ?? undefined,
    };
  },
};

export const reassignSalesperson: AppToolDef = {
  name: "reassign_salesperson",
  title: "Reassign Salesperson",
  description: "Reassign a deal to a different salesperson.",
  inputSchema: { dealId: z.number(), salespersonId: z.number() },
  widget: WIDGETS.deal,
  annotations: { readOnlyHint: false },
  handler: async ({ dealId, salespersonId }) => {
    await db
      .update(deals)
      .set({ salespersonId: Number(salespersonId), updatedAt: new Date() })
      .where(eq(deals.id, Number(dealId)));
    const view = await buildDealView(Number(dealId), "manager");
    return {
      content: text(`Reassigned deal #${dealId} to salesperson #${salespersonId}.`),
      structuredContent: view ?? undefined,
    };
  },
};
