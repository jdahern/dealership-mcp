import { z } from "zod";

// Output schemas (Zod raw shapes) for each tool's `structuredContent`. The SDK
// validates non-error results against these and advertises them in tools/list.
// Parsing is non-strict (extra keys allowed), so fields that vary by persona
// scope (gross/cost/reserve) are optional.

const vehicleLite = z.object({
  id: z.number(),
  year: z.number(),
  make: z.string(),
  model: z.string(),
  trim: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  mileage: z.number().optional(),
  sellingPrice: z.number(),
  msrp: z.number().optional(),
  certified: z.boolean().optional(),
  cost: z.number().optional(),
  imageUrl: z.string().nullable().optional(),
});

const scenario = z.object({
  type: z.string().optional(),
  term: z.number(),
  apr: z.number(),
  monthlyPayment: z.number(),
  amountFinanced: z.number().optional(),
  taxes: z.number().optional(),
  docFee: z.number().optional(),
  down: z.number(),
  tradeEquity: z.number().optional(),
  label: z.string().optional(),
});

const dealCore = z.object({
  id: z.number(),
  type: z.string(),
  status: z.string(),
  downPayment: z.number(),
  termMonths: z.number().nullable(),
  apr: z.number().nullable(),
  monthlyPayment: z.number().nullable(),
  frontGross: z.number().optional(),
  backGross: z.number().optional(),
  notes: z.string().nullable().optional(),
});

const decision = z.object({
  lender: z.string(),
  status: z.string(),
  rate: z.number().nullable(),
  term: z.number().nullable(),
  maxAmount: z.number().nullable(),
  stipulations: z.string().nullable(),
});

export const inventoryOutput = {
  kind: z.literal("inventory"),
  count: z.number(),
  vehicles: z.array(vehicleLite),
};

export const customerOutput = {
  kind: z.literal("customer"),
  customer: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
  }),
};

export const deskingOutput = {
  kind: z.literal("desking"),
  dealId: z.number().nullable(),
  vehicle: vehicleLite,
  type: z.string(),
  tradeEquity: z.number(),
  selected: scenario,
  scenarios: z.array(scenario),
};

export const dealOutput = {
  kind: z.literal("deal"),
  scope: z.string(),
  deal: dealCore,
  customer: z.object({ id: z.number(), name: z.string() }).nullable(),
  vehicle: vehicleLite.nullable(),
  trade: z
    .object({
      year: z.number().nullable(),
      make: z.string().nullable(),
      model: z.string().nullable(),
      mileage: z.number().nullable().optional(),
      acv: z.number(),
      payoff: z.number(),
      equity: z.number(),
    })
    .nullable(),
  products: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      type: z.string(),
      soldPrice: z.number(),
      cost: z.number().optional(),
    }),
  ),
  reserve: z.number().optional(),
  insights: z.array(z.string()).optional(),
};

export const dealListOutput = {
  kind: z.literal("dealList"),
  scope: z.string(),
  deals: z.array(
    z.object({
      id: z.number(),
      status: z.string(),
      type: z.string(),
      monthlyPayment: z.number().nullable(),
      frontGross: z.number(),
      backGross: z.number(),
      customerName: z.string(),
      vehicle: z.string(),
    }),
  ),
};

export const productsOutput = {
  kind: z.literal("products"),
  count: z.number(),
  products: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      type: z.string(),
      cost: z.number(),
      retail: z.number(),
      markup: z.number(),
      termMonths: z.number().nullable().optional(),
    }),
  ),
};

export const creditStatusOutput = {
  kind: z.literal("credit"),
  view: z.literal("status"),
  scope: z.string(),
  app: z.object({
    id: z.number(),
    status: z.string(),
    annualIncome: z.number().nullable(),
  }),
  customer: z.object({ name: z.string() }).nullable(),
  deal: z
    .object({
      id: z.number(),
      vehicle: z.string(),
      monthlyPayment: z.number().nullable(),
      status: z.string(),
    })
    .nullable(),
  steps: z.array(z.object({ label: z.string(), done: z.boolean() })),
  decisions: z.array(decision),
};

export const creditQueueOutput = {
  kind: z.literal("credit"),
  view: z.literal("queue"),
  apps: z.array(
    z.object({
      id: z.number(),
      status: z.string(),
      dealId: z.number(),
      income: z.number().nullable(),
      customerName: z.string(),
      vehicle: z.string(),
    }),
  ),
};

export const lendersOutput = {
  kind: z.literal("lenders"),
  count: z.number(),
  lenders: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      supportedDealTypes: z.array(z.string()),
      tierMinScore: z.number(),
      baseRate: z.number(),
    }),
  ),
};

export const dashboardOutput = {
  kind: z.literal("dashboard"),
  deals: z.array(
    z.object({
      id: z.number(),
      status: z.string(),
      type: z.string(),
      monthlyPayment: z.number().nullable(),
      frontGross: z.number(),
      backGross: z.number(),
      customerName: z.string(),
      vehicle: z.string(),
      salesperson: z.string(),
    }),
  ),
  totals: z.object({
    count: z.number(),
    front: z.number(),
    back: z.number(),
    avg: z.number(),
  }),
};
