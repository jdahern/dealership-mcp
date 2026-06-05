import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { vehicles, deals, tradeIns, paymentCalculations } from "@/db/schema";
import type { AppToolDef } from "../register";
import { WIDGETS } from "../widgets";
import { deskingOutput } from "../schemas";
import { money, num, text } from "./helpers";
import { buildQuote, scenarioSpread, type DealKind } from "../payment-math";

const dealKind = z.enum(["cash", "finance", "lease"]);

export const buildQuoteTool: AppToolDef = {
  name: "build_quote",
  title: "Build Quote",
  description:
    "Build a desking quote for a vehicle — computes monthly payment and a spread of comparison scenarios (cash/finance/lease). If dealId is given, the quote is saved to that deal.",
  inputSchema: {
    vehicleId: z.number().describe("Vehicle to quote"),
    type: dealKind.optional().describe("Deal type (default finance)"),
    down: z.number().optional().describe("Cash down in dollars"),
    term: z.number().optional().describe("Term in months"),
    apr: z.number().optional().describe("APR percent, e.g. 6.9"),
    dealId: z
      .number()
      .optional()
      .describe("Existing deal to attach this quote to (also pulls in its trade equity)"),
  },
  widget: WIDGETS.desking,
  outputSchema: deskingOutput,
  annotations: { readOnlyHint: false, idempotentHint: true },
  handler: async ({ vehicleId, type, down, term, apr, dealId }) => {
    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, Number(vehicleId)))
      .limit(1);
    if (!vehicle) {
      return { content: text(`No vehicle #${vehicleId}.`), isError: true };
    }

    const kind = (type as DealKind) ?? "finance";
    const price = money(vehicle.sellingPrice);

    // pull trade equity if quoting against an existing deal
    let tradeEquity = 0;
    if (dealId) {
      const [trade] = await db
        .select()
        .from(tradeIns)
        .where(eq(tradeIns.dealId, Number(dealId)))
        .limit(1);
      if (trade) tradeEquity = money(trade.acv) - money(trade.payoff);
    }

    const input = {
      price,
      down: down != null ? Number(down) : undefined,
      term: term != null ? Number(term) : undefined,
      apr: apr != null ? Number(apr) : undefined,
      tradeEquity,
    };

    const selected = buildQuote(kind, input);
    const scenarios = scenarioSpread(kind, input);

    // persist to the deal if requested
    if (dealId) {
      await db.insert(paymentCalculations).values({
        dealId: Number(dealId),
        type: kind,
        termMonths: selected.term,
        apr: String(selected.apr),
        downPayment: String(selected.down),
        monthlyPayment: String(selected.monthlyPayment),
        scenarioLabel: selected.label,
      });
      await db
        .update(deals)
        .set({
          type: kind,
          downPayment: String(selected.down),
          termMonths: selected.term || null,
          apr: String(selected.apr),
          monthlyPayment: String(selected.monthlyPayment),
          updatedAt: new Date(),
        })
        .where(eq(deals.id, Number(dealId)));
    }

    return {
      content: text(
        `${selected.label} on ${vehicle.year} ${vehicle.make} ${vehicle.model}: $${selected.monthlyPayment.toLocaleString()}/mo (financed $${num(selected.amountFinanced).toLocaleString()}, ${selected.down.toLocaleString()} down).`,
      ),
      structuredContent: {
        kind: "desking",
        dealId: dealId ?? null,
        vehicle: {
          id: vehicle.id,
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          trim: vehicle.trim,
          sellingPrice: price,
          imageUrl: vehicle.imageUrl,
        },
        type: kind,
        tradeEquity,
        selected,
        scenarios,
      },
    };
  },
};
