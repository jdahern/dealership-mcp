// ---------------------------------------------------------------------------
// Pure payment-calculation helpers shared by desking tools, the seed, and the
// desking widget. Demo-grade math — not a real F&I engine.
// ---------------------------------------------------------------------------

export const DOC_FEE = 699;
export const TAX_RATE = 0.0825; // flat demo sales-tax rate

export type DealKind = "cash" | "finance" | "lease";

export interface QuoteInput {
  price: number; // vehicle selling price
  down?: number; // cash down
  tradeEquity?: number; // net trade (acv - payoff), can be negative
  term?: number; // months (finance/lease)
  apr?: number; // annual %, e.g. 6.9
}

export interface QuoteResult {
  type: DealKind;
  price: number;
  taxes: number;
  docFee: number;
  amountFinanced: number;
  down: number;
  tradeEquity: number;
  term: number;
  apr: number;
  monthlyPayment: number;
  label: string;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Standard amortized monthly payment. */
export function amortize(principal: number, annualRatePct: number, months: number): number {
  if (months <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return round2(principal / months);
  const p = (principal * r) / (1 - Math.pow(1 + r, -months));
  return round2(p);
}

export function quoteCash(input: QuoteInput): QuoteResult {
  const taxes = round2(input.price * TAX_RATE);
  const tradeEquity = input.tradeEquity ?? 0;
  const total = round2(input.price + taxes + DOC_FEE - tradeEquity);
  return {
    type: "cash",
    price: input.price,
    taxes,
    docFee: DOC_FEE,
    amountFinanced: 0,
    down: total,
    tradeEquity,
    term: 0,
    apr: 0,
    monthlyPayment: 0,
    label: `Cash · $${total.toLocaleString()} due`,
  };
}

export function quoteFinance(input: QuoteInput): QuoteResult {
  const term = input.term ?? 72;
  const apr = input.apr ?? 6.9;
  const down = input.down ?? 0;
  const tradeEquity = input.tradeEquity ?? 0;
  const taxes = round2(input.price * TAX_RATE);
  const amountFinanced = round2(input.price + taxes + DOC_FEE - down - tradeEquity);
  const monthlyPayment = amortize(amountFinanced, apr, term);
  return {
    type: "finance",
    price: input.price,
    taxes,
    docFee: DOC_FEE,
    amountFinanced,
    down,
    tradeEquity,
    term,
    apr,
    monthlyPayment,
    label: `Finance · ${term}mo @ ${apr}%`,
  };
}

export function quoteLease(input: QuoteInput): QuoteResult {
  const term = input.term ?? 36;
  const apr = input.apr ?? 5.5; // used as money-factor-equivalent rate
  const down = input.down ?? 0;
  const tradeEquity = input.tradeEquity ?? 0;
  // crude residual: 58% of price for a 36mo demo lease
  const residual = round2(input.price * 0.58);
  const taxes = round2(input.price * TAX_RATE);
  const capCost = round2(input.price + taxes + DOC_FEE - down - tradeEquity);
  const depreciation = round2((capCost - residual) / term);
  const rentCharge = round2(((capCost + residual) * (apr / 100 / 12)) / 1);
  const monthlyPayment = round2(depreciation + rentCharge);
  return {
    type: "lease",
    price: input.price,
    taxes,
    docFee: DOC_FEE,
    amountFinanced: capCost,
    down,
    tradeEquity,
    term,
    apr,
    monthlyPayment,
    label: `Lease · ${term}mo @ ${apr}%`,
  };
}

export function buildQuote(type: DealKind, input: QuoteInput): QuoteResult {
  if (type === "cash") return quoteCash(input);
  if (type === "lease") return quoteLease(input);
  return quoteFinance(input);
}

/** A spread of comparison scenarios for the desking widget chips. */
export function scenarioSpread(type: DealKind, input: QuoteInput): QuoteResult[] {
  if (type === "lease") {
    return [24, 36, 48].map((term) => buildQuote("lease", { ...input, term }));
  }
  if (type === "cash") return [quoteCash(input)];
  return [48, 60, 72].map((term) => buildQuote("finance", { ...input, term }));
}
