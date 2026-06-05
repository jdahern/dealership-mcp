import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { products, productType } from "@/db/schema";
import type { AppToolDef } from "../register";
import { WIDGETS } from "../widgets";
import { money, text } from "./helpers";

const PRODUCT_TYPES = productType.enumValues;

export const listProducts: AppToolDef = {
  name: "list_products",
  title: "List F&I Products",
  description:
    "List the F&I product menu (warranty, GAP, maintenance, tire & wheel, paint protection) with each product's ID, retail price, and markup. Use these IDs — or pass the product names — to add_products. Always call this before add_products so you attach the correct product.",
  inputSchema: {
    type: z
      .enum(PRODUCT_TYPES as [string, ...string[]])
      .optional()
      .describe("Filter to one product category"),
  },
  widget: WIDGETS.products,
  annotations: { readOnlyHint: true },
  handler: async ({ type }) => {
    const rows = type
      ? await db.select().from(products).where(eq(products.type, type as "gap"))
      : await db.select().from(products);

    const list = rows.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      cost: money(p.cost),
      retail: money(p.retailPrice),
      markup: money(p.retailPrice) - money(p.cost),
      termMonths: p.termMonths,
    }));

    const summary = list
      .map((p) => `#${p.id} ${p.name} [${p.type}] — ${p.retail.toLocaleString()} retail`)
      .join("\n");

    return {
      content: text(`F&I product menu (${list.length}):\n${summary}`),
      structuredContent: { kind: "products", count: list.length, products: list },
    };
  },
};
