import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { creditApps, deals, customers, vehicles } from "@/db/schema";
import type { AppToolDef } from "../register";
import { WIDGETS } from "../widgets";
import { money, getActingBuyer, text } from "./helpers";
import { buildCreditStatus } from "./credit-view";

// --- Buyer tools -----------------------------------------------------------

export const submitCreditApp: AppToolDef = {
  name: "submit_credit_app",
  title: "Submit Credit Application",
  description:
    "Submit a credit application for your current deal so the finance office can send it to lenders.",
  inputSchema: {
    annualIncome: z.number().describe("Your annual income in dollars"),
    ssnLast4: z.string().optional().describe("Last 4 of SSN (demo only)"),
  },
  widget: WIDGETS.credit,
  annotations: { readOnlyHint: false },
  handler: async ({ annualIncome, ssnLast4 }) => {
    const buyer = await getActingBuyer();
    // most recent deal for this buyer
    const [deal] = await db
      .select()
      .from(deals)
      .where(eq(deals.customerId, buyer.id))
      .orderBy(desc(deals.updatedAt))
      .limit(1);
    if (!deal)
      return { content: text("You don't have an active deal yet."), isError: true };

    // reuse an existing app for this deal or create one
    const [existing] = await db
      .select()
      .from(creditApps)
      .where(eq(creditApps.dealId, deal.id))
      .limit(1);

    let appId: number;
    if (existing) {
      await db
        .update(creditApps)
        .set({ status: "submitted", annualIncome: String(Number(annualIncome)), submittedAt: new Date() })
        .where(eq(creditApps.id, existing.id));
      appId = existing.id;
    } else {
      const [created] = await db
        .insert(creditApps)
        .values({
          customerId: buyer.id,
          dealId: deal.id,
          status: "submitted",
          annualIncome: String(Number(annualIncome)),
          ssnLast4: ssnLast4 ? String(ssnLast4) : null,
          submittedAt: new Date(),
        })
        .returning();
      appId = created.id;
    }

    await db.update(deals).set({ status: "credit_submitted", updatedAt: new Date() }).where(eq(deals.id, deal.id));

    const view = await buildCreditStatus(appId, "buyer");
    return {
      content: text(`Credit application #${appId} submitted for deal #${deal.id}.`),
      structuredContent: view ?? undefined,
    };
  },
};

export const checkLoanStatus: AppToolDef = {
  name: "check_loan_status",
  title: "Check Loan Status",
  description: "Check the status of your credit application and any lender decisions.",
  inputSchema: {},
  widget: WIDGETS.credit,
  annotations: { readOnlyHint: true },
  handler: async () => {
    const buyer = await getActingBuyer();
    const [app] = await db
      .select()
      .from(creditApps)
      .where(eq(creditApps.customerId, buyer.id))
      .orderBy(desc(creditApps.id))
      .limit(1);
    if (!app)
      return {
        content: text("No credit application on file yet — submit one to get started."),
        isError: false,
      };
    const view = await buildCreditStatus(app.id, "buyer");
    return {
      content: text(`Credit application #${app.id} status: ${app.status}.`),
      structuredContent: view ?? undefined,
    };
  },
};

// --- Loan officer tool -----------------------------------------------------

export const listCreditApps: AppToolDef = {
  name: "list_credit_apps",
  title: "List Credit Applications",
  description:
    "List credit applications in the finance queue, optionally filtered by status (draft/submitted/in_review/decisioned).",
  inputSchema: {
    status: z.enum(["draft", "submitted", "in_review", "decisioned"]).optional(),
  },
  widget: WIDGETS.credit,
  annotations: { readOnlyHint: true },
  handler: async ({ status }) => {
    const conds = status ? [eq(creditApps.status, status as "submitted")] : [];
    const rows = await db
      .select({
        id: creditApps.id,
        status: creditApps.status,
        income: creditApps.annualIncome,
        dealId: creditApps.dealId,
        customer: customers,
        vehicle: vehicles,
      })
      .from(creditApps)
      .innerJoin(customers, eq(creditApps.customerId, customers.id))
      .innerJoin(deals, eq(creditApps.dealId, deals.id))
      .innerJoin(vehicles, eq(deals.vehicleId, vehicles.id))
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(creditApps.id));

    const apps = rows.map((r) => ({
      id: r.id,
      status: r.status,
      dealId: r.dealId,
      income: r.income ? money(r.income) : null,
      customerName: `${r.customer.firstName} ${r.customer.lastName}`,
      vehicle: `${r.vehicle.year} ${r.vehicle.make} ${r.vehicle.model}`,
    }));

    return {
      content: text(
        `${apps.length} credit app(s)${status ? ` (${status})` : ""}:\n${apps.map((a) => `#${a.id} ${a.customerName} · deal ${a.dealId} · ${a.status}`).join("\n")}`,
      ),
      structuredContent: { kind: "credit", view: "queue", apps },
    };
  },
};
