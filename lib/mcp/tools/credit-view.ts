import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  creditApps,
  deals,
  vehicles,
  customers,
  lenderSubmissions,
  loanDecisions,
  lenders,
} from "@/db/schema";
import { money } from "./helpers";

/** Buyer/loan-officer "status" view for a single credit app. */
export async function buildCreditStatus(creditAppId: number, scope: "buyer" | "loan_officer") {
  const [app] = await db
    .select()
    .from(creditApps)
    .where(eq(creditApps.id, creditAppId))
    .limit(1);
  if (!app) return null;

  const [deal] = await db.select().from(deals).where(eq(deals.id, app.dealId)).limit(1);
  const [vehicle] = deal
    ? await db.select().from(vehicles).where(eq(vehicles.id, deal.vehicleId)).limit(1)
    : [undefined];
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, app.customerId))
    .limit(1);

  const subs = await db
    .select({
      subId: lenderSubmissions.id,
      lender: lenders.name,
      submittedAt: lenderSubmissions.submittedAt,
    })
    .from(lenderSubmissions)
    .innerJoin(lenders, eq(lenderSubmissions.lenderId, lenders.id))
    .where(eq(lenderSubmissions.creditAppId, creditAppId));

  const decisions: {
    lender: string;
    status: string;
    rate: number | null;
    term: number | null;
    maxAmount: number | null;
    stipulations: string | null;
  }[] = [];
  for (const s of subs) {
    const [dec] = await db
      .select()
      .from(loanDecisions)
      .where(eq(loanDecisions.lenderSubmissionId, s.subId))
      .limit(1);
    decisions.push({
      lender: s.lender,
      status: dec?.status ?? "pending",
      rate: dec?.approvedRate ? money(dec.approvedRate) : null,
      term: dec?.approvedTermMonths ?? null,
      maxAmount: dec?.maxAmount ? money(dec.maxAmount) : null,
      stipulations: dec?.stipulations ?? null,
    });
  }

  const hasDecision = decisions.some((d) => d.status !== "pending");
  const steps = [
    { label: "Submitted", done: !!app.submittedAt },
    { label: "Sent to lenders", done: subs.length > 0 },
    { label: "Decision", done: hasDecision },
  ];

  return {
    kind: "credit" as const,
    view: "status" as const,
    scope,
    app: {
      id: app.id,
      status: app.status,
      annualIncome: scope === "loan_officer" && app.annualIncome ? money(app.annualIncome) : null,
    },
    customer: customer ? { name: `${customer.firstName} ${customer.lastName}` } : null,
    deal: deal
      ? {
          id: deal.id,
          vehicle: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "",
          monthlyPayment: deal.monthlyPayment ? money(deal.monthlyPayment) : null,
          status: deal.status,
        }
      : null,
    steps,
    decisions,
  };
}
