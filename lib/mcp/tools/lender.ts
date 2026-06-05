import { z } from "zod";
import { and, eq, ilike, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import {
  creditApps,
  deals,
  lenders,
  lenderSubmissions,
  loanDecisions,
} from "@/db/schema";
import type { AppToolDef } from "../register";
import { WIDGETS } from "../widgets";
import { money, text } from "./helpers";
import { buildCreditStatus } from "./credit-view";
import { buildDealView } from "./deal-view";

export const listLenders: AppToolDef = {
  name: "list_lenders",
  title: "List Lenders",
  description:
    "List available lenders with each lender's ID, supported deal types, minimum credit tier, and base rate. Use these IDs — or pass lender names — to submit_to_lender. Call this before submit_to_lender so you target the right lenders.",
  inputSchema: {
    dealType: z
      .enum(["finance", "lease"])
      .optional()
      .describe("Only lenders that support this deal type"),
  },
  annotations: { readOnlyHint: true },
  handler: async ({ dealType }) => {
    const rows = await db.select().from(lenders).where(eq(lenders.active, true));
    const list = rows
      .filter((l) => !dealType || l.supportedDealTypes.includes(dealType as string))
      .map((l) => ({
        id: l.id,
        name: l.name,
        supportedDealTypes: l.supportedDealTypes,
        tierMinScore: l.tierMinScore,
        baseRate: money(l.baseRate),
      }));
    return {
      content: text(
        `${list.length} lender(s):\n` +
          list
            .map(
              (l) =>
                `#${l.id} ${l.name} — ${l.supportedDealTypes.join("/")}, min tier ${l.tierMinScore}, base ${l.baseRate}%`,
            )
            .join("\n"),
      ),
      structuredContent: { kind: "lenders", count: list.length, lenders: list },
    };
  },
};

export const submitToLender: AppToolDef = {
  name: "submit_to_lender",
  title: "Submit to Lenders",
  description:
    "Submit a credit application to one or more lenders. Identify lenders by lenderIds OR lenderNames (case-insensitive, partial match) — call list_lenders first to see who's available.",
  inputSchema: {
    creditAppId: z.number(),
    lenderIds: z.array(z.number()).optional().describe("Lender IDs to submit to"),
    lenderNames: z
      .array(z.string())
      .optional()
      .describe('Lender names, e.g. ["Prime Bank", "Capital Credit Union"]'),
  },
  widget: WIDGETS.credit,
  annotations: { readOnlyHint: false },
  handler: async ({ creditAppId, lenderIds, lenderNames }) => {
    const ids = ((lenderIds as number[] | undefined) ?? []).map(Number);
    const names = (lenderNames as string[] | undefined) ?? [];
    const byId = ids.length ? await db.select().from(lenders).where(inArray(lenders.id, ids)) : [];
    const byName: (typeof lenders.$inferSelect)[] = [];
    for (const n of names) {
      const [m] = await db.select().from(lenders).where(ilike(lenders.name, `%${n}%`)).limit(1);
      if (m) byName.push(m);
    }
    const lenderRows = Array.from(
      new Map([...byId, ...byName].map((l) => [l.id, l])).values(),
    );
    if (!lenderRows.length)
      return {
        content: text(
          "No matching lenders. Call list_lenders, then pass lenderIds or lenderNames.",
        ),
        isError: true,
      };

    for (const l of lenderRows) {
      await db.insert(lenderSubmissions).values({ creditAppId: Number(creditAppId), lenderId: l.id });
    }
    await db
      .update(creditApps)
      .set({ status: "in_review" })
      .where(eq(creditApps.id, Number(creditAppId)));

    const view = await buildCreditStatus(Number(creditAppId), "loan_officer");
    return {
      content: text(
        `Submitted credit app #${creditAppId} to ${lenderRows.map((l) => l.name).join(", ")}.`,
      ),
      structuredContent: view ?? undefined,
    };
  },
};

export const recordLenderDecision: AppToolDef = {
  name: "record_lender_decision",
  title: "Record Lender Decision",
  description:
    "Record a lender's decision (approved/conditional/declined) for a credit app. Advances the deal status.",
  inputSchema: {
    creditAppId: z.number(),
    lenderId: z.number().optional().describe("Lender ID (or use lenderName)"),
    lenderName: z.string().optional().describe('Lender name, e.g. "Prime Bank"'),
    status: z.enum(["approved", "conditional", "declined"]),
    rate: z.number().optional().describe("Approved APR percent"),
    term: z.number().optional().describe("Approved term in months"),
    maxAmount: z.number().optional().describe("Max financed amount"),
    stipulations: z.string().optional(),
  },
  widget: WIDGETS.credit,
  annotations: { readOnlyHint: false },
  handler: async ({ creditAppId, lenderId, lenderName, status, rate, term, maxAmount, stipulations }) => {
    // resolve the lender by id or name
    let resolvedLenderId: number | undefined =
      lenderId != null ? Number(lenderId) : undefined;
    if (resolvedLenderId == null && lenderName) {
      const [m] = await db
        .select()
        .from(lenders)
        .where(ilike(lenders.name, `%${String(lenderName)}%`))
        .limit(1);
      resolvedLenderId = m?.id;
    }
    if (resolvedLenderId == null)
      return {
        content: text("Specify a valid lenderId or lenderName (see list_lenders)."),
        isError: true,
      };

    // find (or create) the submission for this lender + app
    let [sub] = await db
      .select()
      .from(lenderSubmissions)
      .where(
        and(
          eq(lenderSubmissions.creditAppId, Number(creditAppId)),
          eq(lenderSubmissions.lenderId, resolvedLenderId),
        ),
      )
      .limit(1);
    if (!sub) {
      [sub] = await db
        .insert(lenderSubmissions)
        .values({ creditAppId: Number(creditAppId), lenderId: resolvedLenderId })
        .returning();
    }

    await db.insert(loanDecisions).values({
      lenderSubmissionId: sub.id,
      status: status as "approved",
      approvedRate: rate != null ? String(Number(rate)) : null,
      approvedTermMonths: term != null ? Number(term) : null,
      maxAmount: maxAmount != null ? String(Number(maxAmount)) : null,
      stipulations: stipulations ? String(stipulations) : null,
    });

    await db
      .update(creditApps)
      .set({ status: "decisioned" })
      .where(eq(creditApps.id, Number(creditAppId)));

    // advance the deal: approved -> ready, otherwise -> lender_decision
    const [app] = await db
      .select()
      .from(creditApps)
      .where(eq(creditApps.id, Number(creditAppId)))
      .limit(1);
    if (app) {
      await db
        .update(deals)
        .set({ status: status === "approved" ? "ready" : "lender_decision", updatedAt: new Date() })
        .where(eq(deals.id, app.dealId));
    }

    const view = await buildCreditStatus(Number(creditAppId), "loan_officer");
    return {
      content: text(`Recorded ${status} decision for credit app #${creditAppId}.`),
      structuredContent: view ?? undefined,
    };
  },
};

export const setFinancingTerms: AppToolDef = {
  name: "set_financing_terms",
  title: "Set Financing Terms",
  description: "Update a deal's financing terms (APR and term) after a lender decision.",
  inputSchema: {
    dealId: z.number(),
    apr: z.number().optional(),
    term: z.number().optional(),
  },
  widget: WIDGETS.deal,
  annotations: { readOnlyHint: false },
  handler: async ({ dealId, apr, term }) => {
    const set: Record<string, unknown> = { updatedAt: new Date() };
    if (apr != null) set.apr = String(Number(apr));
    if (term != null) set.termMonths = Number(term);
    await db.update(deals).set(set).where(eq(deals.id, Number(dealId)));

    // loan officer sees full financial detail, same as a manager
    const view = await buildDealView(Number(dealId), "manager");
    return {
      content: text(`Updated financing terms on deal #${dealId}.`),
      structuredContent: view ?? undefined,
    };
  },
};
