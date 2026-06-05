import { db } from "@/db/client";
import { salespeople, customers } from "@/db/schema";
import { eq } from "drizzle-orm";

// Money columns come back as strings (numeric). Normalize to number.
export function num(v: unknown): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : Number(v);
}

export function money(v: unknown): number {
  return Math.round(num(v) * 100) / 100;
}

/** Persona = endpoint, so the salesperson identity is fixed for the demo. */
export const DEMO_SALESPERSON_EMAIL = "jordan@demodealer.com";

export async function getActingSalesperson() {
  const [row] = await db
    .select()
    .from(salespeople)
    .where(eq(salespeople.email, DEMO_SALESPERSON_EMAIL))
    .limit(1);
  return row;
}

/** The buyer persona acts as a single fixed demo customer. */
export const DEMO_BUYER_EMAIL = "maria.lopez@gmail.com";

export async function getActingBuyer() {
  const [row] = await db
    .select()
    .from(customers)
    .where(eq(customers.email, DEMO_BUYER_EMAIL))
    .limit(1);
  return row;
}

export function text(s: string) {
  return [{ type: "text" as const, text: s }];
}
